import type { Metadata } from "next";
import NewsPage from "./page.client";

const pageTitle = "Agent News Archive — HowAgent.works";
const pageDescription =
  "Browse the full bilingual feed of agent launches, benchmarks, and policy updates curated by HowAgent.works.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
  alternates: {
    canonical: "/news",
  },
};

export default function NewsRoute() {
  return <NewsPage />;
}
