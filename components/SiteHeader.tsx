"use client";

import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";

export function SiteHeader() {
  return (
    <LazyMotion features={domAnimation}>
      <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <m.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative h-10 w-[140px]">
              <Image
                src="/msa-logo.png"
                alt="Muslim Students' Association logo"
                fill
                sizes="140px"
                className="object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="text-xl font-semibold text-slate-900">
                Palestine Week 2025
              </p>
            </div>
          </m.div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <Link className="hover:text-slate-950" href="/teams#teams">
              Teams
            </Link>
            <Link className="hover:text-slate-950" href="/teams/explore">
              Explore
            </Link>
            <Link className="hover:text-slate-950" href="/teams/register">
              Start a Team
            </Link>
          </nav>

          <Link href="/teams#teams" className="inline-flex">
            <m.span
              className="inline-flex items-center gap-2 rounded-full bg-[#ce1126] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ce1126]/40 transition hover:bg-[#b20d1f]"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
            >
              Donate Now
            </m.span>
          </Link>
        </div>
      </header>
    </LazyMotion>
  );
}

export default SiteHeader;
