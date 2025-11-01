export type TeamConfig = {
  id: string;
  name: string;
};

export const TEAMS: TeamConfig[] = [
  { id: "msa-uofa", name: "MSA UofA" },
  { id: "youth", name: "Youth Team" },
  { id: "volunteers", name: "Volunteers" },
  { id: "team-falcon", name: "Team Falcon" },
];

export function getTeamById(id: string) {
  return TEAMS.find((team) => team.id === id);
}

export function listTeams() {
  return [...TEAMS];
}
