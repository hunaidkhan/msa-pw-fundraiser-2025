"use client";

import { useMemo, useState } from "react";
import type { Team } from "@/config/teams";

const formatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
});

type DonationFormProps = {
  teams: Team[];
};

export const DonationForm = ({ teams }: DonationFormProps) => {
  const [teamSlug, setTeamSlug] = useState<string>(teams[0]?.slug ?? "");
  const [amount, setAmount] = useState<string>("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.slug === teamSlug),
    [teams, teamSlug]
  );

  const quickAmounts = [25, 50, 100, 250];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setLoading(false);
      setError("Enter a donation amount greater than zero.");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamSlug}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, currency: "CAD" }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) throw new Error(data.error ?? "Failed to generate payment link.");
      if (!data.url) throw new Error("No payment link was returned. Try again.");

      // ✅ Keep loading state - redirect will happen while showing spinner
      window.location.assign(data.url);
      // Loader stays visible until browser navigates away
      
    } catch (err) {
      // ❌ Only disable loading on error
      setError(err instanceof Error ? err.message : "Unable to start donation flow. Try again later.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-2">
        <label htmlFor="team" className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Choose a team
        </label>
        <select
          id="team"
          value={teamSlug}
          onChange={(event) => setTeamSlug(event.target.value)}
          disabled={loading}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {teams.map((team) => (
            <option key={team.slug} value={team.slug} className="text-zinc-900">
              {team.name}
            </option>
          ))}
        </select>
        {selectedTeam?.description ? (
          <p className="text-sm text-slate-700">{selectedTeam.description}</p>
        ) : null}
      </div>

      <div className="grid gap-3">
        <label htmlFor="amount" className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Donation amount (CAD)
        </label>
        <div className="flex gap-3">
          <span className="inline-flex items-center rounded-2xl bg-white px-4 text-sm text-slate-700 border border-slate-300">
            CAD
          </span>
          <input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {quickAmounts.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              disabled={loading}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formatter.format(value)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-200 bg-white p-6 text-sm text-slate-700">
        <h3 className="text-base font-semibold text-emerald-900">Where your contribution goes</h3>
        <p className="mt-3 leading-relaxed">
          Your gift is routed securely through Square to our organizers and distributed directly to support Palestinian relief,
          winter essentials, and student-led community care.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.35em] text-emerald-800/70">Transparency · Accountability · Solidarity</p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-400/40 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Redirecting to checkout...
          </>
        ) : (
          selectedTeam ? `Donate to ${selectedTeam.name}` : "Donate"
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        You'll be taken straight to a secure Square checkout. Currency: <strong>CAD</strong>.
      </p>
    </form>
  );
};