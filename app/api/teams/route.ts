// app/api/teams/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteAllTeams } from "@/config/teams";

export const runtime = "nodejs";

/**
 * DELETE /api/teams
 * Deletes all teams
 */
export async function DELETE(request: Request) {
  try {
    await deleteAllTeams();

    // Revalidate the teams pages so they show no teams
    try {
      revalidatePath("/teams");
      revalidatePath("/teams/explore");
    } catch (revalidateError) {
      console.warn("Revalidation failed:", revalidateError);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "All teams deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting all teams:", error);
    return NextResponse.json(
      { error: "Unable to delete all teams at this time." },
      { status: 500 }
    );
  }
}
