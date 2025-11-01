"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, m } from "framer-motion";
import { toast } from "sonner";

type DonateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  name: string;
  email: string;
  amount: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  name: "",
  email: "",
  amount: "",
  message: "",
};

export function DonateModal({ open, onOpenChange }: DonateModalProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSummary = useMemo(() => {
    const amountNumber = Number.parseFloat(form.amount || "0");
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return "Select a donation amount to preview your impact.";
    }
    if (amountNumber >= 500) {
      return "Your gift can fund a full winter aid package for a displaced family.";
    }
    if (amountNumber >= 250) {
      return "This contribution keeps trauma counseling and legal aid running for a week.";
    }
    if (amountNumber >= 100) {
      return "Covers emergency food parcels for a family of five.";
    }
    return "Every dollar sustains direct relief and amplifies student advocacy.";
  }, [form.amount]);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Please share your name.";
    if (!form.email.trim()) {
      nextErrors.email = "An email is required so we can send your receipt.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    const amountValue = Number.parseFloat(form.amount);
    if (!form.amount) {
      nextErrors.amount = "Let us know how much you'd like to contribute.";
    } else if (!Number.isFinite(amountValue) || amountValue <= 0) {
      nextErrors.amount = "Donation must be a positive number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validate()) {
      toast.error("Please fix the highlighted fields and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          amount: Number.parseFloat(form.amount),
          message: form.message.trim(),
        }),
      });

      if (!response.ok) throw new Error("Unable to create donation link");

      const data = (await response.json()) as { url?: string };
      if (!data?.url) throw new Error("Payment link was not returned.");

      toast.success("Redirecting you to our secure donation portal…");
      handleOpenChange(false);
      setForm(initialState);
      setErrors({});
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      toast.error("We couldn't start your donation—please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setErrors({});
    onOpenChange(nextOpen);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <m.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.div
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 24 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="relative w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 shadow-2xl">
                  <Dialog.Title className="text-2xl font-semibold text-slate-900">
                    Fuel urgent relief for Palestine
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-slate-600">
                    100% of online gifts are routed to vetted partners delivering winter kits, medical aid, and community resilience programming.
                  </Dialog.Description>
                  <button
                    type="button"
                    className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:text-slate-900"
                    onClick={() => handleOpenChange(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                    <div>
                      <label className="text-sm font-semibold text-slate-700" htmlFor="donate-name">
                        Full name
                      </label>
                      <input
                        id="donate-name"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-[#007a3d] focus:outline-none focus:ring-2 focus:ring-[#007a3d]/40"
                        placeholder="Amina Khalil"
                        value={form.name}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        disabled={isSubmitting}
                      />
                      {errors.name ? (
                        <p className="mt-1 text-xs text-[#ce1126]">{errors.name}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700" htmlFor="donate-email">
                        Email address
                      </label>
                      <input
                        id="donate-email"
                        type="email"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-[#007a3d] focus:outline-none focus:ring-2 focus:ring-[#007a3d]/40"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        disabled={isSubmitting}
                      />
                      {errors.email ? (
                        <p className="mt-1 text-xs text-[#ce1126]">{errors.email}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700" htmlFor="donate-amount">
                        Donation amount (USD)
                      </label>
                      <input
                        id="donate-amount"
                        inputMode="decimal"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-[#007a3d] focus:outline-none focus:ring-2 focus:ring-[#007a3d]/40"
                        placeholder="100"
                        value={form.amount}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, amount: event.target.value }))
                        }
                        disabled={isSubmitting}
                      />
                      {errors.amount ? (
                        <p className="mt-1 text-xs text-[#ce1126]">{errors.amount}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700" htmlFor="donate-message">
                        Message to organizers (optional)
                      </label>
                      <textarea
                        id="donate-message"
                        className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-[#007a3d] focus:outline-none focus:ring-2 focus:ring-[#007a3d]/40"
                        placeholder="Share a note of solidarity or a dedication."
                        value={form.message}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, message: event.target.value }))
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <m.div
                      className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
                      layout
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    >
                      {totalSummary}
                    </m.div>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center rounded-full bg-[#ce1126] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ce1126]/40 transition hover:bg-[#b20d1f] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Preparing secure checkout…" : "Continue to secure donation"}
                    </button>
                  </form>
                </div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export default DonateModal;
