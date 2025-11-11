// app/teams/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeamBySlug } from "@/config/teams";
import { Suspense } from "react";
import { DonateInline } from "./DonateInline";
import { totalsByTeam } from "@/lib/donationsStore";

// Use ISR with 30-second revalidation instead of force-dynamic
export const revalidate = 30;
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
  const remaining = goal > 0 ? Math.max(goal - raised, 0) : 0;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const showThankYou = Boolean(resolvedSearchParams?.thankyou);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f4f8fb] via-white to-[#fff7f6] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#007a3d]/20 blur-3xl" />
        <div className="absolute -right-24 bottom-32 h-72 w-72 rounded-full bg-[#ce1126]/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#007a3d] via-black to-[#ce1126]" />
        <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-black/10 to-transparent lg:block" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
        {showThankYou ? (
          <section className="relative overflow-hidden rounded-[32px] border border-emerald-100/80 bg-white/80 p-10 shadow-xl backdrop-blur">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-emerald-50/60 via-white/40 to-emerald-50/60" />
            <p className="inline-flex items-center rounded-full bg-emerald-100/80 px-5 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Shukran Jazeelan
            </p>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Thank you for supporting {team.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700">
              Your contribution nurtures hope, resilience, and liberation for families across Palestine. Share this campaign and invite others into the movement.
            </p>
          </section>
        ) : null}

        <section className="relative overflow-hidden rounded-[40px] border border-white/40 bg-white/80 p-10 shadow-2xl backdrop-blur">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-x-10 top-0 h-1 bg-gradient-to-r from-[#007a3d] via-black to-[#ce1126]" />
            <div className="absolute -left-12 top-16 h-32 w-32 rotate-6 rounded-full bg-[#007a3d]/15 blur-2xl" />
            <div className="absolute -right-20 bottom-16 h-36 w-36 -rotate-12 rounded-full bg-[#ce1126]/15 blur-2xl" />
          </div>

          <div className="relative grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <p className="inline-flex items-center rounded-full bg-[#007a3d]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#007a3d]">
                  Free Palestine
                </p>
                {team.logoUrl ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm">
                    <img src={team.logoUrl} alt="Team logo" className="h-full w-full object-contain" />
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{team.name}</h1>
                {team.description ? (
                  <p className="max-w-2xl text-lg leading-relaxed text-slate-700">{team.description}</p>
                ) : (
                  <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
                    Join us as we rally support for vital relief and liberation work throughout Palestine.
                  </p>
                )}
              </div>

              <div className="grid gap-5 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-inner shadow-slate-200/40 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Raised to date</p>
                  <p className="text-4xl font-semibold text-slate-950">
                    $
                    {raised.toLocaleString("en-CA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-slate-600">Live totals update continuously as gifts are received.</p>
                </div>

                <div className="space-y-4 rounded-2xl bg-slate-50/80 p-5">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Goal</span>
                    <span>${goal.toLocaleString("en-CA")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Remaining</span>
                    <span>${remaining.toLocaleString("en-CA")}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#007a3d] via-black to-[#ce1126]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{progress}% to victory</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">Why your solidarity matters</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#007a3d]" />
                      Winterized aid, heaters, and staple food kits delivered quickly to displaced families.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-black" />
                      Direct support for campus organizers leading actions, teach-ins, and coalition work.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#ce1126]" />
                      Mutual aid that keeps tuition, housing, and medical needs covered for our community.
                    </li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-[#007a3d]/90 via-[#064c33] to-[#0b1d17] p-5 text-white shadow-lg">
                  <h2 className="text-base font-semibold">Spread the word</h2>
                  <p className="mt-3 text-sm text-white/80">
                    Invite your circles to donate, host solidarity events, or match contributions. Collective action gets us to the finish line faster.
                  </p>
                  {team.contactEmail ? (
                    <p className="mt-4 text-sm font-medium text-white">
                      Contact: <a className="underline decoration-white/60 underline-offset-2" href={`mailto:${team.contactEmail}`}>{team.contactEmail}</a>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-6 rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-8 shadow-inner">
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-600">
                  Give today
                </p>
                <h2 className="text-2xl font-semibold text-slate-950">Choose your solidarity gift</h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Pick an amount below (currency is locked to <strong>CAD</strong>). “Donate now” opens a secure Square checkout right away—no extra steps.
                </p>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
                <Suspense fallback={<div className="text-sm text-slate-600">Loading donate form…</div>}>
                  <DonateInline slug={team.slug} />
                </Suspense>
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/60 bg-white/90 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Where your donation travels</p>
                <ul className="space-y-2">
                  <li>Rapid response relief delivered with trusted partners on the ground.</li>
                  <li>Education, teach-ins, and mobilization for Palestinian liberation.</li>
                  <li>Community care for students and families experiencing displacement.</li>
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
