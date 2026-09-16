"use client";

import { useQuery } from "@tanstack/react-query";

import { getAnalysisOverview } from "@/lib/analysis";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { RepositoryOverview } from "@/components/repositories/repository-overview";

export default function RepositoriesPage() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["analysis", "overview"],
    queryFn: getAnalysisOverview,
  });

  const metrics = data?.metrics;

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        eyebrow="Repository"
        title="Repositories"
        description="Explore the repositories connected to your codebase intelligence workspace."
      />

      {isLoading ? (
        <PageLoader message="Loading repository..." />
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm font-medium">
            Unable to load repository analysis.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Make sure the backend and analyzer are running.
          </p>
        </div>
      ) : (
        <RepositoryOverview
          name={data?.repository.name ?? "Local Workspace"}
          language="TypeScript"
          files={metrics?.files ?? 0}
          functions={metrics?.functions ?? 0}
          qualityScore={metrics?.qualityScore ?? 0}
        />
      )}
    </div>
  );
}