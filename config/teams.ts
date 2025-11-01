export type Team = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  fundraisingGoal?: number;
  fundraisingRaised?: number;
};

const TEAMS: Team[] = [
  {
    id: "team-falcon",
    slug: "team-falcon",
    name: "Team Falcon",
    description:
      "Supporting urgent relief and sustainable community programs across Palestine.",
    logoUrl: "/logos/falcon.svg",
    fundraisingGoal: 50000,
    fundraisingRaised: 23500,
  },
  {
    id: "team-phoenix",
    slug: "team-phoenix",
    name: "Team Phoenix",
    description:
      "Rallying global allies to fund medical aid and trauma counseling for families.",
    logoUrl: "/logos/phoenix.svg",
    fundraisingGoal: 65000,
    fundraisingRaised: 41200,
  },
  {
    id: "team-lion",
    slug: "team-lion",
    name: "Team Lion",
    description:
      "Investing in youth empowerment, education, and rebuilding initiatives in Gaza.",
    logoUrl: "/logos/lion.svg",
    fundraisingGoal: 80000,
    fundraisingRaised: 58950,
  },
];

export const getAllTeams = (): Team[] => TEAMS;

export const getTeamBySlug = (slug: string): Team | undefined =>
  TEAMS.find((team) => team.slug === slug);

export const getTeamById = (id: string): Team | undefined =>
  TEAMS.find((team) => team.id === id);
