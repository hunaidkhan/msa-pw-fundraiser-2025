/**
 * One-time migration API route to generate the initial totals.json blob
 * from existing donation records.
 *
 * Access: GET /api/admin/migrate-totals
 *
 * IMPORTANT: Delete this file after running the migration!
 */

import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for large datasets

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

export async function GET() {
  try {
    console.log("🔍 Scanning existing donations...");

    const blobs = await listAll(PAYMENTS_PREFIX);
    console.log(`Found ${blobs.length} donation records`);

    const totals: Record<string, number> = {};
    let processedCount = 0;
    const skipped: string[] = [];

    for (const blob of blobs) {
      if (!blob.pathname.endsWith(".json")) continue;

      const donation = await fetchJson<Donation>(blob.url);
      if (!donation?.teamRef || !Number.isFinite(donation.amountCents)) {
        skipped.push(blob.pathname);
        continue;
      }

      totals[donation.teamRef] = (totals[donation.teamRef] ?? 0) + donation.amountCents;
      processedCount++;
    }

    console.log(`✅ Processed ${processedCount} donations`);
    console.log("📊 Team Totals:", totals);

    console.log(`💾 Writing totals to ${TOTALS_PATH}...`);

    await put(TOTALS_PATH, JSON.stringify(totals, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });

    console.log("✨ Migration complete!");

    return NextResponse.json({
      success: true,
      message: "Migration complete!",
      stats: {
        totalBlobs: blobs.length,
        processed: processedCount,
        skipped: skipped.length,
        teamCount: Object.keys(totals).length,
      },
      totals: Object.entries(totals).map(([team, cents]) => ({
        team,
        amount: `$${(cents / 100).toFixed(2)}`,
        amountCents: cents,
      })),
      skippedFiles: skipped,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
