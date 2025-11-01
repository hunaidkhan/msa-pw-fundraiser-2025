import { NextResponse } from "next/server";
import { SquareError } from "square";
import { z, ZodError } from "zod";

import { getFundById } from "@/config/funds";
import { getTeamById } from "@/config/teams";
import { env } from "@/lib/env";
import { squareClient } from "@/lib/square";

const CURRENCY = "CAD" as const;
const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const amountSchema = z
  .preprocess((value) => {
    if (typeof value === "string" || typeof value === "number") {
      const parsed = Number(value);
      return parsed;
    }

    return value;
  }, z.number({ required_error: "amount is required", invalid_type_error: "amount must be a number" }))
  .refine((value) => Number.isFinite(value), { message: "amount must be a finite number" })
  .refine((value) => value >= 1, { message: "amount must be at least 1 CAD" })
  .refine((value) => value <= 100_000, { message: "amount must be at most 100000 CAD" });

const payloadSchema = z.object({
  amount: amountSchema,
  teamId: z.string({ required_error: "teamId is required" }).min(1, "teamId is required"),
  fundId: z.string({ required_error: "fundId is required" }).min(1, "fundId is required"),
});

class LocationCurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocationCurrencyError";
  }
}

async function ensureLocationSupportsCad() {
  try {
    const response = await squareClient.locationsApi.retrieveLocation(env.SQUARE_LOCATION_ID);
    const locationCurrency = response.result.location?.currency;

    if (!locationCurrency) {
      throw new LocationCurrencyError(
        `Square location ${env.SQUARE_LOCATION_ID} is missing a configured currency. Update the location to use ${CURRENCY}.`,
      );
    }

    if (locationCurrency !== CURRENCY) {
      throw new LocationCurrencyError(
        `Square location ${env.SQUARE_LOCATION_ID} uses ${locationCurrency}. Update the location to use ${CURRENCY} before creating payment links.`,
      );
    }
  } catch (error) {
    if (error instanceof SquareError) {
      throw new LocationCurrencyError(
        `Unable to verify Square location currency (${env.SQUARE_LOCATION_ID}). ${
          error.errors?.[0]?.detail ?? error.errors?.[0]?.message ?? ""
        }`.trim(),
      );
    }

    throw error;
  }
}

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }));
  }

  try {
    const { amount, teamId, fundId } = payloadSchema.parse(body);

    const team = getTeamById(teamId);
    if (!team) {
      return withCors(NextResponse.json({ error: "Team not found" }, { status: 404 }));
    }

    const fund = getFundById(fundId);
    if (!fund) {
      return withCors(NextResponse.json({ error: "Fund not found" }, { status: 404 }));
    }

    await ensureLocationSupportsCad();

    const amountInCents = Math.round(amount * 100);

    const response = await squareClient.checkoutApi.createPaymentLink({
      quickPay: {
        name: `${team.name} — ${fund.name}`,
        locationId: env.SQUARE_LOCATION_ID,
        priceMoney: {
          amount: BigInt(amountInCents),
          currency: CURRENCY,
        },
      },
      checkoutOptions: {
        redirectUrl: `${env.BASE_URL}/thank-you?teamId=${encodeURIComponent(teamId)}&fundId=${encodeURIComponent(fundId)}`,
      },
    });

    const url = response.result.paymentLink?.url;

    if (!url) {
      return withCors(NextResponse.json({ error: "Square did not return a payment link" }, { status: 502 }));
    }

    return withCors(NextResponse.json({ url }));
  } catch (error) {
    if (error instanceof ZodError) {
      return withCors(
        NextResponse.json(
          {
            error: "Invalid request",
            details: error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
          },
          { status: 400 },
        ),
      );
    }

    if (error instanceof LocationCurrencyError) {
      return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    if (error instanceof SquareError) {
      const squareError = error.errors?.[0];
      const message = squareError?.detail ?? squareError?.message ?? "Unexpected error from Square";
      const status = error.statusCode ?? 502;

      return withCors(NextResponse.json({ error: message }, { status }));
    }

    console.error("Unexpected error creating payment link", error);
    return withCors(NextResponse.json({ error: "Unable to create payment link" }, { status: 500 }));
  }
}
