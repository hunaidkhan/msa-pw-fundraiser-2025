import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTeams, getTeamBySlug } from "@/config/teams";

// To switch to root-level slugs (e.g., /team-falcon), move this file to app/[slug]/page.tsx and update links accordingly.

type TeamPageProps = {
  params: { slug: string };
};

export const generateStaticParams = () =>
  getAllTeams().map((team) => ({ slug: team.slug }));

export const generateMetadata = ({ params }: TeamPageProps): Metadata => {
  const { slug } = params;
  const team = getTeamBySlug(slug);

  if (!team) {
    return {
      title: "Team not found | Palestine Solidarity Fundraiser",
    };
  }

  const title = `${team.name} | Palestine Solidarity Fundraiser`;
  const description =
    team.description ??
    "Join our collective effort to provide relief, resilience, and hope for communities across Palestine.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/teams/${team.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
};

const TeamPage = ({ params }: TeamPageProps) => {
  const { slug } = params;
  const team = getTeamBySlug(slug);

  if (!team) {
    notFound();
  }

  const goal = team.fundraisingGoal ?? 0;
  const raised = team.fundraisingRaised ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-700 via-black/80 to-red-700/70 py-20 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-white/20 bg-white/5 p-10 shadow-2xl backdrop-blur">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%)]" />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-6">
              <p className="inline-flex items-center rounded-full bg-emerald-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                Free Palestine
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{team.name}</h1>
              {team.description ? (
                <p className="text-lg leading-relaxed text-zinc-100/90">{team.description}</p>
              ) : null}
            </div>
            <div className="flex w-full max-w-sm flex-col gap-6 rounded-3xl bg-white/10 p-6 shadow-lg shadow-emerald-500/30">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
                  Fundraising Progress
                </h2>
                <p className="mt-2 text-3xl font-bold text-white">
                  ${raised.toLocaleString()} <span className="text-base font-medium text-emerald-200">raised</span>
                </p>
                <p className="text-sm text-zinc-200">
                  Goal: ${goal.toLocaleString()} · {progress}% to target
                </p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-white to-red-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid gap-3 text-sm text-zinc-200">
                <span>Amplify this team by sharing their story and giving generously.</span>
                <span className="text-xs uppercase tracking-[0.25em] text-emerald-200/80">
                  Liberation through solidarity
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {/* Example embedding with a modal */}
                {/* <DonateModal open={isOpen} onOpenChange={setOpen} defaultTeamId={team.id} /> */}
                <Link
                  href={`/donate?teamId=${team.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-white/90 to-red-500 px-6 py-3 text-base font-semibold text-black shadow-lg shadow-emerald-500/40 transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Donate to {team.name}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TeamPage;
