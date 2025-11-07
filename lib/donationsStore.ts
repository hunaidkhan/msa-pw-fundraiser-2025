// lib/donationsStore.ts
import { put, del } from "@vercel/blob";
import { getTotals, getTeamTotal } from "./totalsStore";

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

// ---------- Tiny utils ----------
// Note: Previous listAll() helper removed as it was unused.
// Migration scripts define their own listAll() when needed.

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
 * Get the aggregate totals for ALL teams as a Record<teamRef, totalCents>.
 * Now reads from the pre-generated totals.json blob (simple operation, cached).
 */
export async function totalsByTeam(): Promise<Record<string, number>> {
  return await getTotals();
}

/**
 * Get a single team's total in cents.
 * Now reads from the pre-generated totals.json blob (simple operation, cached).
 * Returns 0 if no donations exist for that team.
 */
export async function totalForTeam(teamRef: string): Promise<number> {
  return await getTeamTotal(teamRef);
}
