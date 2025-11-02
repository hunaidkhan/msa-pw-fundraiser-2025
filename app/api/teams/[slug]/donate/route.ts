import { NextResponse } from "next/server";
import { ApiError, Client, Environment } from "square";
import crypto from "node:crypto";
import { getTeamBySlug } from "@/config/teams";

const accessToken = process.env.SQUARE_ACCESS_TOKEN!;
const locationId = process.env.SQUARE_LOCATION_ID!;
const CURRENCY = process.env.SQUARE_CURRENCY ?? "CAD";
const SQUARE_ENV = (process.env.SQUARE_ENV ?? "sandbox").toLowerCase();

const client = new Client({
  bearerAuthCredentials: { accessToken },
  environment:
    SQUARE_ENV === "production"
      ? Environment.Production
      : Environment.Sandbox,
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    if (!accessToken || !locationId) {
      return NextResponse.json(
        { error: "Missing Square credentials" },
        { status: 500 }
      );
    }

    const slug = params.slug;
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
              ? "Check your SQUARE_ENV and make sure your token/location ID are sandbox or production correctly."
              : undefined,
        },
        { status: err.statusCode ?? 500 }
      );
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
