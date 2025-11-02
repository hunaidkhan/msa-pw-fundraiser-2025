import Link from "next/link";
import type { Metadata } from "next";
import { TeamCard } from "@/app/components/TeamCard";
import { getAllTeams } from "@/config/teams";

export const metadata: Metadata = {
  title: "Meet Our Teams | Palestine Solidarity Fundraiser",
  description:
    "Discover the teams championing relief, resilience, and hope for communities across Palestine.",
};

const TeamsPage = () => {
  const teams = getAllTeams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-700 via-white to-red-600/20 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6">
        <header className="text-center">
          <p className="inline-flex items-center rounded-full bg-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-emerald-500/30">
            Together for Palestine
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Stand with our fundraising teams
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-700 sm:text-lg">
            Each team is organizing for liberation, providing urgent relief, and investing in long-term dignity for Palestinian
            families. Choose a team to learn more and fuel their impact.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/teams/explore"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 via-black to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              Explore Teams
            </Link>
            <Link
              href="#teams"
              className="inline-flex items-center justify-center rounded-full border border-emerald-500/60 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              View team grid
            </Link>
          </div>
        </header>

        <section id="teams" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </section>
      </div>
    </div>
  );
};

export default TeamsPage;
