import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export type Team = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  fundraisingGoal?: number;
  fundraisingRaised?: number;
  contactEmail?: string;
};

export type AddTeamInput = {
  name: string;
  email: string;
  goal?: number;
};

export class TeamValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeamValidationError";
  }
}

const DEFAULT_LOGO_URL = "/logos/falcon.svg";
const DEFAULT_DESCRIPTION =
  "This community-led team is rallying supporters to fund urgent Palestinian relief.";

const BASE_TEAMS: Team[] = [
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

const TEAMS_DB_PATH =
  process.env.TEAMS_DB_PATH ?? path.join(process.cwd(), "data", "teams.dynamic.json");

export function ensureDirExists(filePath: string): void {
  const directory = path.dirname(filePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

export function loadDynamicTeams(): Team[] {
  if (!existsSync(TEAMS_DB_PATH)) {
    return [];
  }

  try {
    const raw = readFileSync(TEAMS_DB_PATH, "utf8");
    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => sanitizeTeam(entry))
      .filter((team): team is Team => Boolean(team));
  } catch (error) {
    console.error("Failed to load dynamic teams", error);
    return [];
  }
}

function sanitizeTeam(value: unknown): Team | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const slug = typeof record.slug === "string" ? record.slug : undefined;
  const name = typeof record.name === "string" ? record.name : undefined;

  if (!slug || !name) {
    return undefined;
  }

  const team: Team = {
    id: typeof record.id === "string" ? record.id : slug,
    slug,
    name,
  };

  if (typeof record.description === "string") {
    team.description = record.description;
  }
  if (typeof record.logoUrl === "string") {
    team.logoUrl = record.logoUrl;
  }
  if (typeof record.fundraisingGoal === "number" && Number.isFinite(record.fundraisingGoal)) {
    team.fundraisingGoal = record.fundraisingGoal;
  }
  if (
    typeof record.fundraisingRaised === "number" &&
    Number.isFinite(record.fundraisingRaised)
  ) {
    team.fundraisingRaised = record.fundraisingRaised;
  }
  if (typeof record.contactEmail === "string") {
    team.contactEmail = record.contactEmail;
  }

  return team;
}

export function saveDynamicTeams(teams: Team[]): void {
  ensureDirExists(TEAMS_DB_PATH);
  const payload = JSON.stringify(teams, null, 2);
  writeFileSync(TEAMS_DB_PATH, `${payload}\n`, "utf8");
}

export function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  let slug = normalized.replace(/[^a-z0-9]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  if (slug.length > 60) {
    slug = slug.slice(0, 60).replace(/-+$/g, "");
  }

  return slug;
}

export function slugifyUnique(base: string, existing: Set<string>): string {
  const baseSlug = (base || "team").replace(/^-+|-+$/g, "") || "team";
  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (true) {
    const suffix = `-${counter}`;
    const limit = Math.max(1, 60 - suffix.length);
    const trimmedBase = baseSlug.slice(0, limit).replace(/-+$/g, "") || "team";
    const candidate = `${trimmedBase}${suffix}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
    counter += 1;
  }
}

export function teamNameExists(name: string, teams: Team[]): boolean {
  const target = name.trim().toLowerCase();
  return teams.some((team) => team.name.trim().toLowerCase() === target);
}

export function getAllTeams(): Team[] {
  const dynamicTeams = loadDynamicTeams();
  const merged = new Map<string, Team>();

  for (const team of BASE_TEAMS) {
    merged.set(team.slug, team);
  }

  for (const team of dynamicTeams) {
    if (!merged.has(team.slug)) {
      merged.set(team.slug, team);
    }
  }

  return Array.from(merged.values());
}

export function getTeamBySlug(slug: string): Team | undefined {
  return getAllTeams().find((team) => team.slug === slug);
}

export function getTeamById(id: string): Team | undefined {
  return getAllTeams().find((team) => team.id === id);
}

export function addTeam(input: AddTeamInput): Team {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    throw new TeamValidationError("Team name is required.");
  }
  if (name.length > 80) {
    throw new TeamValidationError("Team name must be 80 characters or fewer.");
  }

  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!email) {
    throw new TeamValidationError("A contact email is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new TeamValidationError("Enter a valid contact email address.");
  }

  let goal: number | undefined;
  if (typeof input.goal !== "undefined") {
    if (!Number.isInteger(input.goal) || input.goal < 0) {
      throw new TeamValidationError("Fundraising goal must be an integer greater than or equal to 0.");
    }
    goal = input.goal;
  }

  const existingTeams = getAllTeams();
  if (teamNameExists(name, existingTeams)) {
    throw new TeamValidationError("A team with this name already exists.");
  }

  const existingSlugs = new Set(existingTeams.map((team) => team.slug));
  const baseSlug = slugify(name);
  const uniqueSlug = slugifyUnique(baseSlug, existingSlugs);

  const newTeam: Team = {
    id: uniqueSlug,
    slug: uniqueSlug,
    name,
    description: DEFAULT_DESCRIPTION,
    logoUrl: DEFAULT_LOGO_URL,
    fundraisingGoal: goal,
    fundraisingRaised: 0,
    contactEmail: email,
  };

  const dynamicTeams = loadDynamicTeams();
  dynamicTeams.push(newTeam);
  saveDynamicTeams(dynamicTeams);

  return newTeam;
}

