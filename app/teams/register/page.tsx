"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import DonateModal from "@/components/DonateModal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type FormState = {
  name: string;
  email: string;
  goal: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialFormState: FormState = {
  name: "",
  email: "",
  goal: "",
};

export default function RegisterTeamPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter a team name.";
    } else if (form.name.trim().length > 80) {
      nextErrors.name = "Team name must be 80 characters or fewer.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Contact email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.goal.trim()) {
      const parsed = Number(form.goal.trim());
      if (!Number.isInteger(parsed) || parsed < 0) {
        nextErrors.goal = "Goal must be a whole number of dollars, 0 or higher.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    const field = name as keyof FormState;
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setSubmissionError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch("/api/teams/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          goal: form.goal.trim() ? Number(form.goal.trim()) : undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; slug?: string; redirect?: string; error?: string }
        | null;

      if (!response.ok) {
        const message = data?.error || "We couldn't register that team just yet.";
        if (message.toLowerCase().includes("name")) {
          setErrors((previous) => ({ ...previous, name: message }));
        }
        setSubmissionError(message);
        return;
      }

      if (data?.redirect) {
        router.push(data.redirect);
      } else if (data?.slug) {
        router.push(`/teams/${data.slug}`);
      } else {
        router.push("/teams");
      }
    } catch (error) {
      console.error(error);
      setSubmissionError("Something went wrong. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-rose-50">
      <SiteHeader onDonateClick={() => setIsDonateOpen(true)} />

      <main className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-[#007a3d]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[#ce1126]/20 blur-3xl" aria-hidden="true" />

        <div className="relative w-full max-w-3xl">
          <div className="mb-8 space-y-3 text-center">
            <p className="inline-flex items-center justify-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow">
              Start a solidarity squad
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Register a fundraising team
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
              Launch a campus or community crew raising vital aid for Palestinian families. Share your details and we&apos;ll publish your team page instantly.
            </p>
          </div>

          <form
            className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="name">
                  Team name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onInput={handleChange}
                  placeholder="e.g. Team Hope"
                  className={`w-full rounded-2xl border px-4 py-3 text-base shadow-sm transition focus:border-[#007a3d] focus:outline-none focus:ring-4 focus:ring-[#007a3d]/20 ${errors.name ? "border-[#ce1126] focus:border-[#ce1126] focus:ring-[#ce1126]/20" : "border-slate-200 bg-white/80"}`}
                  disabled={isSubmitting}
                  maxLength={80}
                  required
                />
                {errors.name ? (
                  <p className="mt-2 text-sm font-medium text-[#ce1126]">{errors.name}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Your team name appears on the shared fundraising page.</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="email">
                  Contact email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onInput={handleChange}
                  placeholder="you@campus.edu"
                  className={`w-full rounded-2xl border px-4 py-3 text-base shadow-sm transition focus:border-[#007a3d] focus:outline-none focus:ring-4 focus:ring-[#007a3d]/20 ${errors.email ? "border-[#ce1126] focus:border-[#ce1126] focus:ring-[#ce1126]/20" : "border-slate-200 bg-white/80"}`}
                  disabled={isSubmitting}
                  required
                />
                {errors.email ? (
                  <p className="mt-2 text-sm font-medium text-[#ce1126]">{errors.email}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">We&apos;ll send coordination updates and donor inquiries here.</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="goal">
                  Fundraising goal (CAD)
                </label>
                <input
                  id="goal"
                  name="goal"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={form.goal}
                  onInput={handleChange}
                  placeholder="Optional"
                  className={`w-full rounded-2xl border px-4 py-3 text-base shadow-sm transition focus:border-[#007a3d] focus:outline-none focus:ring-4 focus:ring-[#007a3d]/20 ${errors.goal ? "border-[#ce1126] focus:border-[#ce1126] focus:ring-[#ce1126]/20" : "border-slate-200 bg-white/80"}`}
                  disabled={isSubmitting}
                />
                {errors.goal ? (
                  <p className="mt-2 text-sm font-medium text-[#ce1126]">{errors.goal}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Set a target to inspire your supporters—leave blank if you&apos;re still planning.</p>
                )}
              </div>
            </div>

            {submissionError ? (
              <div className="mt-6 rounded-2xl border border-[#ce1126]/40 bg-[#ce1126]/10 px-4 py-3 text-sm font-medium text-[#8f0d1a]">
                {submissionError}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-xs text-slate-500">
                By submitting you affirm your team will uphold the campaign&apos;s solidarity principles.
              </p>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#007a3d] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007a3d]/40 transition hover:bg-[#006633] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering…" : "Create my team"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <SiteFooter onDonateClick={() => setIsDonateOpen(true)} />
      <DonateModal open={isDonateOpen} onOpenChange={setIsDonateOpen} />
    </div>
  );
}

