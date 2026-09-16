"use client";

import {
  Activity,
  ArrowRight,
  Braces,
  ChevronRight,
  CircleDot,
  Code2,
  FileCode2,
  Filter,
  Globe,
  Layers3,
  RefreshCw,
  Search,
  Server,
  X,
  Zap,
} from "lucide-react";

import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";

import {
  getRouteOverview,
  type RouteFlow,
  type RouteRecord,
} from "@/lib/analysis";

type RouteTypeFilter = "all" | "api" | "page";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatFilePath(file: string) {
  return file
    .replaceAll("\\", "/")
    .replace(/^.*?codebase-intelligence-platform[\\/]/, "");
}

function getMethodClass(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return "text-emerald-500";

    case "POST":
      return "text-blue-500";

    case "PUT":
      return "text-amber-500";

    case "PATCH":
      return "text-orange-500";

    case "DELETE":
      return "text-red-500";

    default:
      return "text-muted-foreground";
  }
}

function getMethodBadgeClass(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";

    case "POST":
      return "border-blue-500/20 bg-blue-500/10 text-blue-500";

    case "PUT":
      return "border-amber-500/20 bg-amber-500/10 text-amber-500";

    case "PATCH":
      return "border-orange-500/20 bg-orange-500/10 text-orange-500";

    case "DELETE":
      return "border-red-500/20 bg-red-500/10 text-red-500";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getFramework(route: RouteRecord) {
  const file = route.file.replaceAll("\\", "/");

  if (
    route.type?.toLowerCase().includes("next") ||
    file.includes("/app/")
  ) {
    return "Next.js";
  }

  if (
    route.type?.toLowerCase().includes("express") ||
    route.type?.toLowerCase().includes("api")
  ) {
    return "Express";
  }

  return route.type || "Unknown";
}

/* -------------------------------------------------------------------------- */
/* Metric Card                                                                */
/* -------------------------------------------------------------------------- */

function RouteMetric({
  label,
  value,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  delay?: number;
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
      transition={{
        duration: 0.3,
        delay,
      }}
      className="rounded-2xl border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Route Row                                                                  */
/* -------------------------------------------------------------------------- */

function RouteRow({
  route,
  selected,
  onClick,
}: {
  route: RouteRecord;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      whileHover={{
        x: 2,
      }}
      transition={{
        duration: 0.15,
      }}
      className={[
        "group w-full border-b px-5 py-4 text-left transition-colors last:border-b-0",
        selected
          ? "bg-accent/60"
          : "hover:bg-muted/40",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        {/* Method */}
        <div
          className={[
            "mt-0.5 flex min-w-[58px] items-center justify-center rounded-md border px-2 py-1 text-[11px] font-semibold",
            getMethodBadgeClass(route.method),
          ].join(" ")}
        >
          {route.method.toUpperCase()}
        </div>

        {/* Route Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="truncate text-sm font-medium">
              {route.path}
            </code>

            {route.dynamic && (
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-500">
                Dynamic
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {/* Route type */}
            <span className="flex items-center gap-1.5">
              {route.route_type === "api" ? (
                <Server className="h-3.5 w-3.5" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}

              {route.route_type === "api"
                ? "API"
                : "Page"}
            </span>

            {/* Framework */}
            <span className="flex items-center gap-1.5">
              <Layers3 className="h-3.5 w-3.5" />

              {getFramework(route)}
            </span>

            {/* Source file */}
            <span className="flex min-w-0 items-center gap-1.5">
              <FileCode2 className="h-3.5 w-3.5 shrink-0" />

              <span className="truncate">
                {formatFilePath(route.file)}
              </span>
            </span>
          </div>

          {/* Handler */}
          {route.handler && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Braces className="h-3.5 w-3.5" />

              <span>
                Handler:
              </span>

              <code className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                {route.handler}
              </code>
            </div>
          )}
        </div>

        {/* Selection indicator */}
        <ChevronRight
          className={[
            "mt-1 h-4 w-4 shrink-0 transition-all",
            selected
              ? "translate-x-0 text-foreground"
              : "-translate-x-1 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
          ].join(" ")}
        />
      </div>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail Item                                                                */
/* -------------------------------------------------------------------------- */

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p
        className={[
          "break-all text-sm text-foreground",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Route Intelligence                                                         */
/* -------------------------------------------------------------------------- */

function RouteDetails({
  route,
  flow,
  onClose,
}: {
  route: RouteRecord | null;
  flow: RouteFlow | null;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-20 overflow-hidden rounded-2xl border bg-card">
      <AnimatePresence mode="wait">
        {/* Empty state */}
        {!route ? (
          <motion.div
            key="empty"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="flex min-h-[520px] flex-col items-center justify-center px-8 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-background">
              <CircleDot className="h-6 w-6 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-base font-semibold">
              Route Intelligence
            </h3>

            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Select a route from the explorer to inspect
              its handler, source location, metadata, and
              execution flow.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${route.method}-${route.path}-${route.file}-${route.line ?? 0}`}
            initial={{
              opacity: 0,
              x: 12,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -12,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            {/* ---------------------------------------------------------------- */}
            {/* Header                                                           */}
            {/* ---------------------------------------------------------------- */}

            <div className="border-b p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded-md border px-2 py-1 text-[10px] font-bold",
                        getMethodBadgeClass(
                          route.method
                        ),
                      ].join(" ")}
                    >
                      {route.method.toUpperCase()}
                    </span>

                    <span className="rounded-full border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      {route.route_type === "api"
                        ? "API Route"
                        : "Page Route"}
                    </span>
                  </div>

                  <h2 className="mt-3 break-all font-mono text-lg font-semibold">
                    {route.path}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Close route intelligence"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {route.dynamic && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-500">
                  <Zap className="h-3.5 w-3.5" />

                  This route contains a dynamic parameter.
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Details                                                          */}
            {/* ---------------------------------------------------------------- */}

            <div className="space-y-6 p-5">
              {/* Route Details */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-muted-foreground" />

                  <h3 className="text-sm font-semibold">
                    Route Details
                  </h3>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <DetailItem
                    label="Framework"
                    value={getFramework(route)}
                  />

                  <DetailItem
                    label="Route Type"
                    value={
                      route.route_type === "api"
                        ? "API"
                        : "Page"
                    }
                  />

                  <DetailItem
                    label="Source File"
                    value={formatFilePath(
                      route.file
                    )}
                    mono
                  />

                  <DetailItem
                    label="Source Line"
                    value={
                      route.line
                        ? `Line ${route.line}`
                        : "Not available"
                    }
                  />
                </div>
              </div>

              {/* ---------------------------------------------------------------- */}
              {/* Handler                                                          */}
              {/* ---------------------------------------------------------------- */}

              <div className="border-t pt-5">
                <div className="mb-4 flex items-center gap-2">
                  <Braces className="h-4 w-4 text-muted-foreground" />

                  <h3 className="text-sm font-semibold">
                    Handler
                  </h3>
                </div>

                {route.handler ? (
                  <div className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border">
                        <Braces className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Function
                        </p>

                        <p className="mt-1 truncate font-mono text-sm font-medium">
                          {route.handler}
                        </p>
                      </div>
                    </div>

                    {route.handler_symbol && (
                      <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">
                            Symbol Type
                          </p>

                          <p className="mt-1 font-medium">
                            {route.handler_symbol
                              .type ??
                              "Function"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">
                            Location
                          </p>

                          <p className="mt-1 font-medium">
                            {route.handler_symbol
                              .start_line
                              ? `Line ${route.handler_symbol.start_line}`
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    No handler symbol was linked to
                    this route.
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------------------- */}
              {/* Execution Flow                                                   */}
              {/* ---------------------------------------------------------------- */}

              <div className="border-t pt-5">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />

                  <h3 className="text-sm font-semibold">
                    Execution Flow
                  </h3>
                </div>

                {!flow ? (
                  <div className="rounded-xl border border-dashed p-5 text-sm leading-6 text-muted-foreground">
                    No execution flow was detected for
                    this route.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Route */}
                    <div className="rounded-xl border bg-background p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Route
                          </p>

                          <p className="truncate font-mono text-xs font-medium">
                            {flow.method.toUpperCase()}{" "}
                            {flow.path}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Handler */}
                    {flow.handler && (
                      <div className="rounded-xl border bg-background p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Braces className="h-4 w-4 text-primary" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Handler
                            </p>

                            <p className="truncate font-mono text-xs font-medium">
                              {flow.handler}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Calls */}
                    {flow.calls &&
                      flow.calls.length > 0 && (
                        <div className="space-y-2">
                          {flow.calls.map(
                            (call, index) => (
                              <div
                                key={`${call}-${index}`}
                                className="rounded-xl border bg-background p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                      Call{" "}
                                      {index + 1}
                                    </p>

                                    <p className="truncate font-mono text-xs font-medium">
                                      {call}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* No calls */}
                    {flow.handler &&
                      (!flow.calls ||
                        flow.calls.length ===
                          0) && (
                        <div className="rounded-xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
                          No additional function calls
                          were detected.
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function RoutesPage() {
  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState<RouteTypeFilter>("all");

  const [methodFilter, setMethodFilter] =
    useState("all");

  const [selectedRoute, setSelectedRoute] =
    useState<RouteRecord | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["route-overview"],

    queryFn: async () => {
      const result = await getRouteOverview();

      setLastUpdated(new Date());

      return result;
    },

    refetchInterval: 30000,

    refetchOnWindowFocus: false,
  });

  /* ------------------------------------------------------------------------ */
  /* Data                                                                      */
  /* ------------------------------------------------------------------------ */

  const routes = data?.routes ?? [];

  const summary = data?.summary ?? {
    total_routes: 0,
    api_routes: 0,
    page_routes: 0,
    dynamic_routes: 0,
    express_routes: 0,
    nextjs_routes: 0,
    methods: {},
  };

  /* ------------------------------------------------------------------------ */
  /* Methods                                                                   */
  /* ------------------------------------------------------------------------ */

  const methods = useMemo(() => {
    return Object.entries(
      summary.methods ?? {}
    ).sort(([, a], [, b]) => b - a);
  }, [summary.methods]);

  /* ------------------------------------------------------------------------ */
  /* Filtering                                                                 */
  /* ------------------------------------------------------------------------ */

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return routes.filter((route) => {
      const matchesSearch =
        !query ||
        route.path
          .toLowerCase()
          .includes(query) ||
        route.file
          .toLowerCase()
          .includes(query) ||
        route.handler
          ?.toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === "all" ||
        route.route_type === typeFilter;

      const matchesMethod =
        methodFilter === "all" ||
        route.method.toUpperCase() ===
          methodFilter.toUpperCase();

      return (
        matchesSearch &&
        matchesType &&
        matchesMethod
      );
    });
  }, [
    routes,
    search,
    typeFilter,
    methodFilter,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Selected Flow                                                             */
  /* ------------------------------------------------------------------------ */

  const selectedFlow = useMemo(() => {
    if (!selectedRoute) {
      return null;
    }

    if (!data?.flows) {
      return null;
    }

    return (
      data.flows.find(
        (flow) =>
          flow.method.toUpperCase() ===
            selectedRoute.method.toUpperCase() &&
          flow.path === selectedRoute.path &&
          flow.file === selectedRoute.file
      ) ?? null
    );
  }, [selectedRoute, data?.flows]);

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                   */
  /* ------------------------------------------------------------------------ */

  function handleRouteSelect(
    route: RouteRecord
  ) {
    setSelectedRoute(route);
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setMethodFilter("all");
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                   */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <div className="p-6">
        <PageLoader />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                     */
  /* ------------------------------------------------------------------------ */

  if (isError || !data) {
    return (
      <div className="p-6">
        <PageHeader
          title="Routes"
          description="Understand your application's HTTP and page routing structure."
        />

        <div className="mt-6 flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-card">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>

          <h2 className="mt-4 text-base font-semibold">
            Unable to load route analysis
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Make sure the analyzer and backend are
            running.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />

            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Page                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="p-6">
      {/* Page Header */}
      <PageHeader
        title="Routes"
        description="Understand your application's HTTP and page routing structure."
      />

      {/* -------------------------------------------------------------------- */}
      {/* Analyzer Status                                                       */}
      {/* -------------------------------------------------------------------- */}

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />

            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>

          <div>
            <p className="text-xs font-medium">
              Route Analyzer Ready
            </p>

            <p className="text-[11px] text-muted-foreground">
              {lastUpdated
                ? `Last analyzed ${lastUpdated.toLocaleTimeString()}`
                : "Live analysis enabled"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={[
              "h-3.5 w-3.5",
              isFetching
                ? "animate-spin"
                : "",
            ].join(" ")}
          />

          Refresh
        </button>
      </motion.div>

      {/* -------------------------------------------------------------------- */}
      {/* Metrics                                                               */}
      {/* -------------------------------------------------------------------- */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RouteMetric
          label="Total Routes"
          value={summary.total_routes}
          icon={Globe}
          delay={0}
        />

        <RouteMetric
          label="API Routes"
          value={summary.api_routes}
          icon={Server}
          delay={0.05}
        />

        <RouteMetric
          label="Page Routes"
          value={summary.page_routes}
          icon={Layers3}
          delay={0.1}
        />

        <RouteMetric
          label="Dynamic Routes"
          value={summary.dynamic_routes}
          icon={Zap}
          delay={0.15}
        />
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Method Distribution                                                   */}
      {/* -------------------------------------------------------------------- */}

      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          delay: 0.2,
        }}
        className="mt-6 rounded-2xl border bg-card p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">
              HTTP Method Distribution
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Distribution of detected route methods.
            </p>
          </div>

          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {methods.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No HTTP methods detected.
            </p>
          ) : (
            methods.map(([method, count]) => {
              const percentage =
                summary.total_routes > 0
                  ? Math.round(
                      (count /
                        summary.total_routes) *
                        100
                    )
                  : 0;

              const isSelected =
                methodFilter === method;

              return (
                <button
                  key={method}
                  type="button"
                  onClick={() =>
                    setMethodFilter(
                      isSelected
                        ? "all"
                        : method
                    )
                  }
                  className={[
                    "min-w-[130px] flex-1 rounded-xl border p-4 text-left transition-colors sm:flex-none",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "hover:bg-muted/40",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "text-xs font-bold",
                        getMethodClass(method),
                      ].join(" ")}
                    >
                      {method}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>

                  <p className="mt-2 text-xl font-semibold">
                    {count}
                  </p>

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
                        delay: 0.25,
                      }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </motion.section>

      {/* -------------------------------------------------------------------- */}
      {/* Main Workspace                                                        */}
      {/* -------------------------------------------------------------------- */}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        {/* ================================================================== */}
        {/* LEFT — Route Explorer                                               */}
        {/* ================================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.25,
          }}
          className="min-w-0 overflow-hidden rounded-2xl border bg-card"
        >
          {/* Explorer Header */}
          <div className="border-b p-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold">
                  Route Explorer
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Browse detected application routes and
                  inspect their implementation.
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search routes, files, or handlers..."
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />

                  Filters
                </div>

                {(
                  [
                    ["all", "All"],
                    ["api", "API"],
                    ["page", "Pages"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setTypeFilter(value)
                    }
                    className={[
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      typeFilter === value
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}

                <select
                  value={methodFilter}
                  onChange={(event) =>
                    setMethodFilter(
                      event.target.value
                    )
                  }
                  className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-primary"
                >
                  <option value="all">
                    All Methods
                  </option>

                  {methods.map(([method]) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {method}
                    </option>
                  ))}
                </select>

                {(search ||
                  typeFilter !== "all" ||
                  methodFilter !== "all") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredRoutes.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {routes.length}
              </span>{" "}
              routes
            </p>

            {selectedRoute && (
              <span className="flex items-center gap-1.5 text-[11px] text-primary">
                <CircleDot className="h-3 w-3" />

                Route selected
              </span>
            )}
          </div>

          {/* Route List */}
          {filteredRoutes.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <Search className="h-6 w-6 text-muted-foreground" />

              <h3 className="mt-4 text-sm font-semibold">
                No routes found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                Try changing your search or clearing the
                active filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div>
              {filteredRoutes.map(
                (route) => (
                  <RouteRow
                    key={`${route.method}-${route.path}-${route.file}-${route.line ?? 0}`}
                    route={route}
                    selected={
                      selectedRoute?.method ===
                        route.method &&
                      selectedRoute?.path ===
                        route.path &&
                      selectedRoute?.file ===
                        route.file &&
                      selectedRoute?.line ===
                        route.line
                    }
                    onClick={() =>
                      handleRouteSelect(
                        route
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </motion.section>

        {/* ================================================================== */}
        {/* RIGHT — Route Intelligence                                          */}
        {/* ================================================================== */}

        <motion.aside
          initial={{
            opacity: 0,
            x: 16,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.3,
          }}
          className="min-w-0"
        >
          <RouteDetails
            route={selectedRoute}
            flow={selectedFlow}
            onClose={() =>
              setSelectedRoute(null)
            }
          />
        </motion.aside>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Footer                                                                */}
      {/* -------------------------------------------------------------------- */}

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.45,
        }}
        className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

          Route analysis is generated from the active
          local workspace.
        </div>

        <div className="text-xs text-muted-foreground">
          Auto-refresh: 30s
        </div>
      </motion.div>
    </div>
  );
}