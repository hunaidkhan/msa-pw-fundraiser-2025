"use client";

import { motion } from "framer-motion";

type SiteHeaderProps = {
  onDonateClick?: () => void;
};

export function SiteHeader({ onDonateClick }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007a3d] text-lg font-bold text-white shadow-md">
            MSA
          </div>
          <div className="leading-tight">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-600">
              Palestine Winter Fundraiser
            </p>
            <p className="text-base font-semibold text-slate-900">
              2025 Solidarity Campaign
            </p>
          </div>
        </motion.div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <a className="hover:text-slate-950" href="#impact">
            Impact
          </a>
          <a className="hover:text-slate-950" href="#program">
            Program
          </a>
          <a className="hover:text-slate-950" href="#faq">
            FAQ
          </a>
        </nav>
        <motion.button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-[#ce1126] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ce1126]/40 transition hover:bg-[#b20d1f]"
          onClick={onDonateClick}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
        >
          Donate Now
        </motion.button>
      </div>
    </header>
  );
}

export default SiteHeader;
