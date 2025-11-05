import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

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
    revalidateTag("teams");
    revalidatePath("/teams");
    revalidatePath(`/teams/${team.slug}`);
    return NextResponse.json(
      { ok: true, slug: team.slug, redirect: `/teams/${team.slug}` },
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

