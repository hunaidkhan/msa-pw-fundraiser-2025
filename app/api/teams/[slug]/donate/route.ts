import { NextResponse } from "next/server";
import { ApiError, Client, Environment } from "square";
import crypto from "node:crypto";
import { getTeamBySlug } from "@/config/teams";

const SQUARE_ENV = (process.env.SQUARE_ENV ?? "").toLowerCase(); // "sandbox" | "production"
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId  = process.env.SQUARE_LOCATION_ID;
const CURRENCY    = process.env.SQUARE_CURRENCY ?? "CAD";

function squareEnv(): Environment {
  if (SQUARE_ENV === "sandbox") return Environment.Sandbox;
  if (SQUARE_ENV === "production") return Environment.Production;
  // default sensibly based on NODE_ENV
  return process.env.NODE_ENV === "production" ? Environment.Production : Environment.Sandbox;
}

const client = accessToken
  ? new Client({ bearerAuthCredentials: { accessToken }, environment: squareEnv() })
  : undefined;

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    // Lightweight config check (no secrets logged)
    if (!client || !accessToken || !locationId) {
      return NextResponse.json(
        { error: "Square not configured: missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID" },
        { status: 500 }
      );
    }

    const slug = params.slug;
    const team = getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json({ error: `Team not found for slug: ${slug}` }, { status: 404 });
    }

    const { amount } = (await req.json()) as { amount?: number };
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const cents = Math.round(numericAmount * 100);

    const { result } = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      quickPay: {
        name: `Donate to ${team.name}`,
        priceMoney: { amount: BigInt(cents), currency: CURRENCY as any },
        locationId,
      },
      description: `Support ${team.name}'s fundraiser.`,
      paymentNote: `team=${team.slug}; teamId=${team.id}`,
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/teams/${team.slug}?thankyou=1`,
      },
    });

    const url = result.paymentLink?.url ?? result.paymentLink?.longUrl;
    if (!url) {
      return NextResponse.json({ error: "Square did not return a payment link" }, { status: 502 });
    }
    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      const e = err.result?.errors?.[0];
      // 401 here means wrong env/keys/permissions
      return NextResponse.json(
        { error: e?.detail ?? e?.code ?? "Square error", hint: err.statusCode === 401 ? "Check SQUARE_ENV, token and location id match (sandbox vs production)." : undefined },
        { status: err.statusCode ?? 500 }
      );
    }
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
