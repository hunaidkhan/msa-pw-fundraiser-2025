// app/api/teams/[slug]/donate/route.ts
import { NextResponse, NextRequest } from "next/server";
import { ApiError, Client, Environment } from "square";
import crypto from "node:crypto";
import { getTeamBySlug } from "@/config/teams";

// ---- Env & Square client ----------------------------------------------------

const accessToken = process.env.SQUARE_ACCESS_TOKEN!;
const locationId = process.env.SQUARE_LOCATION_ID!;
const CURRENCY = (process.env.SQUARE_CURRENCY ?? "CAD").toUpperCase();
const SQUARE_ENV = (process.env.SQUARE_ENV ?? "sandbox").toLowerCase();

const client = new Client({
  bearerAuthCredentials: { accessToken },
  environment: SQUARE_ENV === "production" ? Environment.Production : Environment.Sandbox,
});

// ---- Handler ----------------------------------------------------------------

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> } // <-- params is a Promise in Next 15+/16
) {
  try {
    if (!accessToken || !locationId) {
      return NextResponse.json({ error: "Missing Square credentials" }, { status: 500 });
    }

    // MUST await the params promise
    const { slug } = await context.params;

    const team = getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json({ error: `Team not found: ${slug}` }, { status: 404 });
    }

    const { amount } = (await req.json()) as { amount: number };
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid donation amount" }, { status: 400 });
    }

    const cents = Math.round(amount * 100);

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
      return NextResponse.json({ error: "Square did not return a link" }, { status: 502 });
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      const first = err.result?.errors?.[0];
      return NextResponse.json(
        {
          error: first?.detail ?? first?.code ?? "Square error",
          hint:
            err.statusCode === 401
              ? "Check SQUARE_ENV vs token/location (sandbox vs production)."
              : undefined,
        },
        { status: err.statusCode ?? 500 }
      );
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
