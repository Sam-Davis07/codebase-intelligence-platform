"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CircleOff,
  GitBranch,
  Package,
  Unplug,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { getDependencyOverview } from "@/lib/analysis";
import { DependencyGraph } from "@/components/dependencies/dependency-graph";

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function FileName({ file }: { file: string }) {
  const normalized = file.replaceAll("\\", "/");

  const parts = normalized.split("/");

  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-medium">
        {parts.at(-1)}
      </p>

      <p className="truncate text-[10px] text-muted-foreground">
        {parts.slice(-3, -1).join("/")}
      </p>
    </div>
  );
}

export default function DependenciesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dependencies", "overview"],
    queryFn: getDependencyOverview,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <PageHeader
          eyebrow="Understand"
          title="Dependencies"
          description="Explore how files and modules depend on each other across your codebase."
        />

        <PageLoader message="Analyzing dependencies..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-8 p-6">
        <PageHeader
          eyebrow="Understand"
          title="Dependencies"
          description="Explore how files and modules depend on each other across your codebase."
        />

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm font-medium">
            Unable to load dependency analysis.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Make sure the backend and analyzer are running.
          </p>
        </div>
      </div>
    );
  }

  const { summary, most_depended_on, most_dependent_on } =
    data.dependency_analysis;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Understand"
        title="Dependencies"
        description="Explore how files and modules depend on each other across your codebase."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Files"
          value={summary.total_files}
          description={`${summary.connected_percentage}% connected`}
          icon={GitBranch}
        />

        <StatCard
          label="Internal Dependencies"
          value={summary.internal_dependencies}
          description="File-to-file relationships"
          icon={ArrowDownRight}
        />

        <StatCard
          label="External Packages"
          value={summary.external_packages}
          description={`${summary.external_dependencies} imports detected`}
          icon={Package}
        />

        <StatCard
          label="Circular Dependencies"
          value={summary.circular_dependencies}
          description={
            summary.circular_dependencies === 0
              ? "No cycles detected"
              : "Cycles require attention"
          }
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-muted-foreground" />

                <h2 className="text-sm font-semibold">
                  Most Depended On
                </h2>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Files with the highest number of incoming dependencies.
              </p>
            </div>

            <span className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium">
              Fan-in
            </span>
          </div>

          <div className="mt-5 space-y-2">
            {most_depended_on.slice(0, 8).map((item) => (
              <div
                key={item.file}
                className="flex items-center justify-between gap-4 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-accent/40"
              >
                <FileName file={item.file} />

                <div className="flex shrink-0 items-center gap-4 text-right">
                  <div>
                    <p className="text-xs font-semibold">
                      {item.fan_in}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      dependents
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium">
                      {item.fan_out}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      outgoing
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {most_depended_on.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No dependency hotspots detected.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />

                <h2 className="text-sm font-semibold">
                  Most Dependent Files
                </h2>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Files that import the largest number of modules.
              </p>
            </div>

            <span className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium">
              Fan-out
            </span>
          </div>

          <div className="mt-5 space-y-2">
            {most_dependent_on.slice(0, 8).map((item) => (
              <div
                key={item.file}
                className="flex items-center justify-between gap-4 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-accent/40"
              >
                <FileName file={item.file} />

                <div className="flex shrink-0 items-center gap-4 text-right">
                  <div>
                    <p className="text-xs font-semibold">
                      {item.fan_out}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      dependencies
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium">
                      {item.fan_in}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      incoming
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {most_dependent_on.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No dependent files detected.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CircleOff className="h-4 w-4 text-muted-foreground" />

              <h2 className="text-sm font-semibold">
                Isolated Files
              </h2>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Files with no internal incoming or outgoing dependencies.
            </p>
          </div>

          <span className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium">
            {summary.isolated_files} files
          </span>
        </div>

        {data.dependency_analysis.isolated_files.length > 0 ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.dependency_analysis.isolated_files.map(
              (file) => (
                <div
                  key={file}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5"
                >
                  <Unplug className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                  <FileName file={file} />
                </div>
              )
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No isolated files detected.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
  <div className="flex items-start justify-between gap-4">
    <div>
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-muted-foreground" />

        <div>
          <h2 className="text-sm font-semibold">
            Dependency Graph
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Explore how files and modules connect across the codebase.
          </p>
        </div>
      </div>
    </div>

    <div className="rounded-md border border-border px-2.5 py-1.5">
      <span className="text-xs font-medium">
        {data.graph.nodes.length} nodes ·{" "}
        {data.graph.edges.length} relationships
      </span>
    </div>
  </div>

  <div className="mt-5">
    <DependencyGraph
      nodes={data.graph.nodes}
      edges={data.graph.edges}
      files={data.dependency_analysis.files}
    />
  </div>
</section>
    </div>
  );
}