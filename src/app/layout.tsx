import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { PreferencesProvider } from "@/components/PreferencesProvider";
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

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-DS4YSLBP4W";
const isProd = process.env.NODE_ENV === "production";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {isProd && GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[color:var(--color-background)] text-[color:var(--color-foreground)]`}
      >
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
