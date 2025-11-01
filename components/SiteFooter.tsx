"use client";

import { m } from "framer-motion";

type SiteFooterProps = {
  onDonateClick?: () => void;
};

export function SiteFooter({ onDonateClick }: SiteFooterProps) {
  return (
    <footer className="mt-auto border-t border-black/10 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <m.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-base font-semibold text-slate-900">
            Muslim Students Association · Palestine Relief Committee
          </p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
            Every contribution fuels critical aid deliveries, campus education,
            and direct support for families under occupation.
          </p>
        </m.div>
        <m.div
          className="flex flex-col items-start gap-3 text-sm md:items-end"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-[#007a3d] px-4 py-2 font-semibold text-white shadow-md transition hover:bg-[#006633]"
            onClick={onDonateClick}
          >
            Give Today
          </button>
          <div className="text-xs text-slate-500">
            <p>Contact · msa-pal@campus.edu</p>
            <p>© {new Date().getFullYear()} MSA Solidarity Network</p>
          </div>
        </m.div>
      </div>
    </footer>
  );
}

export default SiteFooter;
