"use client";

import { useQuery } from "@tanstack/react-query";

import { ArchitectureChart } from "@/components/architecture/architecture-chart";
import { ArchitectureOverview } from "@/components/architecture/architecture-overview";
import { ArchitectureStats } from "@/components/architecture/architecture-stats";
import { LayerDependenciesChart } from "@/components/architecture/layer-dependencies-chart";
import { LayerRelationships } from "@/components/architecture/layer-relationships";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { getAnalysisOverview } from "@/lib/analysis";

export default function ArchitecturePage() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["analysis", "overview"],
    queryFn: getAnalysisOverview,
  });

  const architecture = data?.analysis.architecture_analysis;
  const crossLayerGraph = data?.analysis.cross_layer_graph;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          eyebrow="Understand"
          title="Architecture"
          description="Explore the architectural layers and relationships that make up your codebase."
        />

        <PageLoader message="Analyzing architecture..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          eyebrow="Understand"
          title="Architecture"
          description="Explore the architectural layers and relationships that make up your codebase."
        />

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm font-medium">
            Unable to load architecture analysis.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Make sure the backend and analyzer are running.
          </p>
        </div>
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          eyebrow="Understand"
          title="Architecture"
          description="Explore the architectural layers and relationships that make up your codebase."
        />

        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm font-medium">
            No architecture analysis available.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Run an analysis to generate architecture insights.
          </p>
        </div>
      </div>
    );
  }

  const totalFiles = Object.values(
    architecture.layer_counts
  ).reduce((sum, count) => sum + count, 0);

  const dominantLayerEntry = Object.entries(
    architecture.layer_counts
  ).sort((a, b) => b[1] - a[1])[0];

  const dominantLayer = dominantLayerEntry?.[0] ?? "Unknown";
  const dominantLayerFiles = dominantLayerEntry?.[1] ?? 0;

  const dominantLayerPercentage =
    totalFiles > 0
      ? Math.round((dominantLayerFiles / totalFiles) * 100)
      : 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Understand"
        title="Architecture"
        description="Explore the architectural layers and relationships that make up your codebase."
      />

      {/* Summary */}
      <ArchitectureStats
        totalLayers={architecture.total_layers}
        totalFiles={totalFiles}
        totalRelationships={
          crossLayerGraph?.total_relationships ?? 0
        }
        dominantLayer={dominantLayer}
        dominantLayerPercentage={dominantLayerPercentage}
      />

      {/* Visualizations */}
      <div className="grid gap-5 xl:grid-cols-2">
        <ArchitectureChart
          layerCounts={architecture.layer_counts}
        />

        <LayerDependenciesChart
          relationships={
            crossLayerGraph?.relationships ?? []
          }
        />
      </div>

      {/* Layer Overview */}
      <ArchitectureOverview
        totalLayers={architecture.total_layers}
        layerCounts={architecture.layer_counts}
        layers={architecture.layers}
      />

      {/* Detailed Relationships */}
      {crossLayerGraph && (
        <LayerRelationships
          totalRelationships={
            crossLayerGraph.total_relationships
          }
          relationships={crossLayerGraph.relationships}
        />
      )}
    </div>
  );
}