import { put, list } from "@vercel/blob";

const TOTALS_PATH = "donations/totals.json";

export interface TeamTotals {
  [teamRef: string]: number; // amount in cents
}

/**
 * Fetches the current totals blob.
 * Uses simple blob operation (URL fetch) which benefits from caching.
 */
export async function getTotals(): Promise<TeamTotals> {
  try {
    // List to get the URL (limit 1, so minimal cost)
    const { blobs } = await list({ prefix: TOTALS_PATH, limit: 1 });

    if (!blobs.length) {
      return {};
    }

    // Fetch by URL - this is a simple operation and will be cached
    const response = await fetch(blobs[0].url, {
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
    await put(TOTALS_PATH, JSON.stringify(totals, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0, // Disable blob caching for real-time updates
    });

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
