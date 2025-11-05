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

    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/teams/${encodeURIComponent(slug)}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numeric, currency: "CAD" }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Unable to create payment link. Please try again.");
      }

      // ✅ Keep loading state - redirect will happen while showing spinner
      window.location.href = data.url;
      // Loader stays visible until browser navigates away
      
    } catch (err) {
      // ❌ Only disable loading on error
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
          disabled={submitting}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-lg text-slate-900 shadow-sm focus:border-[#007a3d] focus:outline-none focus:ring-2 focus:ring-[#007a3d]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder="50"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            disabled={submitting}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#007a3d] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007a3d]/30 transition hover:bg-[#006633] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
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
          "Donate now"
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        You'll be taken to a secure Square checkout. Currency: <strong>CAD</strong>.
      </p>
    </form>
  );
}