import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReAct Notion Planner",
  description: "AI-powered planning assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
