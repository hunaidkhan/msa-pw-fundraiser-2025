import { NextResponse } from "next/server";
import { ApiError, Client, Environment } from "square";
import crypto from "node:crypto";
import { getTeamById } from "@/config/teams";

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;

const client = accessToken
  ? new Client({
      bearerAuthCredentials: { accessToken },
      environment: process.env.NODE_ENV === "production" ? Environment.Production : Environment.Sandbox,
    })
  : undefined;

export async function POST(request: Request) {
  if (!accessToken || !locationId || !client) {
    return NextResponse.json(
      { error: "Square API is not configured. Please set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const amount = Number(body?.amount ?? 0);
    const teamId = typeof body?.teamId === "string" ? body.teamId : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Please provide a donation amount greater than zero." }, { status: 400 });
    }

    const cents = Math.round(amount * 100);
    const team = teamId ? getTeamById(teamId) : undefined;

    const { result } = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      quickPay: {
        name: team ? `Donate to ${team.name}` : "Donate to Palestine Solidarity Fundraiser",
        priceMoney: {
          amount: BigInt(cents),
          currency: "USD",
        },
        locationId,
      },
      description: team
        ? `Support ${team.name}'s fundraiser for Palestinian liberation.`
        : "Support our collective fundraiser for Palestinian liberation.",
      paymentNote: team
        ? `Team ${team.name} • ID ${team.id} • slug ${team.slug}`
        : "General Palestine Solidarity contribution",
    });

    const paymentLinkUrl = result.paymentLink?.url ?? result.paymentLink?.longUrl;

    if (!paymentLinkUrl) {
      throw new Error("Square did not return a payment link URL.");
    }

    return NextResponse.json({ url: paymentLinkUrl });
  } catch (error) {
    if (error instanceof ApiError) {
      const firstError = error.result?.errors?.[0];
      const detail = firstError?.detail ?? firstError?.code ?? error.message;
      return NextResponse.json({ error: detail ?? "Square request failed." }, { status: error.statusCode ?? 500 });
    }

    const message = error instanceof Error ? error.message : "Unable to create payment link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
