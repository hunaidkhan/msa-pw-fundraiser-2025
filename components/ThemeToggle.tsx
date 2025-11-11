"use client";

import { useTheme } from "@/components/ThemeProvider";

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" strokeLinecap="round" />
      <path d="M12 20v2" strokeLinecap="round" />
      <path d="M4.93 4.93l1.41 1.41" strokeLinecap="round" />
      <path d="M17.66 17.66l1.41 1.41" strokeLinecap="round" />
      <path d="M2 12h2" strokeLinecap="round" />
      <path d="M20 12h2" strokeLinecap="round" />
      <path d="M4.93 19.07l1.41-1.41" strokeLinecap="round" />
      <path d="M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        d="M21 12.79A9 9 0 0 1 12.21 3 7 7 0 1 0 21 12.79z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:text-white"
      aria-label={label}
    >
      {isDark ? (
        <SunIcon className="h-4 w-4" aria-hidden />
      ) : (
        <MoonIcon className="h-4 w-4" aria-hidden />
      )}
      <span>{isDark ? "Light" : "Dark"} mode</span>
    </button>
  );
}
