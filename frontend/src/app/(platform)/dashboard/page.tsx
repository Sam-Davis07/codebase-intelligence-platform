"use client";

import {
  Bug,
  FileCode2,
  FunctionSquare,
  Gauge,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getAnalysisOverview } from "@/lib/analysis";
import { MetricCard } from "@/components/dashboard/metric-card";
import { HealthCard } from "@/components/dashboard/health-card";
import { PageLoader } from "@/components/ui/page-loader";

export default function DashboardPage() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["analysis", "overview"],
    queryFn: getAnalysisOverview,
  });

  const metrics = data?.metrics;

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Header */}
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

        {/* Loading State */}
        {isLoading ? (
          <PageLoader message="Analyzing codebase..." />
        ) : isError ? (
          /* Error State */
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm font-medium">
              Unable to load analysis
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Make sure the backend and analyzer services are running.
            </p>
          </div>
        ) : (
          /* Loaded Content */
          <>
            {/* Repository Metrics */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Files"
                value={metrics?.files ?? 0}
                icon={FileCode2}
                description="Source files analyzed"
                index={0}
              />

              <MetricCard
                label="Functions"
                value={metrics?.functions ?? 0}
                icon={FunctionSquare}
                description="Functions and methods detected"
                index={1}
              />

              <MetricCard
                label="Quality Score"
                value={metrics?.qualityScore ?? 0}
                icon={Gauge}
                description="Overall codebase health"
                index={2}
              />

              <MetricCard
                label="Code Smells"
                value={metrics?.codeSmells ?? 0}
                icon={Bug}
                description="Detected maintainability issues"
                index={3}
              />
            </section>

            {/* Codebase Health */}
            <section>
              <HealthCard
                overallScore={
                  data?.analysis.quality_score?.overall_score ?? 0
                }
                components={
                  data?.analysis.quality_score?.components ?? {
                    complexity: 0,
                    code_smells: 0,
                    maintainability: 0,
                    architecture: 0,
                  }
                }
              />
            </section>

            {/* Intelligence Sections */}
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
          </>
        )}
      </div>
    </main>
  );
}