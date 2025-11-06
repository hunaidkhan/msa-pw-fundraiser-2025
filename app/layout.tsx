import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LazyMotion, domAnimation } from "framer-motion";
import { Toaster } from "sonner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-[#007a3d] via-white to-[#ce1126] text-slate-900`}
      >
        <div className="relative min-h-screen">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.25),_transparent_55%)] mix-blend-multiply" />
          <LazyMotion features={domAnimation} strict>
            <div className="relative z-10 flex min-h-screen flex-col bg-white/80 backdrop-blur-sm">
              {children}
            </div>
          </LazyMotion>
        </div>
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
