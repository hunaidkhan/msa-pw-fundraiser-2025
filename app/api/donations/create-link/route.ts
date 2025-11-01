import { NextResponse } from "next/server";
import { Client, Environment } from "square";
import crypto from "node:crypto";
import { getTeamById } from "@/config/teams";

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;

const client = accessToken
  ? new Client({
      accessToken,
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
      metadata: team
        ? {
            teamId: team.id,
            teamSlug: team.slug,
          }
        : undefined,
    });

    if (!result?.paymentLink?.url) {
      throw new Error("Square did not return a payment link URL.");
    }

    return NextResponse.json({ url: result.paymentLink.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payment link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
