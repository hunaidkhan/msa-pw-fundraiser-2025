// lib/donationsStore.ts
import fs from "node:fs/promises";
import path from "node:path";

export type Donation = {
  id: string;              // Square payment id
  teamRef: string | null;  // from referenceId we set at checkout (team.id or slug)
  amountCents: number;
  currency: "USD" | "CAD";
  email?: string;
  receiptUrl?: string;
  createdAt: string;       // ISO
  raw?: any;               // optional: full raw payment for debugging
};

type Store = {
  donations: Donation[];
  updatedAt: string;
};

function storePath() {
  // Local dev: project data/; Vercel: /tmp (ephemeral!)
  const custom = process.env.DONATIONS_PATH;
  if (custom) return custom;
  if (process.env.VERCEL) return "/tmp/donations.json";
  return path.join(process.cwd(), "data", "donations.json");
}

async function ensureDir(p: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

export async function readStore(): Promise<Store> {
  const p = storePath();
  try {
    const buf = await fs.readFile(p, "utf8");
    return JSON.parse(buf) as Store;
  } catch {
    return { donations: [], updatedAt: new Date().toISOString() };
  }
}

export async function writeStore(next: Store): Promise<void> {
  const p = storePath();
  await ensureDir(p);
  const tmp = p + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, p);
}

export async function upsertDonation(d: Donation): Promise<void> {
  const store = await readStore();
  const idx = store.donations.findIndex((x) => x.id === d.id);
  if (idx >= 0) {
    store.donations[idx] = d; // replace
  } else {
    store.donations.push(d);
  }
  store.updatedAt = new Date().toISOString();
  await writeStore(store);
}

export async function totalsByTeam(): Promise<Record<string, number>> {
  const store = await readStore();
  const totals: Record<string, number> = {};
  for (const d of store.donations) {
    const key = d.teamRef ?? "unknown";
    totals[key] = (totals[key] ?? 0) + d.amountCents;
  }
  return totals;
}
