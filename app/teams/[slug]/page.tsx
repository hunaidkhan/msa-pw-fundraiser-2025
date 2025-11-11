// app/teams/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeamBySlug } from "@/config/teams";
import { Suspense } from "react";
import { DonateInline } from "./DonateInline";
import { totalsByTeam } from "@/lib/donationsStore";

// Use ISR with 30-second revalidation instead of force-dynamic
export const revalidate = 20;
export const runtime = "nodejs";

// To switch to root-level slugs (e.g., /team-falcon), move this file to app/[slug]/page.tsx and update links accordingly.

type TeamPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ params }: TeamPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);

  if (!team) {
    return { title: "Team not found | Palestine Solidarity Fundraiser" };
  }

  const title = `${team.name} | Palestine Solidarity Fundraiser`;
  const description =
    team.description ??
    "Join our collective effort to provide relief, resilience, and hope for communities across Palestine.";

  return {
    title,
    description,
    openGraph: { title, description, type: "article", url: `/teams/${team.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
};

const TeamPage = async ({ params, searchParams }: TeamPageProps) => {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  const goal = team.fundraisingGoal ?? 0;

  // Live raised (from webhook-backed store), fallback to 0 if anything goes wrong
  let raisedCents = 0;
  try {
    const totals = await totalsByTeam();
    raisedCents = totals[team.slug] ?? 0;
  } catch {
    raisedCents = 0;
  }
  const raised = Math.max(0, raisedCents) / 100;

  const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const showThankYou = Boolean(resolvedSearchParams?.thankyou);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f2fbf6] via-white to-[#fff5f5] text-slate-900">
      {/* Animated color washes echoing the Palestine flag */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#007a3d]/20 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#ce1126]/20 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#007a3d] via-black to-[#ce1126]" />
        <div className="absolute inset-x-10 top-28 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
        {showThankYou ? (
          <section className="group relative overflow-hidden rounded-[28px] border border-emerald-200/70 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/80 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <p className="inline-flex items-center rounded-full bg-emerald-50/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Shukran Jazeelan
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
              Thank you for supporting {team.name}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-700">
              Your contribution nurtures hope, resilience, and liberation for families across Palestine. Share this campaign and invite others into the movement.
            </p>
          </section>
        ) : null}

        <section className="group relative overflow-hidden rounded-[32px] border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-16 top-20 h-40 w-40 rounded-full bg-[#007a3d]/15 blur-2xl transition-all duration-[4000ms] ease-in-out group-hover:translate-y-4" />
            <div className="absolute -right-16 bottom-16 h-44 w-44 rounded-full bg-[#ce1126]/15 blur-2xl transition-all duration-[4000ms] ease-in-out group-hover:-translate-y-4" />
            <div className="absolute inset-x-12 top-0 h-1 bg-gradient-to-r from-[#007a3d] via-black to-[#ce1126]" />
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-8">
              <p className="inline-flex items-center rounded-full bg-[#007a3d]/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#007a3d]">
                Free Palestine
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{team.name}</h1>
              {team.description ? (
                <p className="text-lg leading-relaxed text-slate-700">{team.description}</p>
              ) : null}

              <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-inner">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-3xl font-bold text-slate-950">
                    ${raised.toLocaleString("en-CA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <span className="ml-2 text-base font-medium text-slate-500">raised (CAD)</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Goal: ${goal.toLocaleString("en-CA")} · {progress}% to target
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#007a3d] via-black to-[#ce1126] transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-6 shadow-inner">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-950">Your gift, your amount</h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Choose an amount below (currency is locked to <strong>CAD</strong>). When you click “Donate now”, we’ll create a secure Square checkout and take you straight there—no extra step.
                </p>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-sm">
                <Suspense fallback={<div className="text-sm text-slate-600">Loading donate form…</div>}>
                  <DonateInline slug={team.slug} />
                </Suspense>
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/60 bg-white/90 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">How your donation helps</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Winter kits and emergency relief to families in need</li>
                  <li>Support for students organizing and advocating on campus</li>
                  <li>Mutual aid for tuition, housing, and medical essentials</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
};

export default TeamPage;
