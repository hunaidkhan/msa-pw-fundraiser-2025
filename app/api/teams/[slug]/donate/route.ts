// Add this to your donate route to help debug

import { NextRequest, NextResponse } from "next/server";
import { ApiError, Client, Environment } from "square";
import crypto from "node:crypto";
import { getTeamBySlug } from "@/config/teams";

/** Pick Square env from deployment context */
const isProd = process.env.VERCEL_ENV === "production";
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;
const CURRENCY = (process.env.SQUARE_CURRENCY || "CAD").toUpperCase();

function assertEnv() {
  const missing: string[] = [];
  if (!accessToken) missing.push("SQUARE_ACCESS_TOKEN");
  if (!locationId) missing.push("SQUARE_LOCATION_ID");
  
  if (missing.length) {
    console.error("[Donate Route] Missing environment variables:", missing);
    throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
  }
  
  // 🔍 Add helpful debugging info
  console.log("[Donate Route] Square Environment:", isProd ? "PRODUCTION" : "SANDBOX");
  console.log("[Donate Route] VERCEL_ENV:", process.env.VERCEL_ENV);
  console.log("[Donate Route] Access Token prefix:", accessToken?.substring(0, 10) + "...");
  console.log("[Donate Route] Location ID:", locationId?.substring(0, 8) + "...");
  
  // 🚨 Token format validation
  if (isProd && accessToken?.startsWith("EAAAEOoq")) {
    console.warn("[Donate Route] ⚠️  WARNING: This looks like a SANDBOX token but you're in PRODUCTION mode!");
  }
  if (!isProd && !accessToken?.startsWith("EAAAEOoq")) {
    console.warn("[Donate Route] ⚠️  WARNING: This looks like a PRODUCTION token but you're in SANDBOX mode!");
  }
  
  if (CURRENCY !== "CAD") {
    throw new Error(`Only CAD is supported currently. Set SQUARE_CURRENCY=CAD (got ${CURRENCY}).`);
  }
}

function makeClient() {
  const env = isProd ? Environment.Production : Environment.Sandbox;
  console.log("[Donate Route] Creating Square client for environment:", env);
  
  return new Client({
    bearerAuthCredentials: { accessToken: accessToken! },
    environment: env,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  console.log("[Donate Route] Request received");
  
  try {
    assertEnv();
    console.log("[Donate Route] Environment variables validated");

    const { slug } = await ctx.params;
    console.log("[Donate Route] Team slug:", slug);
    
    const team = await getTeamBySlug(slug);
    if (!team) {
      console.error("[Donate Route] Team not found:", slug);
      return NextResponse.json({ error: `Team not found for slug: ${slug}` }, { status: 404 });
    }
    console.log("[Donate Route] Team found:", team.name);

    const body = (await req.json()) as { amount?: number; currency?: string };
    const amount = Number(body?.amount ?? 0);
    console.log("[Donate Route] Amount:", amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Please provide a positive donation amount." }, { status: 400 });
    }
    if ((body?.currency || "CAD").toUpperCase() !== "CAD") {
      return NextResponse.json({ error: "Currency must be CAD." }, { status: 400 });
    }

    const cents = Math.round(amount * 100);
    const client = makeClient();

    const origin = new URL(req.url).origin;
    const redirectUrl = `${origin}/teams/${team.slug}?thankyou=1`;

    console.log("[Donate Route] Creating payment link for", cents, "cents");

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
      console.error("[Donate Route] Square did not return a payment link");
      return NextResponse.json({ error: "Square did not return a payment link." }, { status: 502 });
    }

    console.log("[Donate Route] Payment link created successfully");
    return NextResponse.json({ url });
    
  } catch (err) {
    console.error("[Donate Route] Error occurred:", err);
    
    if (err instanceof ApiError) {
      const e = err.result?.errors?.[0];
      console.error("[Donate Route] Square API Error:", {
        statusCode: err.statusCode,
        category: e?.category,
        code: e?.code,
        detail: e?.detail,
      });
      
      // Add helpful error messages
      let userMessage = e?.detail ?? e?.code ?? "Square request failed.";
      if (e?.category === "AUTHENTICATION_ERROR") {
        userMessage = "Payment system configuration error. Please contact support.";
        console.error("[Donate Route] 🚨 AUTHENTICATION ERROR - Check your Square credentials!");
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: err.statusCode ?? 500 }
      );
    }
    
    const msg = err instanceof Error ? err.message : "Unexpected error.";
    console.error("[Donate Route] Unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}