export type TeamConfig = {
  id: string;
  name: string;
};

const TEAM_DEFINITIONS: TeamConfig[] = [];

export function getTeamById(id: string) {
  return TEAM_DEFINITIONS.find((team) => team.id === id);
}

export function listTeams() {
  return [...TEAM_DEFINITIONS];
}
