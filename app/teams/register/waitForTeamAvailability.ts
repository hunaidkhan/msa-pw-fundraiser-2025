const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_DELAY_MS = 1500;

function normalizeRoute(target: string): string {
  if (!target) {
    return "/teams";
  }

  if (target.startsWith("http://") || target.startsWith("https://")) {
    return target;
  }

  if (target.startsWith("/")) {
    return target;
  }

  return `/teams/${target}`;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForTeamAvailability(
  route: string,
  {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    delayMs = DEFAULT_DELAY_MS,
  }: { maxAttempts?: number; delayMs?: number } = {},
): Promise<boolean> {
  const target = normalizeRoute(route);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(target, {
        method: "HEAD",
        cache: "no-store",
      });

      if (response.ok) {
        return true;
      }
    } catch {
      // Ignore network errors and continue polling until attempts are exhausted.
    }

    if (attempt < maxAttempts - 1) {
      await delay(delayMs);
    }
  }

  return false;
}
