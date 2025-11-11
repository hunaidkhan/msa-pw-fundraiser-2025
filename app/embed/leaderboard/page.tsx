import { getAllTeams } from "@/config/teams";

export const revalidate = 60; // Revalidate every 60 seconds

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function LeaderboardEmbed() {
  const teams = await getAllTeams();

  // Sort teams by funds raised (highest first)
  const leaderboard = teams
    .map((team) => ({
      id: team.id,
      slug: team.slug,
      name: team.name,
      description: team.description,
      fundraisingRaised: team.fundraisingRaised ?? 0,
      fundraisingGoal: team.fundraisingGoal,
      progress: team.fundraisingGoal
        ? Math.min(Math.round(((team.fundraisingRaised ?? 0) / team.fundraisingGoal) * 100), 100)
        : 0,
    }))
    .sort((a, b) => b.fundraisingRaised - a.fundraisingRaised);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-rose-50">
      {/* Palestinian-themed blur decorations */}
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#007a3d]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[#000000]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#ce1126]/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#007a3d]" />
            Live Leaderboard
          </div>
          <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl lg:text-5xl">
            Palestine Week Fundraising
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Teams ranked by total solidarity raised • Updates every 60 seconds
          </p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {leaderboard.map((team, index) => (
            <article
              key={team.id}
              className="group rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-emerald-200/40 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-200/50 sm:p-8"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                {/* Rank Badge */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2">
                  <div
                    className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl font-bold shadow-md transition-transform group-hover:scale-105 sm:h-16 sm:w-16 ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-yellow-500/50"
                        : index === 1
                          ? "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-slate-800 shadow-slate-400/50"
                          : index === 2
                            ? "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white shadow-orange-500/50"
                            : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 sm:hidden">
                    Rank {index + 1}
                  </span>
                </div>

                {/* Team Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-bold text-[#007a3d] sm:text-3xl">
                        {formatCurrency(team.fundraisingRaised)}
                      </p>
                      {team.fundraisingGoal && (
                        <p className="text-xs text-slate-500">
                          of {formatCurrency(team.fundraisingGoal)} goal
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {team.fundraisingGoal && (
                    <div className="space-y-2">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#007a3d] via-[#000000] to-[#ce1126] transition-all duration-500"
                          style={{ width: `${team.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">
                          {team.progress}% complete
                        </span>
                        <span className="text-slate-500">
                          {formatCurrency(team.fundraisingGoal - team.fundraisingRaised)} to go
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="rounded-full bg-white/70 px-4 py-2 text-xs text-slate-500 shadow">
            Last updated: {new Date().toLocaleTimeString()} • Auto-refreshes every 60 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
