import Image from "next/image";
import Link from "next/link";
import type { Team } from "@/config/teams";

type TeamCardProps = {
  team: Team;
};

export const TeamCard = ({ team }: TeamCardProps) => {
  const goal = team.fundraisingGoal ?? 0;
  const raised = team.fundraisingRaised ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <article className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white/95 p-8 shadow-lg shadow-emerald-200/40 transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{team.name}</h3>
          {team.description ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{team.description}</p>
          ) : null}
        </div>
        {/* {team.logoUrl ? (
          <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600/10">
            <Image src={team.logoUrl} alt="" width={48} height={48} className="h-8 w-8 object-contain" />
          </span>
        ) : null} */}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-200">
          <span>Raised</span>
          <span>
            ${raised.toLocaleString()} / ${goal.toLocaleString()} · {progress}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-zinc-900 to-red-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Link
        href={`/teams/${team.slug}`}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 via-black to-red-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        Donate Now
      </Link>
    </article>
  );
};
