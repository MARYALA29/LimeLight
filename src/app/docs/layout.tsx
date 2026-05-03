import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs · LimeLight",
  description:
    "Interactive OpenAPI 3.1 documentation for the LimeLight REST API.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
