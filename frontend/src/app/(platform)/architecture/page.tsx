"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

import { ArchitectureChart } from "@/components/architecture/architecture-chart";
import { ArchitectureOverview } from "@/components/architecture/architecture-overview";
import { ArchitectureStats } from "@/components/architecture/architecture-stats";
import { ArchitectureViolations } from "@/components/architecture/architecture-violations";
import { LayerDependenciesChart } from "@/components/architecture/layer-dependencies-chart";
import { LayerRelationships } from "@/components/architecture/layer-relationships";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { getAnalysisOverview } from "@/lib/analysis";

type ArchitectureViolationsProps =
  ComponentProps<typeof ArchitectureViolations>;

export default function ArchitecturePage() {
  const {
    data,
    isError,
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["analysis", "overview"],
    queryFn: getAnalysisOverview,

    // Automatically re-analyze the repository every 30 seconds.
    refetchInterval: 30000,

    // Don't repeatedly refetch just because the user changes tabs.
    refetchOnWindowFocus: false,
  });

  const [selectedLayer, setSelectedLayer] =
    useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  /*
   * Update the local "last analyzed" timestamp
   * whenever React Query receives fresh analyzer data.
   */
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const architecture =
    data?.analysis.architecture_analysis;

  const crossLayerGraph =
    data?.analysis.cross_layer_graph;

  /*
   * architecture_rules is currently exposed through
   * the flexible analysis response.
   *
   * We derive the violations type directly from the
   * ArchitectureViolations component so this page
   * stays compatible if that component's prop type changes.
   */
  const architectureRules =
    data?.analysis.architecture_rules as
      | {
          violations?: ArchitectureViolationsProps["violations"];
        }
      | undefined;

  const violations =
    architectureRules?.violations ?? [];

  /*
   * Calculate total files.
   */
  const totalFiles = useMemo(() => {
    if (!architecture) {
      return 0;
    }

    return Object.values(
      architecture.layer_counts
    ).reduce(
      (sum, count) => sum + count,
      0
    );
  }, [architecture]);

  /*
   * Determine dominant architecture layer.
   */
  const dominantLayerEntry = useMemo(() => {
    if (!architecture) {
      return undefined;
    }

    return Object.entries(
      architecture.layer_counts
    ).sort(
      (a, b) => b[1] - a[1]
    )[0];
  }, [architecture]);

  const dominantLayer =
    dominantLayerEntry?.[0] ?? "Unknown";

  const dominantLayerFiles =
    dominantLayerEntry?.[1] ?? 0;

  const dominantLayerPercentage =
    totalFiles > 0
      ? Math.round(
          (dominantLayerFiles / totalFiles) * 100
        )
      : 0;

  /*
   * Information about the currently selected layer.
   */
  const selectedLayerFiles =
    selectedLayer && architecture
      ? architecture.layer_counts[selectedLayer] ?? 0
      : 0;

  const selectedLayerPercentage =
    totalFiles > 0
      ? Math.round(
          (selectedLayerFiles / totalFiles) * 100
        )
      : 0;

  /*
   * Format the last update time.
   */
  const formattedLastUpdated =
    lastUpdated
      ? lastUpdated.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "Waiting...";

  /*
   * Loading state.
   */
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

  /*
   * Error state.
   */
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

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /*
   * No architecture data.
   */
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
            Run an analysis to generate architecture
            insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <PageHeader
        eyebrow="Understand"
        title="Architecture"
        description="Explore the architectural layers and relationships that make up your codebase."
      />

      {/* =====================================================
          LIVE ANALYSIS BAR
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          {/* Live indicator */}

          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-foreground/30" />

            <span className="relative h-2 w-2 rounded-full bg-foreground" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                Live architecture analysis
              </p>

              <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                Auto
              </span>
            </div>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Analyzer refreshes every 30 seconds
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Last updated */}

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Last analyzed
            </p>

            <p className="text-xs font-medium">
              {formattedLastUpdated}
            </p>
          </div>

          {/* Divider */}

          <div className="hidden h-8 w-px bg-border sm:block" />

          {/* Refresh */}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <motion.span
              animate={
                isFetching
                  ? {
                      rotate: 360,
                    }
                  : {
                      rotate: 0,
                    }
              }
              transition={
                isFetching
                  ? {
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }
                  : undefined
              }
              className="inline-flex"
            >
              ↻
            </motion.span>

            {isFetching
              ? "Analyzing..."
              : "Refresh analysis"}
          </button>
        </div>
      </motion.div>

      {/* =====================================================
          SELECTED LAYER INSIGHT
      ====================================================== */}

      {selectedLayer && (
        <motion.div
          initial={{
            opacity: 0,
            height: 0,
          }}
          animate={{
            opacity: 1,
            height: "auto",
          }}
          exit={{
            opacity: 0,
            height: 0,
          }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Selected layer
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  {selectedLayer}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedLayerFiles} files ·{" "}
                  {selectedLayerPercentage}% of the analyzed
                  codebase
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLayer(null)
                }
                className="self-start rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
              >
                Clear selection
              </button>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${selectedLayerPercentage}%`,
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-foreground"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
      >
        <ArchitectureStats
          totalLayers={architecture.total_layers}
          totalFiles={totalFiles}
          totalRelationships={
            crossLayerGraph?.total_relationships ?? 0
          }
          dominantLayer={dominantLayer}
          dominantLayerPercentage={
            dominantLayerPercentage
          }
        />
      </motion.div>

      {/* =====================================================
          LAYER QUICK SELECT
      ====================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.05,
        }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">
            Architecture Layers
          </h2>

          <p className="text-xs text-muted-foreground">
            Select a layer to inspect its footprint in the
            codebase.
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(
            architecture.layer_counts
          ).map(([layer, count], index) => {
            const percentage =
              totalFiles > 0
                ? Math.round(
                    (count / totalFiles) * 100
                  )
                : 0;

            const isSelected =
              selectedLayer === layer;

            return (
              <motion.button
                key={layer}
                type="button"
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.04,
                }}
                onClick={() =>
                  setSelectedLayer(
                    isSelected ? null : layer
                  )
                }
                className={`group rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? "border-foreground bg-accent"
                    : "border-border bg-background hover:border-foreground/30 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs font-medium">
                    {layer}
                  </span>

                  <span className="shrink-0 text-xs font-semibold">
                    {count}
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${percentage}%`,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.04,
                    }}
                    className={`h-full rounded-full ${
                      isSelected
                        ? "bg-foreground"
                        : "bg-muted-foreground/50"
                    }`}
                  />
                </div>

                <p className="mt-2 text-[10px] text-muted-foreground">
                  {percentage}% of files
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* =====================================================
          VISUALIZATIONS
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.1,
        }}
        className="grid gap-5 xl:grid-cols-2"
      >
        <ArchitectureChart
          layerCounts={
            architecture.layer_counts
          }
        />

        <LayerDependenciesChart
          relationships={
            crossLayerGraph?.relationships ?? []
          }
        />
      </motion.div>

      {/* =====================================================
          LAYER OVERVIEW
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.15,
        }}
      >
        <ArchitectureOverview
          totalLayers={architecture.total_layers}
          layerCounts={
            architecture.layer_counts
          }
          layers={architecture.layers}
        />
      </motion.div>

      {/* =====================================================
          RELATIONSHIPS
      ====================================================== */}

      {crossLayerGraph && (
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.2,
          }}
        >
          <LayerRelationships
            totalRelationships={
              crossLayerGraph.total_relationships
            }
            relationships={
              crossLayerGraph.relationships
            }
          />
        </motion.div>
      )}

      {/* =====================================================
          ARCHITECTURE VIOLATIONS
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.25,
        }}
      >
        <ArchitectureViolations
          violations={violations}
        />
      </motion.div>

      {/* =====================================================
          ANALYZER STATUS
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 0.5,
          delay: 0.3,
        }}
        className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/30" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground" />
          </span>

          <span className="text-[11px] text-muted-foreground">
            Analyzer connected
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {isFetching
            ? "Updating architecture intelligence..."
            : "Architecture data is up to date"}
        </p>
      </motion.div>
    </div>
  );
}