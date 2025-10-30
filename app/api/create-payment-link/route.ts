import { NextResponse } from "next/server";
import { ApiError } from "square";
import { z, ZodError } from "zod";

import { getFundById } from "@/config/funds";
import { getTeamById } from "@/config/teams";
import { env } from "@/lib/env";
import { squareClient } from "@/lib/square";

const payloadSchema = z.object({
  amount: z
    .number({ required_error: "amount is required" })
    .positive("amount must be greater than 0"),
  teamId: z.string({ required_error: "teamId is required" }).min(1, "teamId is required"),
  fundId: z.string({ required_error: "fundId is required" }).min(1, "fundId is required"),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const { amount, teamId, fundId } = payloadSchema.parse(body);

    const team = getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const fund = getFundById(fundId);
    if (!fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    const amountInCents = Math.round(amount * 100);

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ error: "amount must convert to a positive number of cents" }, { status: 400 });
    }

    const response = await squareClient.checkoutApi.createPaymentLink({
      quickPay: {
        name: `${team.name} — ${fund.name}`,
        locationId: env.SQUARE_LOCATION_ID,
        priceMoney: {
          amount: BigInt(amountInCents),
          currency: "USD",
        },
      },
      checkoutOptions: {
        redirectUrl: `${env.BASE_URL}/donate/thank-you?teamId=${encodeURIComponent(teamId)}&fundId=${encodeURIComponent(fundId)}`,
      },
    });

    const url = response.result.paymentLink?.url;

    if (!url) {
      return NextResponse.json({ error: "Square did not return a payment link" }, { status: 502 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: error.errors.map((issue) => ({ path: issue.path, message: issue.message })),
        },
        { status: 400 },
      );
    }

    if (error instanceof ApiError) {
      const squareError = error.errors?.[0];
      const message = squareError?.detail ?? squareError?.message ?? "Unexpected error from Square";
      const status = error.statusCode ?? 502;

      return NextResponse.json({ error: message }, { status });
    }

    console.error("Unexpected error creating payment link", error);
    return NextResponse.json({ error: "Unable to create payment link" }, { status: 500 });
  }
}
