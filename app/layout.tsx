import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "AI Restorant — 1 long video, 10 viral clips",
  description:
    "AI Restorant turns long videos into shorts, and publishes them to all social platforms in one click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-ink-950 font-sans text-zinc-300 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
