import { put, list } from "@vercel/blob";
import { cache } from "react";

const TOTALS_PATH = "donations/totals.json";

export interface TeamTotals {
  [teamRef: string]: number; // amount in cents
}

// In-memory cache for the totals blob URL
// Once set from put(), this URL is permanent (deterministic blob key)
let cachedTotalsUrl: string | null = null;

/**
 * Gets the totals blob URL, with in-memory caching to eliminate list() calls.
 * URL is captured from put() operations and cached permanently.
 * Only falls back to list() if URL not yet cached (first read before any write).
 * Wrapped with React cache() for request-level deduplication.
 */
const getTotalsUrl = cache(async (): Promise<string | null> => {
  // Return cached URL if available (no TTL needed - blob key is deterministic)
  if (cachedTotalsUrl) {
    return cachedTotalsUrl;
  }

  try {
    // Fallback: list to get the URL (only on first read before any write)
    const { blobs } = await list({ prefix: TOTALS_PATH, limit: 1 });

    if (!blobs.length) {
      return null;
    }

    // Cache the URL permanently
    cachedTotalsUrl = blobs[0].url;
    return cachedTotalsUrl;
  } catch (error) {
    console.error("Error listing totals blob:", error);
    return null;
  }
});

/**
 * Sets the cached totals URL from a write operation.
 */
function setCachedTotalsUrl(url: string): void {
  cachedTotalsUrl = url;
}

/**
 * Fetches the current totals blob.
 * Uses in-memory URL caching to minimize list() operations.
 */
export async function getTotals(): Promise<TeamTotals> {
  try {
    const url = await getTotalsUrl();

    if (!url) {
      return {};
    }

    // Fetch by URL - this is a simple operation
    const response = await fetch(url, {
      cache: "no-store" // Force fresh data for real-time updates
    });

    if (!response.ok) {
      console.error("Failed to fetch totals blob:", response.statusText);
      return {};
    }

    const data = await response.json();
    return data as TeamTotals;
  } catch (error) {
    console.error("Error reading totals:", error);
    return {};
  }
}

/**
 * Increments a team's total by the specified amount.
 * This is called from the webhook handler when a new donation arrives.
 *
 * @param teamRef - The team slug/reference
 * @param amountCents - Amount to add (in cents)
 */
export async function incrementTeamTotal(
  teamRef: string,
  amountCents: number
): Promise<void> {
  try {
    // Read current totals
    const totals = await getTotals();

    // Increment the team's total
    totals[teamRef] = (totals[teamRef] ?? 0) + amountCents;

    // Write back to blob storage
    const blob = await put(TOTALS_PATH, JSON.stringify(totals, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0, // Disable blob caching for real-time updates
    });

    // Cache the blob URL from the write operation (eliminates future list() calls)
    setCachedTotalsUrl(blob.url);

    console.log(`Updated totals for team ${teamRef}: ${totals[teamRef]} cents`);
  } catch (error) {
    console.error("Error incrementing team total:", error);
    throw error; // Re-throw so webhook can handle the error
  }
}

/**
 * Gets the total for a specific team.
 *
 * @param teamRef - The team slug/reference
 * @returns Total amount in cents
 */
export async function getTeamTotal(teamRef: string): Promise<number> {
  const totals = await getTotals();
  return totals[teamRef] ?? 0;
}
