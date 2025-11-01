"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { FUNDS } from "@/config/funds";

const TEAM_ID = "team-falcon";
const DEFAULT_FUND_ID = "relief";
const FUNDRAISING_GOAL = 25000;
const FUNDS_RAISED = 14350;
const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function TeamFalconPage() {
  const [amount, setAmount] = useState<number | "">(SUGGESTED_AMOUNTS[1]);
  const [fundId, setFundId] = useState<string>(DEFAULT_FUND_ID);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressPercentage = useMemo(() => {
    if (FUNDRAISING_GOAL <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((FUNDS_RAISED / FUNDRAISING_GOAL) * 100));
  }, []);

  const funds = useMemo(() => FUNDS, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = typeof amount === "number" ? amount : Number(amount);
    if (!Number.isFinite(numericAmount)) {
      setError("Please enter a valid amount");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, teamId: TEAM_ID, fundId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to create payment link" }));
        throw new Error(data.error ?? "Unable to create payment link");
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) {
        throw new Error("Square did not return a payment link");
      }

      window.location.href = data.url;
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-12 bg-white px-6 pb-16 pt-12 text-neutral-900">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <p className="text-sm font-medium uppercase tracking-widest text-rose-600">Team Falcon</p>
        <h1 className="text-4xl font-bold sm:text-5xl">Fuel the Falcon Flight</h1>
        <p className="text-base text-neutral-600 sm:text-lg">
          We&apos;re rallying support to empower youth mentorship, community outreach, and emergency relief
          initiatives. Every contribution helps Team Falcon soar higher.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Raised so far</p>
            <p className="text-3xl font-bold text-neutral-900">{formatCurrency(FUNDS_RAISED)}</p>
          </div>
          <div className="text-sm text-neutral-600">
            Goal: <span className="font-semibold text-neutral-900">{formatCurrency(FUNDRAISING_GOAL)}</span>
          </div>
        </div>
        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-rose-500 transition-all"
            style={{ width: `${progressPercentage}%` }}
            aria-hidden
          />
        </div>
        <p className="mt-2 text-sm text-neutral-600">{progressPercentage}% of our goal reached</p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Donate to Team Falcon</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Choose an amount, select a fund, and we&apos;ll send you to a secure Square checkout to complete your donation.
        </p>

        <form className="mt-6 flex flex-col gap-6" onSubmit={handleSubmit}>
          <fieldset className="flex flex-wrap gap-3" aria-label="Suggested donation amounts">
            {SUGGESTED_AMOUNTS.map((preset) => {
              const isActive = amount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-rose-300 hover:text-rose-600"
                  }`}
                >
                  {formatCurrency(preset)}
                </button>
              );
            })}
          </fieldset>

          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
            Or enter a custom amount
            <input
              type="number"
              min={1}
              step="0.01"
              value={amount === "" ? "" : amount}
              onChange={(event) => {
                const value = event.target.value;
                setAmount(value === "" ? "" : Number(value));
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
            Choose a fund
            <select
              value={fundId}
              onChange={(event) => setFundId(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isSubmitting ? "Creating link..." : "Donate Now"}
          </button>
        </form>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-6 text-sm text-neutral-600 sm:flex-row">
        <p>Thank you for helping Team Falcon make an impact.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:border-rose-400 hover:text-rose-600"
        >
          Back to Home
        </Link>
      </footer>
    </div>
  );
}
