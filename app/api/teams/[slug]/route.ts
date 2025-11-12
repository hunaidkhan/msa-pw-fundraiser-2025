// app/api/teams/[slug]/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteTeam } from "@/config/teams";

export const runtime = "nodejs";

/**
 * DELETE /api/teams/[slug]
 * Deletes a team by its slug
 */
export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Team slug is required." },
        { status: 400 }
      );
    }

    const deleted = await deleteTeam(slug);

    if (!deleted) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 404 }
      );
    }

    // Revalidate the teams pages so the deleted team is removed from lists
    try {
      revalidatePath("/teams");
      revalidatePath("/teams/explore");
      revalidatePath(`/teams/${slug}`);
    } catch (revalidateError) {
      console.warn("Revalidation failed:", revalidateError);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Team deleted successfully.",
        slug,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Unable to delete team at this time." },
      { status: 500 }
    );
  }
}
