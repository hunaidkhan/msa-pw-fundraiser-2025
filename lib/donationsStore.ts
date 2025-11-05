// lib/donationsStore.ts
import { list, put } from "@vercel/blob";

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

// ---------- Blob layout ----------

const ROOT_PREFIX = "donations";
const PAYMENTS_PREFIX = `${ROOT_PREFIX}/payments/`; // donations/payments/{paymentId}.json
const TOTALS_PREFIX = `${ROOT_PREFIX}/totals/`;     // donations/totals/{teamRef}.json

// Helper: derive the blob item array type from list()
type BlobItem = Awaited<ReturnType<typeof list>>["blobs"][number];

// ---------- Tiny utils ----------

async function fetchJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * List all blobs for a prefix (handles pagination).
 * Returns an array of blob items; you can read each via its public `url`.
 */
async function listAll(prefix: string): Promise<BlobItem[]> {
  const items: BlobItem[] = [];
  let cursor: string | undefined = undefined;

  do {
    const page = await list({ prefix, cursor });
    if (page.blobs?.length) items.push(...page.blobs);
    cursor = page.cursor ?? undefined;
  } while (cursor);

  return items;
}

/**
 * Fetch a single blob (by exact pathname) if it exists.
 * Since the Blob API is path-based, we "find" it by listing its exact prefix.
 */
async function getBlobByPath(pathname: string): Promise<BlobItem | null> {
  const page = await list({ prefix: pathname, limit: 1 });
  return page.blobs?.[0] ?? null;
}

// ---------- Public API ----------

/**
 * Idempotently store a payment record and update the team's total.
 * - Writes donations/payments/{paymentId}.json (allowOverwrite: true, for webhook retries)
 * - If teamRef exists, increments donations/totals/{teamRef}.json
 */
export async function upsertDonation(d: Donation): Promise<void> {
  // 1) Persist the payment blob (idempotent / retry-safe)
  const paymentPath = `${PAYMENTS_PREFIX}${d.id}.json`;
  await put(paymentPath, JSON.stringify(d, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true, // retry-safe
    contentType: "application/json",
  });

  // 2) Update per-team total (only if we have a teamRef)
  if (!d.teamRef) return;

  const totalsPath = `${TOTALS_PREFIX}${d.teamRef}.json`;

  // Read current total if exists
  let currentTotal = 0;
  const existing = await getBlobByPath(totalsPath);
  if (existing) {
    const json = await fetchJson<{ team: string; totalCents: number }>(existing.url);
    if (json && Number.isFinite(json.totalCents)) {
      currentTotal = json.totalCents;
    }
  }

  const next = {
    team: d.teamRef,
    totalCents: currentTotal + d.amountCents,
    updatedAt: new Date().toISOString(),
  };

  await put(totalsPath, JSON.stringify(next, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/**
 * Get the aggregate totals for ALL teams as a Record<teamRef, totalCents>.
 * Reads donations/totals/*.json and combines them.
 */
export async function totalsByTeam(): Promise<Record<string, number>> {
  const blobs = await listAll(TOTALS_PREFIX);
  const out: Record<string, number> = {};

  // Only pick *.json under totals/
  const jsons = blobs.filter((b) => b.pathname.startsWith(TOTALS_PREFIX) && b.pathname.endsWith(".json"));

  for (const b of jsons) {
    const json = await fetchJson<{ team: string; totalCents: number }>(b.url);
    if (!json) continue;

    const team = json.team;
    const total = Number(json.totalCents ?? 0);
    if (!team) continue;

    out[team] = total;
  }

  return out;
}

/**
 * Get a single team's total in cents.
 * Returns 0 if the totals file doesn't exist yet.
 */
export async function totalForTeam(teamRef: string): Promise<number> {
  const totalsPath = `${TOTALS_PREFIX}${teamRef}.json`;
  const blob = await getBlobByPath(totalsPath);
  if (!blob) return 0;

  const json = await fetchJson<{ totalCents: number }>(blob.url);
  if (!json) return 0;

  const n = Number(json.totalCents ?? 0);
  return Number.isFinite(n) ? n : 0;
}
