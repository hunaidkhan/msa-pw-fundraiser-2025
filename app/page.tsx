import TeamsPage, { metadata as teamsMetadata } from "./teams/page";

export const metadata = teamsMetadata;
export const revalidate = 60;
export const runtime = "nodejs";

export default TeamsPage;
