import type { Metadata } from "next";
import Link from "next/link";
import { DonationForm } from "@/app/teams/explore/DonationForm";
import { getAllTeams } from "@/config/teams";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Explore Teams & Donate | Palestine Solidarity Fundraiser",
  description:
    "Choose a team, set your gift amount, and generate a secure Square payment link to support Palestinian liberation.",
};

const ExploreTeamsPage = async () => {
  const teams = await getAllTeams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-700 via-black to-red-700/80 py-20 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6">
        <header className="space-y-6 text-center">
          <p className="inline-flex items-center rounded-full bg-emerald-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100">
            Explore solidarity
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Choose your impact</h1>
          <p className="mx-auto max-w-2xl text-base text-emerald-100/90 sm:text-lg">
            Select a team, set your donation amount, and receive a secure Square checkout link tailored to your gift. Your
            contribution fuels urgent relief, community care, and long-term liberation for Palestine.
          </p>
        </header>

        <main className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <section className="rounded-[2.5rem] border border-white/15 bg-white/5 p-10 shadow-2xl backdrop-blur">
            <DonationForm teams={teams} />
          </section>
          <aside className="space-y-6 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-emerald-500/20 via-black/60 to-red-600/30 p-10 text-left shadow-xl">
            <h2 className="text-2xl font-semibold">Why Square?</h2>
            <p className="text-sm leading-relaxed text-emerald-50/90">
              Square provides encrypted, PCI-compliant processing so every donation is protected. Once you generate a link, you can
              complete payment on Square&apos;s hosted checkout, or share the link with friends and family to multiply the impact.
            </p>
            <div className="grid gap-4 text-sm text-emerald-50/80">
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                <p className="font-semibold text-white">Flexible giving</p>
                <p>Pick the exact amount that reflects your solidarity today.</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                <p className="font-semibold text-white">Team accountability</p>
                <p>Each link is tagged with the team you choose so funds are directed responsibly.</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                <p className="font-semibold text-white">Shareable solidarity</p>
                <p>Send your link to your network to keep the momentum for Palestine alive.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-sm text-emerald-100">
              <p>
                Looking to browse teams again?&nbsp;
                <Link href="/teams" className="font-semibold text-white underline underline-offset-4">
                  Return to the teams index
                </Link>
                .
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default ExploreTeamsPage;
