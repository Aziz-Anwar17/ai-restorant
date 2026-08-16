import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dapur AI — 1 long video, 10 viral clips",
  description:
    "Dapur AI turns long videos into shorts, and publishes them to all social platforms in one click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-ink-950 font-sans text-zinc-300 antialiased">
        {children}
      </body>
    </html>
  );
}
