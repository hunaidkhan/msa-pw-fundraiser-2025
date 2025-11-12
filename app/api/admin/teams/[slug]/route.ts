// app/api/admin/teams/[slug]/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteTeam } from "@/config/teams";

export const runtime = "nodejs";

/**
 * Verifies the admin API key from request headers
 */
function verifyAdminAuth(request: Request): boolean {
  const adminApiKey = process.env.ADMIN_API_KEY;

  // If no admin key is configured, deny all delete requests for security
  if (!adminApiKey) {
    console.error("ADMIN_API_KEY not configured in environment variables");
    return false;
  }

  const authHeader = request.headers.get("x-admin-api-key");
  return authHeader === adminApiKey;
}

/**
 * DELETE /api/admin/teams/[slug]
 * Deletes a team by its slug (Admin only)
 *
 * Requires: x-admin-api-key header matching ADMIN_API_KEY env variable
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "Unauthorized. Valid admin API key required." },
        { status: 401 }
      );
    }

    const { slug } = await params;

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
