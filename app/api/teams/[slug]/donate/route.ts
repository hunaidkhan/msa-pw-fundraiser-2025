export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ApiError, Client, Environment } from "square";
import crypto from "node:crypto";
import { getTeamBySlug } from "@/config/teams";

const accessToken = process.env.SQUARE_ACCESS_TOKEN!;
const locationId = process.env.SQUARE_LOCATION_ID!;
const CURRENCY = process.env.SQUARE_CURRENCY ?? "USD";

const client = new Client({
  bearerAuthCredentials: { accessToken },
  environment: process.env.NODE_ENV === "production" ? Environment.Production : Environment.Sandbox,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params; // <-- fix
    const team = getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json({ error: `Team not found for slug: ${slug}` }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const cents = Math.round(amount * 100);

    const { result } = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      quickPay: {
        name: `Donate to ${team.name}`,
        priceMoney: { amount: BigInt(cents), currency: CURRENCY },
        locationId,
      },
      description: `Support ${team.name}'s fundraiser.`,
      paymentNote: `Team ${team.name} • slug ${team.slug}`,
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/teams/${team.slug}?thankyou=1`,
      },
    });

    const url = result.paymentLink?.url ?? result.paymentLink?.longUrl;
    if (!url) return NextResponse.json({ error: "Square did not return a payment link" }, { status: 502 });

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof ApiError) {
      const first = err.result?.errors?.[0];
      return NextResponse.json(
        { error: first?.detail ?? first?.code ?? "Square error" },
        { status: err.statusCode ?? 500 }
      );
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
