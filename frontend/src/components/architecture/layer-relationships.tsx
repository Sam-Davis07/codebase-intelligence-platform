"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Layers3,
  Search,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RelationshipFile {
  source: string;
  target: string;
}

export interface LayerRelationship {
  source_layer: string;
  target_layer: string;
  dependency_count: number;
  files: RelationshipFile[];
}

interface LayerRelationshipsProps {
  totalRelationships: number;
  relationships: LayerRelationship[];
}

export function LayerRelationships({
  totalRelationships,
  relationships,
}: LayerRelationshipsProps) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] =
    useState("all");
  const [targetFilter, setTargetFilter] =
    useState("all");

  const [selectedRelationship, setSelectedRelationship] =
    useState<string | null>(null);

  const [expandedRelationship, setExpandedRelationship] =
    useState<string | null>(null);

  const sourceLayers = useMemo(() => {
    return Array.from(
      new Set(
        relationships.map(
          (relationship) =>
            relationship.source_layer
        )
      )
    ).sort();
  }, [relationships]);

  const targetLayers = useMemo(() => {
    return Array.from(
      new Set(
        relationships.map(
          (relationship) =>
            relationship.target_layer
        )
      )
    ).sort();
  }, [relationships]);

  const filteredRelationships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return relationships.filter((relationship) => {
      const matchesSource =
        sourceFilter === "all" ||
        relationship.source_layer === sourceFilter;

      const matchesTarget =
        targetFilter === "all" ||
        relationship.target_layer === targetFilter;

      const matchesSearch =
        !query ||
        relationship.source_layer
          .toLowerCase()
          .includes(query) ||
        relationship.target_layer
          .toLowerCase()
          .includes(query) ||
        relationship.files.some(
          (file) =>
            file.source
              .toLowerCase()
              .includes(query) ||
            file.target
              .toLowerCase()
              .includes(query)
        );

      return (
        matchesSource &&
        matchesTarget &&
        matchesSearch
      );
    });
  }, [
    relationships,
    search,
    sourceFilter,
    targetFilter,
  ]);

  const selected = useMemo(() => {
    if (!selectedRelationship) {
      return null;
    }

    return (
      relationships.find(
        (relationship) =>
          getRelationshipKey(relationship) ===
          selectedRelationship
      ) ?? null
    );
  }, [
    relationships,
    selectedRelationship,
  ]);

  const clearFilters = () => {
    setSearch("");
    setSourceFilter("all");
    setTargetFilter("all");
  };

  const hasFilters =
    search.trim().length > 0 ||
    sourceFilter !== "all" ||
    targetFilter !== "all";

  return (
    <section className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <GitBranch className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Layer Relationships
                </h2>

                <p className="text-xs text-muted-foreground">
                  Cross-layer dependency relationships detected
                  by the analyzer.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                Relationships
              </p>

              <p className="mt-0.5 text-sm font-semibold">
                {totalRelationships}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                Showing
              </p>

              <p className="mt-0.5 text-sm font-semibold">
                {filteredRelationships.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-col gap-2 xl:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search layers or files..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <select
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(event.target.value)
            }
            className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-foreground/40"
            aria-label="Filter source layer"
          >
            <option value="all">
              All source layers
            </option>

            {sourceLayers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>

          <select
            value={targetFilter}
            onChange={(event) =>
              setTargetFilter(event.target.value)
            }
            className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-foreground/40"
            aria-label="Filter target layer"
          >
            <option value="all">
              All target layers
            </option>

            {targetLayers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Selected relationship */}
      <AnimatePresence initial={false}>
        {selected && (
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
            className="overflow-hidden border-b border-border"
          >
            <div className="bg-muted/30 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Selected relationship
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium">
                      {selected.source_layer}
                    </span>

                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

                    <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium">
                      {selected.target_layer}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {selected.dependency_count} dependency
                    {selected.dependency_count === 1
                      ? ""
                      : " relationships"}{" "}
                    across {selected.files.length} file
                    {selected.files.length === 1
                      ? ""
                      : "s"}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedRelationship(null)
                  }
                  className="inline-flex h-8 items-center justify-center gap-2 self-start rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-accent"
                >
                  <X className="h-3 w-3" />
                  Close
                </button>
              </div>

              {selected.files.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-background">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-medium">
                      Affected files
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {selected.files.map(
                      (file, index) => (
                        <div
                          key={`${file.source}-${file.target}-${index}`}
                          className="grid gap-2 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[1fr_auto_1fr] md:items-center"
                        >
                          <p
                            className="truncate font-mono text-[10px] text-muted-foreground"
                            title={file.source}
                          >
                            {file.source}
                          </p>

                          <ArrowRight className="hidden h-3 w-3 text-muted-foreground md:block" />

                          <p
                            className="truncate font-mono text-[10px] text-foreground/80"
                            title={file.target}
                          >
                            {file.target}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship list */}
      <div className="p-5">
        {filteredRelationships.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <Layers3 className="mx-auto h-5 w-5 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">
              No relationships found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try changing the filters or search query.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRelationships.map(
              (relationship, index) => {
                const key =
                  getRelationshipKey(
                    relationship
                  );

                const isSelected =
                  selectedRelationship === key;

                const isExpanded =
                  expandedRelationship === key;

                return (
                  <motion.div
                    key={key}
                    initial={{
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(
                        index * 0.025,
                        0.25
                      ),
                    }}
                    className={`overflow-hidden rounded-lg border transition-colors ${
                      isSelected
                        ? "border-foreground/40 bg-accent/40"
                        : "border-border bg-background hover:bg-accent/30"
                    }`}
                  >
                    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedRelationship(
                            isSelected ? null : key
                          )
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium">
                            {
                              relationship.source_layer
                            }
                          </span>

                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />

                          <span className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium">
                            {
                              relationship.target_layer
                            }
                          </span>
                        </div>

                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {relationship.files.length} affected
                          file
                          {relationship.files.length ===
                          1
                            ? ""
                            : "s"}
                        </p>
                      </button>

                      <div className="flex items-center gap-2">
                        <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-right">
                          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Dependencies
                          </p>

                          <p className="text-xs font-semibold">
                            {
                              relationship.dependency_count
                            }
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRelationship(
                              isExpanded
                                ? null
                                : key
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent"
                          aria-label={
                            isExpanded
                              ? "Collapse files"
                              : "Expand files"
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
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
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="bg-muted/20 p-4">
                            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              File relationships
                            </p>

                            <div className="space-y-1.5">
                              {relationship.files.map(
                                (
                                  file,
                                  fileIndex
                                ) => (
                                  <div
                                    key={`${file.source}-${file.target}-${fileIndex}`}
                                    className="grid gap-2 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_auto_1fr] md:items-center"
                                  >
                                    <span
                                      className="truncate font-mono text-[10px] text-muted-foreground"
                                      title={
                                        file.source
                                      }
                                    >
                                      {
                                        file.source
                                      }
                                    </span>

                                    <ArrowRight className="hidden h-3 w-3 text-muted-foreground md:block" />

                                    <span
                                      className="truncate font-mono text-[10px]"
                                      title={
                                        file.target
                                      }
                                    >
                                      {
                                        file.target
                                      }
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function getRelationshipKey(
  relationship: LayerRelationship
) {
  return `${relationship.source_layer}::${relationship.target_layer}`;
}