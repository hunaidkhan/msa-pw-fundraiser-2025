"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Team } from "@/config/teams";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

type DonationFormProps = {
  teams: Team[]; // Team must include: id, name, slug, description?
};

export const DonationForm = ({ teams }: DonationFormProps) => {
  // 🔁 Use SLUG as the identifier everywhere
  const [teamSlug, setTeamSlug] = useState<string>(teams[0]?.slug ?? "");
  const [amount, setAmount] = useState<string>("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.slug === teamSlug),
    [teams, teamSlug]
  );

  const quickAmounts = [25, 50, 100, 250];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPaymentLink(null);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setLoading(false);
      setError("Enter a donation amount greater than zero.");
      return;
    }

    try {
      // ✅ POST to slug-based API
      const response = await fetch(`/api/teams/${teamSlug}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) throw new Error(data.error ?? "Failed to generate payment link.");
      if (!data.url) throw new Error("No payment link was returned. Try again.");

      setPaymentLink(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start donation flow. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-2">
        <label htmlFor="team" className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
          Choose a team
        </label>
        <select
          id="team"
          value={teamSlug}
          onChange={(event) => setTeamSlug(event.target.value)}
          className="w-full rounded-2xl border border-white/30 bg-black/30 px-4 py-3 text-sm text-white shadow-inner shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          {teams.map((team) => (
            <option key={team.slug} value={team.slug} className="text-zinc-900">
              {team.name}
            </option>
          ))}
        </select>
        {selectedTeam?.description ? (
          <p className="text-sm text-emerald-100/90">{selectedTeam.description}</p>
        ) : null}
      </div>

      <div className="grid gap-3">
        <label htmlFor="amount" className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
          Donation amount
        </label>
        <div className="flex gap-3">
          <span className="inline-flex items-center rounded-2xl bg-white/10 px-4 text-sm text-white">USD</span>
          <input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl border border-white/30 bg-black/30 px-4 py-3 text-lg text-white shadow-inner shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {quickAmounts.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
            >
              {formatter.format(value)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-sm text-emerald-100">
        <h3 className="text-base font-semibold text-white">Where your contribution goes</h3>
        <p className="mt-3 leading-relaxed">
          Every dollar is routed securely through Square to our verified organizers and distributed directly to support Palestinian
          relief, resilience, and liberation initiatives.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.35em] text-emerald-200/80">Transparency · Accountability · Solidarity</p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      {paymentLink ? (
        <div className="space-y-3 rounded-3xl border border-emerald-300/50 bg-emerald-500/10 p-6 text-emerald-50">
          <p className="text-base font-semibold text-white">Payment link ready</p>
          <p className="text-sm">Open the secure link below to complete your donation through Square.</p>
          <Link
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-white/90 to-red-500 px-6 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-500/40 transition hover:scale-[1.02]"
          >
            Complete Donation
          </Link>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-white/90 to-red-500 px-6 py-3 text-base font-semibold text-black shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Generating link..." : selectedTeam ? `Donate to ${selectedTeam.name}` : "Generate donation link"}
      </button>
    </form>
  );
};
