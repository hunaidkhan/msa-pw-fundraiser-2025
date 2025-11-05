import { NextRequest, NextResponse } from "next/server";
import { ApiError, Client, Environment } from "square";
import crypto from "node:crypto";
import { getTeamBySlug } from "@/config/teams";

/** Pick Square env from deployment context (don’t rely on NODE_ENV on Vercel) */
const isProd = process.env.VERCEL_ENV === "production";
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;
const CURRENCY = (process.env.SQUARE_CURRENCY || "CAD").toUpperCase();

function assertEnv() {
  const missing: string[] = [];
  if (!accessToken) missing.push("SQUARE_ACCESS_TOKEN");
  if (!locationId) missing.push("SQUARE_LOCATION_ID");
  if (CURRENCY !== "CAD") {
    // You said CAD-only for now; gently enforce
    throw new Error(`Only CAD is supported currently. Set SQUARE_CURRENCY=CAD (got ${CURRENCY}).`);
  }
  if (missing.length) {
    throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
  }
}

function makeClient() {
  return new Client({
    bearerAuthCredentials: { accessToken: accessToken! },
    environment: isProd ? Environment.Production : Environment.Sandbox,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    assertEnv();

    const { slug } = await ctx.params;
    const team = await getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json({ error: `Team not found for slug: ${slug}` }, { status: 404 });
    }

    const body = (await req.json()) as { amount?: number; currency?: string };
    const amount = Number(body?.amount ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Please provide a positive donation amount." }, { status: 400 });
    }
    if ((body?.currency || "CAD").toUpperCase() !== "CAD") {
      return NextResponse.json({ error: "Currency must be CAD." }, { status: 400 });
    }

    const cents = Math.round(amount * 100);
    const client = makeClient();

    // Build a deployment-aware redirect URL (works for previews & prod)
    const origin = new URL(req.url).origin;
    const redirectUrl = `${origin}/teams/${team.slug}?thankyou=1`;

    const { result } = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      quickPay: {
        name: `Donate to ${team.name}`,
        priceMoney: { amount: BigInt(cents), currency: "CAD" },
        locationId: locationId!,
      },
      description: `Support ${team.name}'s fundraiser.`,
      paymentNote: `Team ${team.name} • slug ${team.slug}`,
      checkoutOptions: { redirectUrl },
    });

    const url = result.paymentLink?.url ?? result.paymentLink?.longUrl;
    if (!url) {
      return NextResponse.json({ error: "Square did not return a payment link." }, { status: 502 });
    }

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof ApiError) {
      const e = err.result?.errors?.[0];
      return NextResponse.json(
        { error: e?.detail ?? e?.code ?? "Square request failed." },
        { status: err.statusCode ?? 500 }
      );
    }
    const msg = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
