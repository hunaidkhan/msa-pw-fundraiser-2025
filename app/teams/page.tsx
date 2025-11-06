import type { Metadata } from "next";

import { getAllTeams } from "@/config/teams";
import { TeamsPageShell } from "./TeamsPageShell";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Meet Our Teams | Palestine Solidarity Fundraiser",
  description:
    "Discover the teams championing relief, resilience, and hope for communities across Palestine.",
};

const TeamsPage = async () => {
  const teams = await getAllTeams();

  return <TeamsPageShell teams={teams} />;
};

export default TeamsPage;
