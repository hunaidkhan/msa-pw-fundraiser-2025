/**
 * One-time migration script to generate the initial totals.json blob
 * from existing donation records.
 *
 * Run with: npx tsx scripts/migrate-totals.ts
 */

import { list } from "@vercel/blob";
import { put } from "@vercel/blob";

const PAYMENTS_PREFIX = "donations/payments/";
const TOTALS_PATH = "donations/totals.json";

type Donation = {
  id: string;
  teamRef: string | null;
  amountCents: number;
  currency: string;
  email?: string;
  receiptUrl?: string;
  createdAt: string;
  raw?: unknown;
};

async function listAll(prefix: string) {
  const items: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const page = await list({ prefix, cursor });
    if (page.blobs?.length) items.push(...page.blobs);
    cursor = page.cursor ?? undefined;
  } while (cursor);

  return items;
}

async function fetchJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function main() {
  console.log("🔍 Scanning existing donations...");

  const blobs = await listAll(PAYMENTS_PREFIX);
  console.log(`Found ${blobs.length} donation records`);

  const totals: Record<string, number> = {};
  let processedCount = 0;

  for (const blob of blobs) {
    if (!blob.pathname.endsWith(".json")) continue;

    const donation = await fetchJson<Donation>(blob.url);
    if (!donation?.teamRef || !Number.isFinite(donation.amountCents)) {
      console.log(`⚠️  Skipping invalid donation: ${blob.pathname}`);
      continue;
    }

    totals[donation.teamRef] = (totals[donation.teamRef] ?? 0) + donation.amountCents;
    processedCount++;
  }

  console.log(`\n✅ Processed ${processedCount} donations`);
  console.log("\n📊 Team Totals:");
  for (const [team, cents] of Object.entries(totals)) {
    console.log(`  ${team}: $${(cents / 100).toFixed(2)}`);
  }

  console.log(`\n💾 Writing totals to ${TOTALS_PATH}...`);

  await put(TOTALS_PATH, JSON.stringify(totals, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });

  console.log("✨ Migration complete!");
  console.log("\nYou can now:");
  console.log("1. Test the webhook to ensure it updates totals correctly");
  console.log("2. Visit team pages to verify they read from the new totals.json");
}

main().catch(console.error);
