"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Info,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface ArchitectureViolation {
  rule?: string;
  type?: string;
  severity?: string;
  message?: string;
  description?: string;
  source?: string;
  target?: string;
  file?: string;
  files?: string[];
  layer?: string;
  source_layer?: string;
  target_layer?: string;
  [key: string]: unknown;
}

interface ArchitectureViolationsProps {
  violations: ArchitectureViolation[];
}

type Severity = "all" | "high" | "medium" | "low" | "info";

export function ArchitectureViolations({
  violations,
}: ArchitectureViolationsProps) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] =
    useState<Severity>("all");

  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  const [expandedIndex, setExpandedIndex] =
    useState<number | null>(null);

  const normalizedViolations = useMemo(() => {
    return violations.map((violation, index) => ({
      violation,
      index,
      severity: normalizeSeverity(
        violation.severity
      ),
    }));
  }, [violations]);

  const severityCounts = useMemo(() => {
    return {
      high: normalizedViolations.filter(
        (item) => item.severity === "high"
      ).length,

      medium: normalizedViolations.filter(
        (item) => item.severity === "medium"
      ).length,

      low: normalizedViolations.filter(
        (item) => item.severity === "low"
      ).length,

      info: normalizedViolations.filter(
        (item) => item.severity === "info"
      ).length,
    };
  }, [normalizedViolations]);

  const filteredViolations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return normalizedViolations.filter(
      ({ violation, severity: itemSeverity }) => {
        if (
          severity !== "all" &&
          itemSeverity !== severity
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        return JSON.stringify(violation)
          .toLowerCase()
          .includes(query);
      }
    );
  }, [
    normalizedViolations,
    search,
    severity,
  ]);

  const selectedIssue = useMemo(() => {
    if (selectedIndex === null) {
      return null;
    }

    return (
      normalizedViolations.find(
        (item) => item.index === selectedIndex
      ) ?? null
    );
  }, [
    normalizedViolations,
    selectedIndex,
  ]);

  const clearFilters = () => {
    setSearch("");
    setSeverity("all");
  };

  const hasFilters =
    search.trim().length > 0 ||
    severity !== "all";

  return (
    <section className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <ShieldAlert className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-semibold">
                Architecture Issues
              </h2>

              <p className="text-xs text-muted-foreground">
                Rules and structural problems detected by the
                architecture analyzer.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
              Total issues
            </p>

            <p className="mt-0.5 text-sm font-semibold">
              {violations.length}
            </p>
          </div>
        </div>

        {/* Severity summary */}
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <SeveritySummary
            label="High"
            count={severityCounts.high}
            active={severity === "high"}
            onClick={() =>
              setSeverity(
                severity === "high"
                  ? "all"
                  : "high"
              )
            }
          />

          <SeveritySummary
            label="Medium"
            count={severityCounts.medium}
            active={severity === "medium"}
            onClick={() =>
              setSeverity(
                severity === "medium"
                  ? "all"
                  : "medium"
              )
            }
          />

          <SeveritySummary
            label="Low"
            count={severityCounts.low}
            active={severity === "low"}
            onClick={() =>
              setSeverity(
                severity === "low"
                  ? "all"
                  : "low"
              )
            }
          />

          <SeveritySummary
            label="Info"
            count={severityCounts.info}
            active={severity === "info"}
            onClick={() =>
              setSeverity(
                severity === "info"
                  ? "all"
                  : "info"
              )
            }
          />
        </div>

        {/* Search */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search issues, rules, files..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear issue search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-accent"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Selected issue */}
      <AnimatePresence initial={false}>
        {selectedIssue && (
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
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge
                      severity={
                        selectedIssue.severity
                      }
                    />

                    <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium">
                      {getRuleName(
                        selectedIssue.violation
                      )}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold">
                    {getIssueMessage(
                      selectedIssue.violation
                    )}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Detailed architecture issue detected
                    by the analyzer.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex(null)
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent"
                  aria-label="Close issue details"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <IssueDetails
                violation={selectedIssue.violation}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issues */}
      <div className="p-5">
        {filteredViolations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            {violations.length === 0 ? (
              <>
                <Info className="mx-auto h-5 w-5 text-muted-foreground" />

                <p className="mt-3 text-sm font-medium">
                  No architecture issues detected
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  The analyzer did not report any architecture
                  rule violations.
                </p>
              </>
            ) : (
              <>
                <Search className="mx-auto h-5 w-5 text-muted-foreground" />

                <p className="mt-3 text-sm font-medium">
                  No matching issues
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Try changing the severity filter or search
                  query.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
                >
                  Reset filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredViolations.map(
              ({
                violation,
                index,
                severity: itemSeverity,
              }) => {
                const isSelected =
                  selectedIndex === index;

                const isExpanded =
                  expandedIndex === index;

                const primaryFile =
                  getPrimaryFile(violation);

                return (
                  <motion.div
                    key={index}
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
                    }}
                    className={`overflow-hidden rounded-lg border transition-colors ${
                      isSelected
                        ? "border-foreground/40 bg-accent/40"
                        : "border-border bg-background hover:bg-accent/30"
                    }`}
                  >
                    <div className="flex gap-3 p-4">
                      <div className="mt-0.5 shrink-0">
                        <SeverityIcon
                          severity={itemSeverity}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIndex(
                            isSelected
                              ? null
                              : index
                          )
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <SeverityBadge
                            severity={
                              itemSeverity
                            }
                          />

                          <span className="text-[10px] text-muted-foreground">
                            {getRuleName(
                              violation
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-medium">
                          {getIssueMessage(
                            violation
                          )}
                        </p>

                        {primaryFile && (
                          <p
                            className="mt-1 truncate font-mono text-[10px] text-muted-foreground"
                            title={primaryFile}
                          >
                            {primaryFile}
                          </p>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIndex(
                            isExpanded
                              ? null
                              : index
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent"
                        aria-label={
                          isExpanded
                            ? "Collapse issue"
                            : "Expand issue"
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
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
                          <IssueDetails
                            violation={violation}
                          />
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

function SeveritySummary({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        active
          ? "border-foreground bg-accent"
          : "border-border bg-background hover:bg-accent/50"
      }`}
    >
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {count}
      </p>
    </button>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: string;
}) {
  const label =
    severity.charAt(0).toUpperCase() +
    severity.slice(1);

  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide">
      {label}
    </span>
  );
}

function SeverityIcon({
  severity,
}: {
  severity: string;
}) {
  if (severity === "high") {
    return (
      <CircleAlert className="h-4 w-4" />
    );
  }

  if (severity === "medium") {
    return (
      <AlertTriangle className="h-4 w-4" />
    );
  }

  return (
    <Info className="h-4 w-4 text-muted-foreground" />
  );
}

function IssueDetails({
  violation,
}: {
  violation: ArchitectureViolation;
}) {
  const entries = Object.entries(violation).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );

  return (
    <div className="bg-muted/20 p-4">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Issue details
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        {entries.map(([key, value]) => {
          if (
            key === "message" ||
            key === "description"
          ) {
            return null;
          }

          return (
            <div
              key={key}
              className="rounded-md border border-border bg-background p-3"
            >
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                {formatLabel(key)}
              </p>

              <p className="mt-1 break-words font-mono text-[10px]">
                {formatValue(value)}
              </p>
            </div>
          );
        })}
      </div>

      {(violation.description ||
        violation.message) && (
        <div className="mt-3 rounded-md border border-border bg-background p-3">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Description
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {violation.description ??
              violation.message}
          </p>
        </div>
      )}
    </div>
  );
}

function normalizeSeverity(
  severity?: string
): Exclude<Severity, "all"> {
  const value =
    severity?.toLowerCase().trim();

  if (
    value === "critical" ||
    value === "high" ||
    value === "error"
  ) {
    return "high";
  }

  if (
    value === "medium" ||
    value === "warning" ||
    value === "warn"
  ) {
    return "medium";
  }

  if (value === "low") {
    return "low";
  }

  return "info";
}

function getRuleName(
  violation: ArchitectureViolation
) {
  return (
    violation.rule ??
    violation.type ??
    "Architecture rule"
  );
}

function getIssueMessage(
  violation: ArchitectureViolation
) {
  return (
    violation.message ??
    violation.description ??
    `${getRuleName(violation)} detected`
  );
}

function getPrimaryFile(
  violation: ArchitectureViolation
): string | null {
  if (violation.file) {
    return violation.file;
  }

  if (violation.source) {
    return violation.source;
  }

  if (
    Array.isArray(violation.files) &&
    violation.files.length > 0
  ) {
    return violation.files[0];
  }

  return null;
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}