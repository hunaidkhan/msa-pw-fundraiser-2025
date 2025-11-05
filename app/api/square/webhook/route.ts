// app/api/square/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { put, list } from "@vercel/blob"; // ⬅️ NEW

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Donation = {
  id: string;
  teamRef: string | null;
  amountCents: number;
  currency: "USD" | "CAD" | string;
  email?: string;
  receiptUrl?: string;
  createdAt: string;
  raw?: unknown;
};

type SquarePaymentMoney = {
  amount?: bigint | number | null;
  currency?: string | null;
};

type SquarePayment = {
  id: string;
  status?: string;
  amountMoney?: SquarePaymentMoney | null;
  note?: string | null;
  createdAt?: string | null;
  receiptUrl?: string | null;
  customerDetails?: { emailAddress?: string | null } | null;
  orderId?: string | null;
};

type SquareWebhookEvent = {
  id?: string;
  type?: string;
  created_at?: string;
  data?: {
    type?: string;
    id?: string;
    object?: {
      payment?: SquarePayment;
    };
  };
};

// ---------- config / helpers ----------
const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
const WEBHOOK_URL   = process.env.SQUARE_WEBHOOK_URL ?? "";
const BLOB_TOKEN    = process.env.BLOB_READ_WRITE_TOKEN; // optional

function parseTeamRef(note?: string | null): string | null {
  if (!note) return null;
  const mSlug = note.match(/(?:^|;)\s*team=([^;]+)/i);
  const mId   = note.match(/(?:^|;)\s*teamId=([^;]+)/i);
  const ref = (mSlug?.[1] ?? mId?.[1] ?? "").trim();
  return ref || null;
}

function verifySquareSignature(bodyRaw: string, headerSig: string | null): boolean {
  if (!headerSig || !SIGNATURE_KEY || !WEBHOOK_URL) return false;
  try {
    const hmac = crypto.createHmac("sha256", SIGNATURE_KEY);
    hmac.update(WEBHOOK_URL + bodyRaw, "utf8");
    const expected = hmac.digest("base64");
    return headerSig.split(",").map(s => s.trim()).includes(expected);
  } catch {
    return false;
  }
}

async function persistDonationToBlob(paymentId: string, teamRef: string, amountCents: number, createdAt: string) {
  // one file per payment id → dedupe by filename
  await put(`donations/${paymentId}.json`,
    JSON.stringify({ paymentId, teamRef, amountCents, createdAt }),
    {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: false, // if exists => dedup
    }
  ).catch((err: unknown) => {
    const msg = String((err as any)?.message ?? "");
    if (msg.includes("already exists")) {
      // already processed; safe to ignore
      return;
    }
    throw err;
  });
}

// (Optional) utility for later: read all donations back
export async function readAllDonationsFromBlob(): Promise<Donation[]> {
  const { blobs } = await list({ prefix: "donations/", token: BLOB_TOKEN });
  const rows = await Promise.all(
    blobs.map(b => fetch(b.url, { cache: "no-store" }).then(r => r.json() as Promise<Donation>))
  );
  return rows;
}

// ---------- route handlers ----------
export async function POST(req: Request) {
  const rawBody = await req.text();

  const headerSig =
    req.headers.get("x-square-hmacsha256-signature") ||
    req.headers.get("x-square-signature");

  const isSigOk = verifySquareSignature(rawBody, headerSig);

  if (process.env.NODE_ENV === "production") {
    if (!isSigOk) {
      console.error("[Square Webhook] Signature verification FAILED");
      return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
    }
  } else {
    if (!SIGNATURE_KEY || !WEBHOOK_URL) {
      console.warn("[Square Webhook] Skipping signature verification in dev (missing key or URL).");
    } else if (!isSigOk) {
      console.warn("[Square Webhook] Signature mismatch (dev) — check SQUARE_WEBHOOK_URL & key.");
    }
  }

  let evt: SquareWebhookEvent;
  try {
    evt = JSON.parse(rawBody);
  } catch (e) {
    console.error("[Square Webhook] Invalid JSON body:", e);
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const type = evt.type ?? evt.data?.type ?? "";
  if (!type.startsWith("payment.")) {
    return NextResponse.json({ ok: true, ignored: type }, { status: 200 });
  }

  const payment: SquarePayment | undefined = evt.data?.object?.payment as any;
  if (!payment?.id) {
    return NextResponse.json({ ok: false, error: "no payment in payload" }, { status: 400 });
    }

  const status = (payment.status ?? "").toUpperCase();
  if (status !== "COMPLETED") {
    return NextResponse.json({ ok: true, skipped: `status=${status}` }, { status: 200 });
  }

  const amountRaw = payment.amountMoney?.amount ?? 0;
  const amountCents =
    typeof amountRaw === "bigint" ? Number(amountRaw)
    : typeof amountRaw === "number" ? amountRaw
    : 0;

  const record: Donation = {
    id: payment.id,
    teamRef: parseTeamRef(payment.note),
    amountCents,
    currency: (payment.amountMoney?.currency ?? "USD") as string,
    email: payment.customerDetails?.emailAddress ?? undefined,
    receiptUrl: payment.receiptUrl ?? undefined,
    createdAt: payment.createdAt ?? new Date().toISOString(),
    raw: process.env.NODE_ENV === "production" ? undefined : payment,
  };

  try {
    const teamRef = parseTeamRef(payment.note); // you already have this
    if (!teamRef) return NextResponse.json({ ok: true, skipped: "no teamRef" });
    await persistDonationToBlob(payment.id, teamRef, amountCents, payment.createdAt ?? new Date().toISOString());
  } catch (e) {
    console.error("[Square Webhook] Failed to persist donation:", e);
    return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "square/webhook" }, { status: 200 });
}
