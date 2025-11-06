// app/api/teams/register/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { addTeam, TeamValidationError } from "@/config/teams";

export const runtime = "nodejs";

type RegisterTeamPayload = {
  name?: unknown;
  email?: unknown;
  goal?: unknown;
};

export async function POST(request: Request) {
  let body: RegisterTeamPayload;
  try {
    body = (await request.json()) as RegisterTeamPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  const email = typeof body.email === "string" ? body.email : "";

  let goal: number | undefined;
  if (typeof body.goal !== "undefined") {
    if (typeof body.goal === "number") {
      goal = body.goal;
    } else if (typeof body.goal === "string" && body.goal.trim() !== "") {
      const parsed = Number(body.goal);
      if (Number.isFinite(parsed)) {
        goal = parsed;
      }
    }
  }

  try {
    const team = await addTeam({ name, email, goal });
    
    // ✨ Revalidate only the team list pages (new team page will be generated on first visit)
    try {
      // Revalidate the teams index and explore pages so new team appears in lists
      revalidatePath("/teams");
      revalidatePath("/teams/explore");
      // Note: Not revalidating /teams/${slug} since it doesn't exist yet
      // and will be dynamically generated on first visit
    } catch (revalidateError) {
      // Log but don't fail - page will still be accessible via dynamic route
      console.warn("Revalidation failed:", revalidateError);
    }
    
    return NextResponse.json(
      { 
        ok: true, 
        slug: team.slug, 
        redirect: `/teams/${team.slug}`,
        // Signal to client that revalidation was attempted
        revalidated: true 
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof TeamValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Unable to register team at this time." },
      { status: 500 },
    );
  }
}