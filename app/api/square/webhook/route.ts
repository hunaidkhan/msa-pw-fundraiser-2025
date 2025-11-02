// app/api/square/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Square webhook handler (App Router)
 * - Verifies HMAC (if SQUARE_WEBHOOK_SIGNATURE_KEY & SQUARE_WEBHOOK_URL provided)
 * - Processes payment.* events; stores COMPLETED payments into .data/donations.json
 * - Parses team info from Payment.note (e.g., "team=team-falcon; teamId=abc123")
 *
 * Env vars (recommended):
 *   - SQUARE_WEBHOOK_SIGNATURE_KEY  (required for signature verification in prod)
 *   - SQUARE_WEBHOOK_URL            (the exact webhook URL registered in Square Dashboard)
 *
 * Notes:
 *  - In serverless, local file writes are ephemeral; good for dev/testing.
 *  - For production persistence, migrate this to a DB or Google Sheets.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Donation = {
  id: string;                 // Square Payment.id
  teamRef: string | null;     // parsed from Payment.note (team slug or id)
  amountCents: number;        // amount in minor units
  currency: "USD" | "CAD" | string;
  email?: string;
  receiptUrl?: string;
  createdAt: string;          // ISO timestamp
  raw?: unknown;              // only in non-production for debugging
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
  customerDetails?: {
    emailAddress?: string | null;
  } | null;
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
      // order?: SquareOrder; // not used now
    };
  };
};

// ---------- config / helpers ----------

const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
const WEBHOOK_URL   = process.env.SQUARE_WEBHOOK_URL ?? "";

// Where we store donations locally (good for dev)
const DATA_DIR  = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "donations.json");

// Ensure directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

// Read JSON array from file (or [] if missing)
async function readDonations(): Promise<Donation[]> {
  try {
    const buf = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(buf);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Upsert donation by payment id
async function upsertDonation(record: Donation) {
  await ensureDataDir();
  const list = await readDonations();
  const idx = list.findIndex((d) => d.id === record.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...record };
  } else {
    list.push(record);
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

// Parse team ref (slug or id) from payment note
function parseTeamRef(note?: string | null): string | null {
  if (!note) return null;
  // Accept formats like: "team=team-falcon; teamId=abc123"
  const mSlug = note.match(/(?:^|;)\s*team=([^;]+)/i);
  const mId   = note.match(/(?:^|;)\s*teamId=([^;]+)/i);
  const ref = (mSlug?.[1] ?? mId?.[1] ?? "").trim();
  return ref || null;
}

// Verify Square HMAC signature (recommended in prod)
// Signature = base64(hmac_sha256(signature_key, WEBHOOK_URL + body))
function verifySquareSignature(bodyRaw: string, headerSig: string | null): boolean {
  if (!headerSig || !SIGNATURE_KEY || !WEBHOOK_URL) return false;
  try {
    const hmac = crypto.createHmac("sha256", SIGNATURE_KEY);
    hmac.update(WEBHOOK_URL + bodyRaw, "utf8");
    const expected = hmac.digest("base64");
    // Some environments may send multiple signatures; do loose match
    return headerSig.split(",").map(s => s.trim()).includes(expected);
  } catch {
    return false;
  }
}

// ---------- route handlers ----------

export async function POST(req: Request) {
  // Get raw body first (needed for HMAC verification)
  const rawBody = await req.text();

  // Verify signature where configured
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
    // In dev, don't fail hard; just log
    if (!SIGNATURE_KEY || !WEBHOOK_URL) {
      console.warn("[Square Webhook] Skipping signature verification in dev (missing key or URL).");
    } else if (!isSigOk) {
      console.warn("[Square Webhook] Signature mismatch (dev) — check SQUARE_WEBHOOK_URL & key.");
    }
  }

  // Parse event
  let evt: SquareWebhookEvent;
  try {
    evt = JSON.parse(rawBody);
  } catch (e) {
    console.error("[Square Webhook] Invalid JSON body:", e);
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const type = evt.type ?? evt.data?.type ?? "";
  // We focus on payment.*; feel free to add order.* later
  if (!type.startsWith("payment.")) {
    // Acknowledge other events without processing
    return NextResponse.json({ ok: true, ignored: type }, { status: 200 });
  }

  const payment: SquarePayment | undefined = evt.data?.object?.payment as any;
  if (!payment?.id) {
    return NextResponse.json({ ok: false, error: "no payment in payload" }, { status: 400 });
  }

  // Only store COMPLETED payments
  const status = (payment.status ?? "").toUpperCase();
  if (status !== "COMPLETED") {
    return NextResponse.json({ ok: true, skipped: `status=${status}` }, { status: 200 });
  }

  // Build a normalized donation record
  const amountRaw = payment.amountMoney?.amount ?? 0;
  const amountCents =
    typeof amountRaw === "bigint"
      ? Number(amountRaw)
      : typeof amountRaw === "number"
      ? amountRaw
      : 0;

  const record: Donation = {
    id: payment.id,
    teamRef: parseTeamRef(payment.note),
    amountCents,
    currency: (payment.amountMoney?.currency ?? "USD") as string,
    email: payment.customerDetails?.emailAddress ?? undefined,
    receiptUrl: payment.receiptUrl ?? undefined,
    createdAt: payment.createdAt ?? new Date().toISOString(),
    raw: process.env.NODE_ENV === "production" ? undefined : payment, // keep raw only in dev
  };

  try {
    await upsertDonation(record);
  } catch (e) {
    console.error("[Square Webhook] Failed to persist donation:", e);
    return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// Optional: quick health probe
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "square/webhook" }, { status: 200 });
}
