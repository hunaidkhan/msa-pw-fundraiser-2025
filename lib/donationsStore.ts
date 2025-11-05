// lib/donationsStore.ts
import path from "node:path";
import fs from "node:fs/promises";
import { list, put } from "@vercel/blob";

/** ─────────────────────────────────────────────────────────────────────────────
 * TYPES
 * ────────────────────────────────────────────────────────────────────────────*/
export type Donation = {
  id: string;              // Square payment id (unique)
  teamRef: string | null;  // slug or id you attach to the payment
  amountCents: number;     // minor units
  currency: "USD" | "CAD" | string;
  email?: string;          // not persisted in blob (avoid PII)
  receiptUrl?: string;     // not persisted in blob (avoid PII)
  createdAt: string;       // ISO
  raw?: any;               // not persisted in blob (avoid PII)
};

type Store = {
  donations: Donation[];
  updatedAt: string;
};

/** ─────────────────────────────────────────────────────────────────────────────
 * RUNTIME SWITCH
 * - Use Blob on Vercel (serverless) → one file per payment: donations/{id}.json
 * - Use filesystem locally (unchanged behavior)
 * ────────────────────────────────────────────────────────────────────────────*/
const USING_BLOB = !!process.env.VERCEL; // heuristics: on Vercel use Blob

/** ─────────────────────────────────────────────────────────────────────────────
 * FILESYSTEM BACKEND (local dev)
 * ────────────────────────────────────────────────────────────────────────────*/
function storePath() {
  const custom = process.env.DONATIONS_PATH;
  if (custom) return custom;
  if (process.env.VERCEL) return "/tmp/donations.json"; // fallback (rarely used in prod)
  return path.join(process.cwd(), "data", "donations.json");
}
async function ensureDir(p: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

async function readStoreFS(): Promise<Store> {
  const p = storePath();
  try {
    const buf = await fs.readFile(p, "utf8");
    return JSON.parse(buf) as Store;
  } catch {
    return { donations: [], updatedAt: new Date().toISOString() };
  }
}
async function writeStoreFS(next: Store): Promise<void> {
  const p = storePath();
  await ensureDir(p);
  const tmp = p + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, p);
}
async function upsertDonationFS(d: Donation): Promise<void> {
  const store = await readStoreFS();
  const idx = store.donations.findIndex((x) => x.id === d.id);
  if (idx >= 0) store.donations[idx] = d;
  else store.donations.push(d);
  store.updatedAt = new Date().toISOString();
  await writeStoreFS(store);
}
async function totalsByTeamFS(): Promise<Record<string, number>> {
  const store = await readStoreFS();
  const totals: Record<string, number> = {};
  for (const d of store.donations) {
    const key = d.teamRef ?? "unknown";
    totals[key] = (totals[key] ?? 0) + d.amountCents;
  }
  return totals;
}

/** ─────────────────────────────────────────────────────────────────────────────
 * BLOB BACKEND (production)
 * - Dedup via filename: donations/{paymentId}.json
 * - Only store minimal fields: { id, teamRef, amountCents, createdAt }
 * - No PII persisted in blob
 * ────────────────────────────────────────────────────────────────────────────*/
type BlobDonation = {
  id: string;
  teamRef: string | null;
  amountCents: number;
  createdAt: string;
};

const BLOB_PREFIX = "donations/";

async function upsertDonationBlob(d: Donation): Promise<void> {
  const filename = `${BLOB_PREFIX}${d.id}.json`;
  const minimal: BlobDonation = {
    id: d.id,
    teamRef: d.teamRef,
    amountCents: d.amountCents,
    createdAt: d.createdAt,
  };

  // Dedup: do not overwrite if file exists already
  await put(filename, JSON.stringify(minimal), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: false,
  }).catch((err: unknown) => {
    const msg = String((err as any)?.message ?? "");
    if (msg.includes("already exists")) return; // idempotent
    throw err;
  });
}

/**
 * Iterate all donations/ blobs and sum by team
 * For high volumes, you can later cache results for ~30s via unstable_cache.
 */
async function totalsByTeamBlob(): Promise<Record<string, number>> {
  const totals: Record<string, number> = {};
  let cursor: string | undefined = undefined;

  do {
    const page = await list({ prefix: BLOB_PREFIX, cursor });
    cursor = page.cursor;

    const jsonBlobs = page.blobs.filter((b) => b.pathname.endsWith(".json"));
    const records = await Promise.all(
      jsonBlobs.map(async (b) => {
        const res = await fetch(b.url, { cache: "no-store" });
        if (!res.ok) return null;
        try {
          return (await res.json()) as BlobDonation;
        } catch {
          return null;
        }
      })
    );

    for (const r of records) {
      if (!r) continue;
      const key = r.teamRef ?? "unknown";
      totals[key] = (totals[key] ?? 0) + (Number.isFinite(r.amountCents) ? r.amountCents : 0);
    }
  } while (cursor);

  return totals;
}

/** ─────────────────────────────────────────────────────────────────────────────
 * PUBLIC API (stable)
 * ────────────────────────────────────────────────────────────────────────────*/
export async function upsertDonation(d: Donation): Promise<void> {
  if (USING_BLOB) return upsertDonationBlob(d);
  return upsertDonationFS(d);
}

export async function totalsByTeam(): Promise<Record<string, number>> {
  if (USING_BLOB) return totalsByTeamBlob();
  return totalsByTeamFS();
}

/** Optional helper if you want just a single team’s total quickly */
export async function totalForTeamCents(teamRef: string): Promise<number> {
  const totals = await totalsByTeam();
  return totals[teamRef] ?? 0;
}
