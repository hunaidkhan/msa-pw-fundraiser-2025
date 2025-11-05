"use client";

import { useMemo, useState } from "react";

const presets = [25, 50, 100, 250];

export function DonateInline({ slug }: { slug: string }) {
  const [amount, setAmount] = useState<string>("50");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numeric = useMemo(() => Number(amount), [amount]);
  const disabled =
    submitting || !Number.isFinite(numeric) || numeric <= 0;

  async function onDonate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (disabled) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/teams/${encodeURIComponent(slug)}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numeric, currency: "CAD" }),
      });

      const data = (await res.json()) as { url?: string; error?: string; hint?: string };
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Unable to create payment link. Please try again.");
      }

      // Direct redirect to Square checkout (single-step flow)
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onDonate} className="space-y-4">
      <label htmlFor="amount" className="text-sm font-semibold text-slate-700">
        Donation amount (CAD)
      </label>
      <div className="flex items-center gap-3">
        <span className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">CAD</span>
        <input
          id="amount"
          type="number"
          min="1"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-lg text-slate-900 shadow-sm focus:border-[#007a3d] focus:outline-none focus:ring-2 focus:ring-[#007a3d]/30"
          placeholder="50"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ${v}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#007a3d] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007a3d]/30 transition hover:bg-[#006633] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Preparing secure checkout…" : "Donate now"}
      </button>

      <p className="text-center text-xs text-slate-500">
        You’ll be taken to a secure Square checkout. Currency: <strong>CAD</strong>.
      </p>
    </form>
  );
}
