"use client";

import {
  AlertTriangle,
  ArrowRight,
  GitBranch,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
  Users,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import {
  getImpactAnalysis,
  type ImpactSymbol,
} from "@/lib/analysis";

function formatFile(file: string) {
  return file.replaceAll("\\", "/");
}

function getFileName(file: string) {
  return (
    formatFile(file)
      .split("/")
      .pop() ?? file
  );
}

function getRelativeFile(file: string) {
  const normalized = formatFile(file);

  const srcIndex =
    normalized.indexOf("/src/");

  if (srcIndex !== -1) {
    return normalized.slice(
      srcIndex + 1
    );
  }

  return normalized;
}

function ImpactCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-2xl border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background">
          <Icon className="h-4 w-4 text-primary" />
        </div>

        <span className="text-2xl font-semibold tracking-tight">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium">
        {label}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}

function SymbolItem({
  item,
}: {
  item: ImpactSymbol;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs font-medium">
          {item.symbol}
        </p>

        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {getRelativeFile(item.file)}
        </p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}

function ImpactSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: ImpactSymbol[];
}) {
  return (
    <section className="rounded-2xl border bg-card">
      <div className="border-b px-5 py-5">
        <h2 className="text-sm font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="p-5">
        {items.length > 0 ? (
          <div className="grid gap-2 lg:grid-cols-2">
            {items.map(
              (item, index) => (
                <SymbolItem
                  key={`${item.file}:${item.symbol}:${index}`}
                  item={item}
                />
              )
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed px-5 py-8 text-center">
            <p className="text-sm font-medium">
              No impact detected
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              The analyzer did not find symbols
              depending on this target.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ImpactGraph({
  target,
  direct,
  transitive,
}: {
  target: string;
  direct: ImpactSymbol[];
  transitive: ImpactSymbol[];
}) {
  return (
    <section className="rounded-2xl border bg-card">
      <div className="border-b px-5 py-5">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />

          <div>
            <h2 className="text-sm font-semibold">
              Impact Relationship
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Dependency levels discovered around the selected symbol.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-6">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1fr_80px_1fr_80px_1fr] items-center gap-4">
            {/* Target */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />

                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Target
                </span>
              </div>

              <p className="mt-3 break-all font-mono text-sm font-semibold">
                {target}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Symbol being changed
              </p>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Direct */}
            <div className="rounded-2xl border bg-background p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Direct
                </span>

                <span className="text-lg font-semibold">
                  {direct.length}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {direct.slice(0, 4).map(
                  (item, index) => (
                    <div
                      key={`${item.file}:${item.symbol}:${index}`}
                      className="rounded-lg border bg-card px-3 py-2"
                    >
                      <p className="truncate font-mono text-[11px]">
                        {item.symbol}
                      </p>
                    </div>
                  )
                )}

                {direct.length > 4 && (
                  <p className="text-[11px] text-muted-foreground">
                    +{direct.length - 4} more
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Transitive */}
            <div className="rounded-2xl border bg-background p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Transitive
                </span>

                <span className="text-lg font-semibold">
                  {transitive.length}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {transitive.slice(0, 4).map(
                  (item, index) => (
                    <div
                      key={`${item.file}:${item.symbol}:${index}`}
                      className="rounded-lg border bg-card px-3 py-2"
                    >
                      <p className="truncate font-mono text-[11px]">
                        {item.symbol}
                      </p>
                    </div>
                  )
                )}

                {transitive.length > 4 && (
                  <p className="text-[11px] text-muted-foreground">
                    +{transitive.length - 4} more
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImpactPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSymbol =
    searchParams.get("symbol")?.trim() ||
    "getAnalysisOverview";

  const [symbolInput, setSymbolInput] =
    useState(urlSymbol);

  useEffect(() => {
    setSymbolInput(urlSymbol);
  }, [urlSymbol]);

  const targetSymbol = urlSymbol;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "impact",
      targetSymbol,
    ],
    queryFn: () =>
      getImpactAnalysis(
        targetSymbol
      ),
    enabled: Boolean(targetSymbol),
    refetchOnWindowFocus: false,
  });

  const impact = data?.impact;

  const handleAnalyze = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const symbol =
      symbolInput.trim();

    if (!symbol) {
      return;
    }

    router.push(
      `/impact?symbol=${encodeURIComponent(symbol)}`
    );
  };

  return (
    <div className="mx-auto max-w-[1500px] p-6 lg:p-8">
      <PageHeader
        eyebrow="IMPACT INTELLIGENCE"
        title="Impact Analysis"
        description="Understand which symbols may be affected when a part of your codebase changes."
      />

      {/* Target selector */}
      <section className="mt-6 rounded-2xl border bg-card p-5">
        <form
          onSubmit={handleAnalyze}
          className="flex flex-col gap-3 lg:flex-row lg:items-end"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="impact-symbol"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Symbol to analyze
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                id="impact-symbol"
                value={symbolInput}
                onChange={(event) =>
                  setSymbolInput(
                    event.target.value
                  )
                }
                placeholder="e.g. getAnalysisOverview"
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 font-mono text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Enter a symbol name from the analyzed repository.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              !symbolInput.trim() ||
              isFetching
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search className="h-3.5 w-3.5" />
            Analyze Impact
          </button>
        </form>
      </section>

      {/* Analyzer status */}
      <div className="mt-4 flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isError
                ? "bg-destructive"
                : "bg-emerald-500"
            }`}
          />

          <span className="text-xs font-medium">
            {isError
              ? "Analyzer unavailable"
              : "Impact analyzer ready"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={
            isFetching ||
            !targetSymbol
          }
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isFetching
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="mt-6 rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          </div>

          <p className="mt-4 text-sm font-medium">
            Analyzing symbol impact...
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Building the reverse dependency relationship for{" "}
            <code className="font-mono">
              {targetSymbol}
            </code>
            .
          </p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <ShieldAlert className="mx-auto h-6 w-6 text-destructive" />

          <p className="mt-3 text-sm font-medium">
            Impact analysis failed
          </p>

          <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
            The analyzer could not calculate the requested impact.
          </p>

          {error instanceof Error && (
            <p className="mx-auto mt-3 max-w-xl break-words rounded-lg border bg-background px-3 py-2 font-mono text-[10px] text-muted-foreground">
              {error.message}
            </p>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading &&
        !isError &&
        impact && (
          <div className="mt-6 space-y-6">
            {/* Target */}
            <motion.section
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="rounded-2xl border bg-card"
            >
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />

                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Change Target
                    </p>
                  </div>

                  <h2 className="mt-3 break-all font-mono text-lg font-semibold">
                    {impact.symbol}
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Potential downstream impact detected from the symbol relationship graph.
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border bg-background px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Repository
                  </p>

                  <p className="mt-1 text-xs font-medium">
                    Local Workspace
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ImpactCard
                icon={Users}
                label="Direct Dependents"
                value={
                  impact.summary
                    .direct_dependents
                }
                description="Symbols that directly depend on the selected symbol."
              />

              <ImpactCard
                icon={GitBranch}
                label="Transitive Dependents"
                value={
                  impact.summary
                    .transitive_dependents
                }
                description="Symbols reached through downstream dependency chains."
              />

              <ImpactCard
                icon={AlertTriangle}
                label="Total Affected"
                value={
                  impact.summary
                    .total_affected
                }
                description="Combined direct and transitive symbol impact."
              />
            </div>

            {/* Graph */}
            <ImpactGraph
              target={impact.symbol}
              direct={impact.direct_impact}
              transitive={
                impact.transitive_impact
              }
            />

            {/* Lists */}
            <div className="grid gap-6 xl:grid-cols-2">
              <ImpactSection
                title="Direct Impact"
                description="Symbols that directly call or depend on the selected symbol."
                items={
                  impact.direct_impact
                }
              />

              <ImpactSection
                title="Transitive Impact"
                description="Symbols that may be affected through downstream relationships."
                items={
                  impact.transitive_impact
                }
              />
            </div>

            {/* Explanation */}
            <section className="rounded-2xl border bg-card p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-background">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    How to interpret this analysis
                  </h2>

                  <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">
                    Direct impact represents symbols with an immediate
                    relationship to the selected target. Transitive impact
                    represents symbols reached through additional dependency
                    levels. These relationships indicate potential impact,
                    not a guarantee that a particular code change will break
                    every affected symbol.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

export default function ImpactPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1500px] p-6 lg:p-8">
          <div className="rounded-2xl border bg-card p-10 text-center">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              Loading Impact Analysis...
            </p>
          </div>
        </div>
      }
    >
      <ImpactPageContent />
    </Suspense>
  );
}
