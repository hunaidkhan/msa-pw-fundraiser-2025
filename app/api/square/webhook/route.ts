import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { upsertDonation, type Donation } from "@/lib/donationsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
const WEBHOOK_URL   = process.env.SQUARE_WEBHOOK_URL ?? "";

// ✅ FIXED: Parse the structured note we're now sending
function parseTeamRef(note?: string | null): string | null {
  if (!note) return null;
  
  // Match: "teamSlug=team-falcon" or "teamSlug=my-team-2"
  const match = note.match(/teamSlug=([^\s;]+)/i);
  const slug = match?.[1]?.trim();
  
  console.log("[Webhook] Parsed team slug:", slug, "from note:", note);
  return slug || null;
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
  
  // ✅ FIXED: Listen for payment.created (not payment.updated)
  if (!type.startsWith("payment.")) {
    console.log("[Square Webhook] Ignoring non-payment event:", type);
    return NextResponse.json({ ok: true, ignored: type }, { status: 200 });
  }

  console.log("[Square Webhook] Processing event:", type);

  const payment: SquarePayment | undefined = evt.data?.object?.payment as any;
  if (!payment?.id) {
    console.error("[Square Webhook] No payment in payload");
    return NextResponse.json({ ok: false, error: "no payment in payload" }, { status: 400 });
  }

  // ✅ Log the full payment object in non-production for debugging
  if (process.env.NODE_ENV !== "production") {
    console.log("[Square Webhook] Full payment object:", JSON.stringify(payment, null, 2));
  }

  const status = (payment.status ?? "").toUpperCase();
  
  // ✅ Accept both COMPLETED and APPROVED in all environments
  // APPROVED = Sandbox successful payments
  // COMPLETED = Production successful payments
  const validStatuses = ["COMPLETED", "APPROVED"];
  
  if (!validStatuses.includes(status)) {
    console.log("[Square Webhook] Skipping payment with status:", status);
    return NextResponse.json({ ok: true, skipped: `status=${status}` }, { status: 200 });
  }
  
  console.log("[Square Webhook] ✓ Processing successful payment with status:", status);

  // ✅ FIXED: Better amount parsing with logging
  const amountRaw = payment.amountMoney?.amount;
  console.log("[Square Webhook] Raw amount from Square:", amountRaw, "type:", typeof amountRaw);
  
  let amountCents = 0;
  if (typeof amountRaw === "bigint") {
    amountCents = Number(amountRaw);
  } else if (typeof amountRaw === "number") {
    amountCents = amountRaw;
  } else if (typeof amountRaw === "string") {
    // Sometimes Square sends it as a string
    amountCents = parseInt(amountRaw, 10);
  }
  
  console.log("[Square Webhook] Parsed amount in cents:", amountCents);
  
  if (!amountCents || amountCents <= 0) {
    console.error("[Square Webhook] Invalid amount:", amountCents, "from raw:", amountRaw);
    // Still process the payment but log the error
  }

  const teamRef = parseTeamRef(payment.note);
  
  if (!teamRef) {
    console.warn("[Square Webhook] No team reference found in payment note:", payment.note);
    return NextResponse.json({ ok: true, skipped: "no teamRef" }, { status: 200 });
  }

  const record: Donation = {
    id: payment.id,
    teamRef,
    amountCents,
    currency: (payment.amountMoney?.currency ?? "CAD") as string,
    email: payment.customerDetails?.emailAddress ?? undefined,
    receiptUrl: payment.receiptUrl ?? undefined,
    createdAt: payment.createdAt ?? new Date().toISOString(),
    raw: process.env.NODE_ENV === "production" ? undefined : payment,
  };

  try {
    console.log("[Square Webhook] Upserting donation:", {
      id: record.id,
      teamRef: record.teamRef,
      amountCents: record.amountCents,
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