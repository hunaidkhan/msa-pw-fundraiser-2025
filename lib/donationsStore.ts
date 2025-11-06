// lib/donationsStore.ts
import { list, put, del } from "@vercel/blob";

/**
 * Donation payload normalized from Square webhook.
 * NOTE: Only non-PII fields are required (id, teamRef, amountCents, currency, createdAt).
 * Keep email/receiptUrl optional; you can omit them upstream if not needed.
 */
export type Donation = {
  id: string;               // Square payment id (used for idempotency)
  teamRef: string | null;   // team slug or id (null allowed, but we won't tally it)
  amountCents: number;      // integer minor units (e.g., 1234 = $12.34)
  currency: "USD" | "CAD" | string;
  email?: string;
  receiptUrl?: string;
  createdAt: string;        // ISO timestamp
  raw?: unknown;            // optional debug payload in non-prod
};

// ---------- Blob layout (single source of truth = payments) ----------

const ROOT_PREFIX = "donations";
const PAYMENTS_PREFIX = `${ROOT_PREFIX}/payments/`; // donations/payments/{paymentId}.json

// Helper: derive the blob item array type from list()
type ListBlobResult = Awaited<ReturnType<typeof list>>;
type BlobItem = ListBlobResult["blobs"][number];

// ---------- Tiny utils ----------

async function fetchJson<T = unknown>(url: string): Promise<T | null> {
  try {
    // Force freshness (avoid CDN/route cache)
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * List all blobs for a prefix (handles pagination).
 */
async function listAll(prefix: string): Promise<BlobItem[]> {
  const items: BlobItem[] = [];
  let cursor: string | undefined = undefined;

  do {
    const page: ListBlobResult = await list({ prefix, cursor });
    if (page.blobs?.length) items.push(...page.blobs);
    cursor = page.cursor ?? undefined;
  } while (cursor);

  return items;
}

/** Read one payment JSON by blob item (fresh). */
async function readPayment(b: BlobItem): Promise<Donation | null> {
  if (!b.pathname.endsWith(".json")) return null;
  return (await fetchJson<Donation>(b.url)) ?? null;
}

// ---------- Public API (payments are the source of truth) ----------

/**
 * Idempotently store a payment record.
 * Writes to donations/payments/{paymentId}.json (allowOverwrite: true, for webhook retries).
 * NOTE: No totals are incremented here; totals are computed live from payments.
 */
export async function upsertDonation(d: Donation): Promise<void> {
  const paymentPath = `${PAYMENTS_PREFIX}${d.id}.json`;
  await put(paymentPath, JSON.stringify(d, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true, // retry-safe
    contentType: "application/json",
  });
}

/** Delete a single payment by Square payment id (useful for admin fixes). */
export async function deleteDonation(paymentId: string): Promise<void> {
  const paymentPath = `${PAYMENTS_PREFIX}${paymentId}.json`;
  await del(paymentPath);
}

/**
 * Get the aggregate totals for ALL teams as a Record<teamRef, totalCents>,
 * computed by scanning donations/payments/*.json live.
 */
export async function totalsByTeam(): Promise<Record<string, number>> {
  const blobs = await listAll(PAYMENTS_PREFIX);
  const out: Record<string, number> = {};

  for (const b of blobs) {
    const d = await readPayment(b);
    if (!d?.teamRef || !Number.isFinite(d.amountCents)) continue;
    out[d.teamRef] = (out[d.teamRef] ?? 0) + d.amountCents;
  }

  return out;
}

/**
 * Get a single team's total in cents by summing payments with that teamRef.
 * Returns 0 if no payments exist for that team.
 */
export async function totalForTeam(teamRef: string): Promise<number> {
  const blobs = await listAll(PAYMENTS_PREFIX);
  let sum = 0;

  for (const b of blobs) {
    const d = await readPayment(b);
    if (!d?.teamRef || d.teamRef !== teamRef) continue;
    if (!Number.isFinite(d.amountCents)) continue;
    sum += d.amountCents;
  }

  return sum;
}
