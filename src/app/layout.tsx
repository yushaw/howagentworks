import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HowAgent.works — Agents explained in motion",
  description:
    "A bilingual, always-on explainer for modern AI agent principles, pipelines, and live industry updates.",
  keywords: [
    "AI agents",
    "agentic workflows",
    "perception planning action",
    "agent news",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[color:var(--color-background)] text-[color:var(--color-foreground)]`}
      >
        {children}
      </body>
    </html>
  );
}
