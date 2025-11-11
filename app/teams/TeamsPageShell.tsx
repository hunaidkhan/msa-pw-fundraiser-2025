"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";

import DonateModal from "@/components/DonateModal";
import SiteHeader from "@/components/SiteHeader";
import type { Team } from "@/config/teams";
import { TeamCard } from "@/app/components/TeamCard";

type TeamsPageShellProps = {
  teams: Team[];
};

export function TeamsPageShell({ teams }: TeamsPageShellProps) {
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  const scrollToTeams = () => {
    const teamsSection = document.getElementById('teams');
    if (teamsSection) {
      teamsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const { totalRaised, totalGoal, overallProgress } = useMemo(() => {
    const totals = teams.reduce(
      (accumulator, team) => {
        const goal = team.fundraisingGoal ?? 0;
        const raised = team.fundraisingRaised ?? 0;

        return {
          totalRaised: accumulator.totalRaised + raised,
          totalGoal: accumulator.totalGoal + goal,
        };
      },
      { totalRaised: 0, totalGoal: 0 }
    );

    const progress =
      totals.totalGoal > 0
        ? Math.min(100, Math.round((totals.totalRaised / totals.totalGoal) * 100))
        : null;

    return { ...totals, overallProgress: progress };
  }, [teams]);

  const featuredTeams = useMemo(
    () =>
      [...teams]
        .sort((first, second) => {
          const firstRaised = first.fundraisingRaised ?? 0;
          const secondRaised = second.fundraisingRaised ?? 0;
          return secondRaised - firstRaised;
        })
        .slice(0, 3),
    [teams]
  );

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-100 via-white to-rose-100">
        <SiteHeader onDonateClick={scrollToTeams} />

        <main className="relative flex-1 overflow-hidden">
          {/* Animated background orbs with Palestine colors */}
          <m.div
            className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#007a3d]/25 blur-2xl"
            animate={{
              scale: [1, 1.1, 1.05, 1],
              x: [0, 15, -5, 0],
              y: [0, 10, 5, 0],
              opacity: [0.25, 0.35, 0.3, 0.25],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <m.div
            className="pointer-events-none absolute -right-20 top-32 h-80 w-80 rounded-full bg-[#ce1126]/30 blur-3xl"
            animate={{
              scale: [1, 1.15, 1.08, 1],
              x: [0, -20, -10, 0],
              y: [0, 15, 8, 0],
              opacity: [0.3, 0.4, 0.35, 0.3],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <m.div
            className="pointer-events-none absolute left-1/3 top-1/3 h-80 w-80 rounded-full bg-[#000000]/8 blur-3xl"
            animate={{
              scale: [1, 1.2, 1.1, 1],
              opacity: [0.08, 0.14, 0.11, 0.08],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
            <header className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
              <div className="space-y-6">
                <m.p
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  PW 2025 Fundraising Campaign
                </m.p>

                <m.h1
                  className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-[3.4rem]"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                >
                  Meet the teams powering this week's fundraising efforts.
                </m.h1>

                <m.p
                  className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                >
                  PW is a week-long initiative dedicated to preserving Palestine’s history, condemning present-day injustices, and spreading hope for a blessed, free future. We seek to educate, fundraise, and spread the message of Palestine across a campus that has fought to silence it.
                </m.p>

                <m.div
                  className="flex flex-col gap-3 sm:flex-row"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
                >
                  <Link
                    href="/teams/register"
                    className="inline-flex items-center justify-center rounded-full bg-[#ce1126] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ce1126]/40 transition hover:bg-[#b20d1f]"
                  >
                    Start a team
                  </Link>
                  <Link
                    href="/teams/explore"
                    className="inline-flex items-center justify-center rounded-full border border-slate-900/15 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow transition hover:border-slate-900/30"
                  >
                    Donate to a team
                  </Link>
                </m.div>
              </div>

            <m.aside
              className="relative rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            >
              <div className="absolute -top-6 right-6 inline-flex items-center gap-2 rounded-full bg-[#007a3d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                Leaderboard
              </div>

              <div className="space-y-5 text-sm">
                {featuredTeams.length > 0 ? (
                  featuredTeams.map((team) => {
                    const goal = team.fundraisingGoal ?? 0;
                    const raised = team.fundraisingRaised ?? 0;
                    const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

                    return (
                      <div
                        key={team.id}
                        className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{team.name}</p>
                            {team.description ? (
                              <p className="mt-1 text-xs leading-relaxed text-slate-600">{team.description}</p>
                            ) : null}
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            {progress}%
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#007a3d] via-[#000000] to-[#ce1126]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          ${raised.toLocaleString()} raised of {goal > 0 ? `$${goal.toLocaleString()}` : "an open goal"}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm leading-relaxed text-slate-600">
                    Teams will appear here as soon as they start fundraising. Check back shortly to see live progress updates.
                  </p>
                )}
              </div>
            </m.aside>
          </header>

          <section className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Active teams</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{teams.length}</dd>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Collected so far</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">
                ${totalRaised.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Campaign progress</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">
                {overallProgress !== null ? `${overallProgress}%` : "—"}
              </dd>
              <p className="mt-1 text-xs text-slate-500">
                {totalGoal > 0 ? `of $${totalGoal.toLocaleString()} shared goal` : "Open-ended solidarity"}
              </p>
            </div>
          </section>

          <section id="teams" className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">Browse all teams</h2>
                {/* <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                  Discover the breadth of mutual aid efforts across campuses, community centers, and diaspora partners.
                </p> */}
              </div>
              <Link
                href="/teams/register"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/15 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:border-slate-900/30"
              >
                Add your team to the roster
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <DonateModal open={isDonateOpen} onOpenChange={setIsDonateOpen} />
      </div>
    </LazyMotion>
  );
}

export default TeamsPageShell;
