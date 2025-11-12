import { list, put } from "@vercel/blob";
import { cache } from "react";

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

// Base teams commented out as requested
// const BASE_TEAMS: Team[] = [
//   {
//     id: "team-falcon",
//     slug: "team-falcon",
//     name: "Team Falcon",
//     description:
//       "Supporting urgent relief and sustainable community programs across Palestine.",
//     logoUrl: "/logos/falcon.svg",
//     fundraisingGoal: 50000,
//     fundraisingRaised: 23500,
//   },
//   {
//     id: "team-phoenix",
//     slug: "team-phoenix",
//     name: "Team Phoenix",
//     description:
//       "Rallying global allies to fund medical aid and trauma counseling for families.",
//     logoUrl: "/logos/phoenix.svg",
//     fundraisingGoal: 65000,
//     fundraisingRaised: 41200,
//   },
//   {
//     id: "team-lion",
//     slug: "team-lion",
//     name: "Team Lion",
//     description:
//       "Investing in youth empowerment, education, and rebuilding initiatives in Gaza.",
//     logoUrl: "/logos/lion.svg",
//     fundraisingGoal: 80000,
//     fundraisingRaised: 58950,
//   },
// ];
const BASE_TEAMS: Team[] = [];

const FILE_NAME = "teams.json"; // deterministic blob key

// In-memory cache for the teams blob URL
// Once set from put(), this URL is permanent (deterministic blob key)
let cachedTeamsUrl: string | null = null;

/**
 * Gets the teams blob URL, with in-memory caching to eliminate list() calls.
 * URL is captured from put() operations and cached permanently.
 * Only falls back to list() if URL not yet cached (first read before any write).
 * Wrapped with React cache() for request-level deduplication.
 */
const getTeamsUrl = cache(async (): Promise<string | null> => {
  // Return cached URL if available (no TTL needed - blob key is deterministic)
  if (cachedTeamsUrl) {
    return cachedTeamsUrl;
  }

  try {
    // Fallback: list to get the URL (only on first read before any write)
    const { blobs } = await list({ prefix: FILE_NAME, limit: 1 });

    if (!blobs.length) {
      return null;
    }

    // Cache the URL permanently
    cachedTeamsUrl = blobs[0].url;
    return cachedTeamsUrl;
  } catch (error) {
    console.error("Error listing teams blob:", error);
    return null;
  }
});

/**
 * Sets the cached teams URL from a write operation.
 */
function setCachedTeamsUrl(url: string): void {
  cachedTeamsUrl = url;
}

export async function loadDynamicTeams(): Promise<Team[]> {
  try {
    const url = await getTeamsUrl();

    if (!url) {
      return [];
    }

    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) {
      return [];
    }

    const json = await response.json().catch(() => []);
    if (!Array.isArray(json)) {
      return [];
    }

    return json
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

export async function saveDynamicTeams(teams: Team[]): Promise<void> {
  const blob = await put(FILE_NAME, JSON.stringify(teams, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite:true,
    contentType: "application/json",
    cacheControlMaxAge: 0
  });

  // Cache the blob URL from the write operation (eliminates future list() calls)
  setCachedTeamsUrl(blob.url);
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

export async function getAllTeams(): Promise<Team[]> {
  // Now only returns dynamic teams (BASE_TEAMS is empty)
  return await loadDynamicTeams();
}

export async function getTeamBySlug(slug: string): Promise<Team | undefined> {
  const allTeams = await getAllTeams();
  return allTeams.find((team) => team.slug === slug);
}

export async function getTeamById(id: string): Promise<Team | undefined> {
  const allTeams = await getAllTeams();
  return allTeams.find((team) => team.id === id);
}

export async function addTeam(input: AddTeamInput): Promise<Team> {
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

  // Load all existing teams
  const allTeams = await loadDynamicTeams();

  // Check for duplicate name
  if (teamNameExists(name, allTeams)) {
    throw new TeamValidationError("A team with this name already exists.");
  }

  // Generate unique slug
  const existingSlugs = new Set(allTeams.map((team) => team.slug));
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

  // Add new team to existing teams and save
  allTeams.push(newTeam);
  await saveDynamicTeams(allTeams);

  return newTeam;
}

/**
 * Deletes a team by its slug
 * Returns true if the team was found and deleted, false if not found
 */
export async function deleteTeam(slug: string): Promise<boolean> {
  const allTeams = await loadDynamicTeams();
  const initialLength = allTeams.length;

  const filteredTeams = allTeams.filter((team) => team.slug !== slug);

  // If no team was removed, return false
  if (filteredTeams.length === initialLength) {
    return false;
  }

  await saveDynamicTeams(filteredTeams);
  return true;
}

/**
 * Deletes all teams
 */
export async function deleteAllTeams(): Promise<void> {
  await saveDynamicTeams([]);
}

