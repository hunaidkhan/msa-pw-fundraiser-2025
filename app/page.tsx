"use client";

import { useState } from "react";
import { m } from "framer-motion";
import DonateModal from "@/components/DonateModal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const highlightCards = [
  {
    title: "Emergency Relief",
    description:
      "Deliver winterized food kits, heaters, and blankets to families displaced across Gaza and the West Bank.",
  },
  {
    title: "Student Advocacy",
    description:
      "Fund teach-ins, divestment organizing, and cultural programming amplifying Palestinian voices on campus.",
  },
  {
    title: "Mutual Aid",
    description:
      "Support direct transfers that keep tuition, housing, and medical bills covered for affected students and relatives.",
  },
];

export default function HomePage() {
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  const openDonate = () => setIsDonateOpen(true);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader onDonateClick={openDonate} />
      <main className="flex-1">
        <section className="relative overflow-hidden py-24">
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-[#007a3d]/20 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#ce1126]/20 blur-3xl" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <m.p
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Winter 2025 Solidarity Drive
              </m.p>
              <m.h1
                className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              >
                Stand steadfast with Palestine. Fuel relief, resilience, and student power.
              </m.h1>
              <m.p
                className="max-w-2xl text-lg leading-relaxed text-slate-600"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              >
                The MSA is mobilizing record-breaking mutual aid to keep families warm, fund rapid medical shipments, and uplift campus advocacy. Your solidarity gift powers direct relief where it is needed most.
              </m.p>
              <m.div
                className="flex flex-col gap-3 sm:flex-row"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
              >
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-[#ce1126] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ce1126]/40 transition hover:bg-[#b20d1f]"
                  onClick={openDonate}
                >
                  Pledge your support
                </button>
                <a
                  className="inline-flex items-center justify-center rounded-full border border-slate-900/15 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow hover:border-slate-900/30"
                  href="#impact"
                >
                  Learn how funds are used
                </a>
              </m.div>
              <m.dl
                className="grid gap-6 sm:grid-cols-3"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={{
                  hidden: { opacity: 0, y: 32 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      staggerChildren: 0.1,
                      duration: 0.5,
                      ease: "easeOut",
                    },
                  },
                }}
              >
                {["$150k goal", "1,200 care kits", "400 student advocates"].map(
                  (value, index) => (
                    <m.div
                      key={value}
                      className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm shadow-sm"
                      variants={{
                        hidden: { opacity: 0, y: 24 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        {index === 0
                          ? "Campaign Goal"
                          : index === 1
                          ? "Aid Target"
                          : "Students Mobilized"}
                      </dt>
                      <dd className="mt-2 text-2xl font-semibold text-slate-900">
                        {value}
                      </dd>
                    </m.div>
                  )
                )}
              </m.dl>
            </div>
            <m.div
              className="relative rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            >
              <div className="absolute -top-6 right-6 flex items-center gap-2 rounded-full bg-[#007a3d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                Live impact
              </div>
              <div className="space-y-5">
                {highlightCards.map((card) => (
                  <m.div
                    key={card.title}
                    className="rounded-2xl border border-slate-100 bg-white/80 p-5 text-sm shadow"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <h3 className="text-base font-semibold text-slate-900">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {card.description}
                    </p>
                  </m.div>
                ))}
              </div>
            </m.div>
          </div>
        </section>

        <section id="impact" className="border-t border-slate-200 bg-white/90 py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 lg:flex-row lg:items-center">
            <m.div
              className="flex-1 space-y-4"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h2 className="text-3xl font-semibold text-slate-950">
                Where your solidarity travels
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                We partner with trusted grassroots networks in Rafah, Khan Younis, Ramallah, and the diaspora to deliver winter supplies, emergency medical grants, and scholarship support. Donations also equip our student organizers with resources to advocate for lasting liberation.
              </p>
              <p className="text-base leading-relaxed text-slate-600">
                Transparent reporting is sent to every donor, and each gift is fully tax-deductible through our 501(c)(3) fiscal sponsor.
              </p>
            </m.div>
            <m.div
              className="flex-1 rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-[#f7f7f7] to-white p-8 shadow-xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <ul className="space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#007a3d]" />
                  <p>
                    <strong className="text-slate-900">75%</strong> fuels direct humanitarian aid shipments coordinated with local NGOs.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#000000]" />
                  <p>
                    <strong className="text-slate-900">15%</strong> invests in campus programs, education, and coalition-building.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#ce1126]" />
                  <p>
                    <strong className="text-slate-900">10%</strong> powers rapid-response mutual aid for affected students and families.
                  </p>
                </li>
              </ul>
              <button
                type="button"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#007a3d] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007a3d]/40 transition hover:bg-[#006633]"
                onClick={openDonate}
              >
                Give with impact
              </button>
            </m.div>
          </div>
        </section>
      </main>
      <SiteFooter onDonateClick={openDonate} />
      <DonateModal open={isDonateOpen} onOpenChange={setIsDonateOpen} />
    </div>
  );
}
