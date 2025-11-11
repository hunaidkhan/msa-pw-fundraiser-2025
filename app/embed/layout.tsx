import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Fundraiser Leaderboard Embed",
  description: "Embeddable leaderboard widget for fundraising teams",
};

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
