import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LazyMotion, domAnimation } from "framer-motion";
import Script from "next/script";

import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeScript = `(() => {
  const storageKey = "theme";
  try {
    const stored = window.localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  } catch {
    /* no-op */
  }
})();`;

export const metadata: Metadata = {
  title: "MSA Palestine Winter Fundraiser 2025",
  description:
    "Support humanitarian relief and community programming through the MSA's Palestine Winter Fundraiser.",
  openGraph: {
    title: "MSA Palestine Winter Fundraiser 2025",
    description:
      "Join us to provide urgent relief and amplify Palestinian voices this winter.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gradient-to-b from-[#007a3d] via-white to-[#ce1126] text-slate-900 antialiased transition-colors duration-300 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-zinc-100`}
      >
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>
          <div className="relative min-h-screen">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.25),_transparent_55%)] mix-blend-multiply dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_65%)]" />
            <LazyMotion features={domAnimation} strict>
              <div className="relative z-10 flex min-h-screen flex-col bg-white/80 backdrop-blur-sm transition dark:bg-zinc-900/80 dark:text-zinc-100">
                {children}
              </div>
            </LazyMotion>
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
