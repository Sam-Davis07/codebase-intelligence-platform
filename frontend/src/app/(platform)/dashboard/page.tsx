"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalysisOverview } from "@/lib/analysis";

const stats = [
  {
    key: "files",
    label: "Files",
  },
  {
    key: "functions",
    label: "Functions",
  },
  {
    key: "qualityScore",
    label: "Quality Score",
  },
  {
    key: "codeSmells",
    label: "Code Smells",
  },
] as const;

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analysis", "overview"],
    queryFn: getAnalysisOverview,
  });

  const metrics = data?.metrics;

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">
            REPOSITORY
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Codebase Overview
          </h1>

          <p className="mt-1 text-muted-foreground">
            Understand the structure and health of your repository.
          </p>
        </div>

        {isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm font-medium">
              Unable to load analysis
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Make sure the backend and analyzer services are running.
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="rounded-xl border bg-card p-5"
            >
              <p className="text-sm text-muted-foreground">
                {stat.label}
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {isLoading ? "—" : metrics?.[stat.key] ?? 0}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold">
              Architecture
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Explore how the repository is organized into
              architectural layers.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold">
              Dependency Graph
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Understand how files depend on each other.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}