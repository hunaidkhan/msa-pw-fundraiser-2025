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
      logoUrl: team.logoUrl,
      fundraisingRaised: team.fundraisingRaised ?? 0,
      fundraisingGoal: team.fundraisingGoal,
      progress: team.fundraisingGoal
        ? Math.min(Math.round(((team.fundraisingRaised ?? 0) / team.fundraisingGoal) * 100), 100)
        : 0,
    }))
    .sort((a, b) => b.fundraisingRaised - a.fundraisingRaised);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-2xl bg-white/90 p-6 shadow-lg backdrop-blur-sm">
          <h1 className="text-center text-3xl font-bold text-slate-900">
            🏆 Fundraising Leaderboard
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Teams ranked by total funds raised
          </p>
        </div>

        <div className="space-y-4">
          {leaderboard.map((team, index) => (
            <div
              key={team.id}
              className="group rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-md transition-all hover:shadow-xl"
            >
              <div className="flex items-start gap-4">
                {/* Rank Badge */}
                <div className="flex-shrink-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg"
                        : index === 1
                          ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-md"
                          : index === 2
                            ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </div>
                </div>

                {/* Team Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {team.logoUrl && (
                        <img
                          src={team.logoUrl}
                          alt={`${team.name} logo`}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <h3 className="text-lg font-semibold text-slate-900">
                        {team.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
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
                    <div className="mt-4">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#007a3d] via-[#000000] to-[#ce1126] transition-all duration-500"
                          style={{ width: `${team.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs font-medium text-slate-600">
                        {team.progress}% complete
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Updated every 60 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
