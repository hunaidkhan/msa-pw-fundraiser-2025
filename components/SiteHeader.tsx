"use client";

import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";

import { ThemeToggle } from "@/components/ThemeToggle";

type SiteHeaderProps = {
  onDonateClick?: () => void;
};

export function SiteHeader({ onDonateClick }: SiteHeaderProps) {
  return (
    <LazyMotion features={domAnimation}>
      <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-md transition dark:border-white/10 dark:bg-zinc-900/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:flex-nowrap sm:gap-6 sm:px-6">
          <m.div
            className="flex min-w-0 items-center gap-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative h-10 w-24 shrink-0">
              <Image
                src="/MSAUofAlogo.webp"
                alt="MSA Logo"
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-xl font-semibold text-slate-900 dark:text-white">Palestine Week 2025</p>
              <p className="hidden text-sm text-slate-600 dark:text-zinc-300 sm:block">
                Winter fundraiser for relief, advocacy, and community care
              </p>
            </div>
          </m.div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 dark:text-zinc-300 md:flex">
            <a className="transition hover:text-slate-950 dark:hover:text-white" href="#impact">
              Impact
            </a>
            <a className="transition hover:text-slate-950 dark:hover:text-white" href="#program">
              Program
            </a>
            <a className="transition hover:text-slate-950 dark:hover:text-white" href="#faq">
              FAQ
            </a>
          </nav>

          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            <ThemeToggle />
            <m.button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ce1126] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ce1126]/40 transition hover:bg-[#b20d1f] sm:w-auto"
              onClick={onDonateClick}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
            >
              Donate Now
            </m.button>
          </div>
        </div>
      </header>
    </LazyMotion>
  );
}

export default SiteHeader;
