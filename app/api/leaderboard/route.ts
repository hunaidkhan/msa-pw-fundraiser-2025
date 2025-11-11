import { NextResponse } from "next/server";
import { getAllTeams } from "@/config/teams";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  try {
    const teams = await getAllTeams();

    // Sort teams by funds raised (highest first)
    const leaderboard = teams
      .map((team) => ({
        rank: 0, // Will be assigned below
        id: team.id,
        slug: team.slug,
        name: team.name,
        logoUrl: team.logoUrl,
        fundraisingRaised: team.fundraisingRaised ?? 0,
        fundraisingGoal: team.fundraisingGoal,
        progress: team.fundraisingGoal
          ? Math.round(((team.fundraisingRaised ?? 0) / team.fundraisingGoal) * 100)
          : 0,
      }))
      .sort((a, b) => b.fundraisingRaised - a.fundraisingRaised)
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      leaderboard,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow embedding from any domain
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
