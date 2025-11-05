import type { Metadata } from "next";
import ReactAgentPageClient from "./page.client";

export const metadata: Metadata = {
  title: "ReactAgent Lifecycle | How Agent Works",
  description:
    "Deep dive into the complete lifecycle of ReactAgent, from startup to execution. Learn about core mechanisms, tool implementations, and architectural highlights.",
  openGraph: {
    title: "ReactAgent Complete Lifecycle",
    description:
      "Detailed documentation of ReactAgent lifecycle including initialization, execution loop, core mechanisms, and tool implementations.",
    type: "article",
  },
};

export default function ReactAgentPage() {
  return <ReactAgentPageClient />;
}
