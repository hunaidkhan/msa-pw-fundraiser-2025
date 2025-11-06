// app/api/square/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { upsertDonation, type Donation } from "@/lib/donationsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SquareWebhookEvent = {
  id?: string;
  type?: string; // e.g. "payment.created"
  created_at?: string;
  data?: {
    type?: string; // e.g. "payment"
    id?: string;
    object?: {
      payment?: any; // raw payment object (snake_case from Square)
    };
  };
};

const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
const WEBHOOK_URL   = process.env.SQUARE_WEBHOOK_URL ?? "";

/** Parse team ref from `note` like "teamSlug=team-falcon" */
function parseTeamRef(note?: string | null): string | null {
  if (!note) return null;
  const match = note.match(/teamSlug=([^\s;]+)/i);
  const slug = match?.[1]?.trim();
  console.log("[Webhook] Parsed team slug:", slug, "from note:", note);
  return slug || null;
}

/** Verify Square webhook HMAC signature (URL + rawBody, base64) */
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

/** Normalize payment to camelCase while preserving raw blob for debugging */
function normalizePayment(p: any) {
  const amountMoney     = p?.amountMoney     ?? p?.amount_money     ?? null;
  const totalMoney      = p?.totalMoney      ?? p?.total_money      ?? null;
  const approvedMoney   = p?.approvedMoney   ?? p?.approved_money   ?? null;
  const customerDetails = p?.customerDetails ?? p?.customer_details ?? null;

  return {
    id: p?.id ?? null,
    status: p?.status ?? null,
    note: p?.note ?? null,
    createdAt: p?.createdAt ?? p?.created_at ?? null,
    receiptUrl: p?.receiptUrl ?? p?.receipt_url ?? null,
    customerDetails: customerDetails
      ? { emailAddress: customerDetails.emailAddress ?? customerDetails.email_address ?? null }
      : null,
    orderId: p?.orderId ?? p?.order_id ?? null,
    amountMoney,
    totalMoney,
    approvedMoney,
    raw: p,
  };
}

/** Extract integer cents from a Square money object or primitive */
function toCents(x: any): number | null {
  if (x == null) return null;

  // If it's a money object, prefer its .amount
  const v = typeof x === "object" && "amount" in x ? x.amount : x;

  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  // JSON won't give bigint; if it somehow does, handle it:
  if (typeof v === "bigint") return Number(v);

  return null;
}

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
    console.log("[Square Webhook] Ignoring non-payment event:", type);
    return NextResponse.json({ ok: true, ignored: type }, { status: 200 });
  }

  console.log("[Square Webhook] Processing event:", type);

  const rawPayment = evt.data?.object?.payment as any;
  if (!rawPayment?.id) {
    console.error("[Square Webhook] No payment in payload");
    return NextResponse.json({ ok: false, error: "no payment in payload" }, { status: 400 });
  }

  // Verbose logging in non-prod to inspect payload shape
  if (process.env.NODE_ENV !== "production") {
    console.log("[Square Webhook] Full payment object:", JSON.stringify(rawPayment, null, 2));
  }

  const payment = normalizePayment(rawPayment);
  const status = String(payment.status ?? "").toUpperCase();

  // Sandbox often reports APPROVED; Prod reports COMPLETED
  const validStatuses = new Set(["COMPLETED", "APPROVED"]);
  if (!validStatuses.has(status)) {
    console.log("[Square Webhook] Skipping payment with status:", status);
    return NextResponse.json({ ok: true, skipped: `status=${status}` }, { status: 200 });
  }

  console.log("[Square Webhook] ✓ Processing successful payment with status:", status);

  // Prefer amountMoney; fall back to totalMoney/approvedMoney
  let amountCents =
    toCents(payment.amountMoney) ??
    toCents(payment.totalMoney) ??
    toCents(payment.approvedMoney) ??
    0;

  console.log("[Square Webhook] Parsed amount in cents:", amountCents, {
    from: {
      amountMoney: payment.amountMoney,
      totalMoney: payment.totalMoney,
      approvedMoney: payment.approvedMoney,
    },
  });

  if (!amountCents || amountCents <= 0) {
    console.error("[Square Webhook] Invalid amountCents; refusing to persist donation.");
    return NextResponse.json({ ok: false, error: "invalid amount" }, { status: 400 });
  }

  const teamRef = parseTeamRef(payment.note);
  if (!teamRef) {
    console.warn("[Square Webhook] No team reference found in payment note:", payment.note);
    return NextResponse.json({ ok: true, skipped: "no teamRef" }, { status: 200 });
  }

  const currency =
    payment.amountMoney?.currency ??
    payment.totalMoney?.currency ??
    payment.approvedMoney?.currency ??
    "CAD";

  const record: Donation = {
    id: payment.id!,
    teamRef,
    amountCents,
    currency,
    email: payment.customerDetails?.emailAddress ?? undefined,
    receiptUrl: payment.receiptUrl ?? undefined,
    createdAt: payment.createdAt ?? new Date().toISOString(),
    raw: process.env.NODE_ENV === "production" ? undefined : payment.raw,
  };

  try {
    console.log("[Square Webhook] Upserting donation:", {
      id: record.id,
      teamRef: record.teamRef,
      amountCents: record.amountCents,
      currency: record.currency,
    });

    await upsertDonation(record);

    console.log("[Square Webhook] ✅ Successfully processed donation");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[Square Webhook] Failed to persist donation:", e);
    return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "square/webhook" }, { status: 200 });
}
