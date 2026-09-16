"use client";

import {
  Braces,
  ChevronRight,
  Code2,
  FileCode2,
  Folder,
  FolderOpen,
  GitBranch,
  Import,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CodeContextGraph } from "@/components/code/code-context-graph";

import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import {
  getCodeExplorer,
  type CodeExplorerFile,
  type CodeExplorerReference,
} from "@/lib/analysis";

function getFileName(file: string) {
  return file.replaceAll("\\", "/").split("/").pop() ?? file;
}

function getRelativePath(file: string) {
  const normalized = file.replaceAll("\\", "/");

  const srcIndex = normalized.indexOf("/src/");

  if (srcIndex !== -1) {
    return normalized.slice(srcIndex + 1);
  }

  return normalized;
}

function getDirectory(file: string) {
  const relative = getRelativePath(file);
  const parts = relative.split("/");

  if (parts.length <= 1) {
    return "/";
  }

  return parts.slice(0, -1).join("/");
}

function getSymbolIcon(type?: string) {
  if (type === "function") {
    return Braces;
  }

  return Code2;
}

function FileRow({
  file,
  selected,
  onClick,
}: {
  file: CodeExplorerFile;
  selected: boolean;
  onClick: () => void;
}) {
  const fileName = getFileName(file.file);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        selected
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <FileCode2 className="h-4 w-4 shrink-0" />

      <span className="min-w-0 flex-1 truncate text-sm">
        {fileName}
      </span>

      {file.symbols.length > 0 && (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
          {file.symbols.length}
        </span>
      )}
    </motion.button>
  );
}

function FileExplorer({
  files,
  selectedFile,
  onSelect,
}: {
  files: CodeExplorerFile[];
  selectedFile: CodeExplorerFile | null;
  onSelect: (file: CodeExplorerFile) => void;
}) {
  const directories = useMemo(() => {
    const grouped = new Map<string, CodeExplorerFile[]>();

    for (const file of files) {
      const directory = getDirectory(file.file);

      if (!grouped.has(directory)) {
        grouped.set(directory, []);
      }

      grouped.get(directory)!.push(file);
    }

    return Array.from(grouped.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [files]);

  return (
    <div className="space-y-5">
      {directories.map(([directory, directoryFiles]) => (
        <div key={directory}>
          <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {directory === "/" ? (
              <FolderOpen className="h-3.5 w-3.5" />
            ) : (
              <Folder className="h-3.5 w-3.5" />
            )}

            <span className="truncate">{directory}</span>
          </div>

          <div className="space-y-1">
            {directoryFiles.map((file) => (
              <FileRow
                key={file.file}
                file={file}
                selected={selectedFile?.file === file.file}
                onClick={() => onSelect(file)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-background/60 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className="mt-1 text-xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function CodeIntelligence({
  file,
  references,
  files,
  onClose,
  onSelectFile,
}: {
  file: CodeExplorerFile;
  references: CodeExplorerReference[];
  files: CodeExplorerFile[];
  onClose: () => void;
  onSelectFile: (file: CodeExplorerFile) => void;
}) {
  const incoming = references.filter(
    (reference) => reference.target_file === file.file
  );

  const outgoing = references.filter(
    (reference) => reference.source_file === file.file
  );

  const dependents = files.filter((candidate) =>
    candidate.dependencies.some(
      (dependency) =>
        dependency.resolved_file === file.file
    )
  );

  return (
    <motion.div
      key={file.file}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border bg-card"
    >
      {/* Header */}
      <div className="border-b px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <FileCode2 className="h-4 w-4" />
              CODE INTELLIGENCE
            </div>

            <h2 className="mt-2 truncate text-xl font-semibold tracking-tight">
              {getFileName(file.file)}
            </h2>

            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {getRelativePath(file.file)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background transition hover:bg-accent"
            aria-label="Close file details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-7 p-6">

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Symbols"
            value={file.symbols.length}
          />

          <Stat
            label="Incoming"
            value={file.incoming_references}
          />

          <Stat
            label="Outgoing"
            value={file.outgoing_references}
          />

          <Stat
            label="Dependents"
            value={dependents.length}
          />
        </div>

        {/* Relationship Graph */}
        <section>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />

                <h3 className="text-sm font-semibold">
                  Relationship Graph
                </h3>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Explore dependencies, dependents, and symbol references.
              </p>
            </div>

            <div className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex">
              <span className="rounded-md border px-2 py-1">
                Imports
              </span>

              <span className="rounded-md border px-2 py-1">
                Dependents
              </span>

              <span className="rounded-md border px-2 py-1">
                References
              </span>
            </div>
          </div>

          <CodeContextGraph
            file={file}
            files={files}
            references={references}
            onSelectFile={onSelectFile}
          />
        </section>

        {/* Symbols */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Braces className="h-4 w-4 text-primary" />

            <h3 className="text-sm font-semibold">
              Symbols
            </h3>

            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px]">
              {file.symbols.length}
            </span>
          </div>

          {file.symbols.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No indexed symbols found.
            </div>
          ) : (
            <div className="space-y-2">
              {file.symbols.map((symbol) => {
                const Icon = getSymbolIcon(symbol.type);

                return (
                  <motion.div
                    key={`${symbol.name}-${symbol.start_line}`}
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 rounded-xl border bg-background/50 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {symbol.name}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {symbol.type ?? "symbol"}
                      </p>
                    </div>

                    {symbol.start_line && (
                      <span className="rounded-md border px-2 py-1 font-mono text-[10px] text-muted-foreground">
                        L{symbol.start_line}
                        {symbol.end_line
                          ? `–${symbol.end_line}`
                          : ""}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Imports */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Import className="h-4 w-4 text-primary" />

            <h3 className="text-sm font-semibold">
              Imports
            </h3>

            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px]">
              {file.dependencies.length}
            </span>
          </div>

          {file.dependencies.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No imports detected.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {file.dependencies.map((dependency, index) => (
                <div
                  key={`${dependency.source}-${index}`}
                  className="min-w-0 rounded-xl border bg-background/50 px-4 py-3"
                >
                  <p className="truncate font-mono text-xs">
                    {dependency.source ?? "Unknown import"}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase">
                      {dependency.type ?? "unknown"}
                    </span>

                    {dependency.resolved_file && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {getFileName(dependency.resolved_file)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Dependents */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />

            <h3 className="text-sm font-semibold">
              Dependents
            </h3>

            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px]">
              {dependents.length}
            </span>
          </div>

          {dependents.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No files depend on this file.
            </div>
          ) : (
            <div className="space-y-2">
              {dependents.map((dependent) => (
                <motion.button
                  key={dependent.file}
                  type="button"
                  whileHover={{ x: 2 }}
                  onClick={() => onSelectFile(dependent)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-background/50 px-4 py-3 text-left transition hover:bg-accent"
                >
                  <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="truncate text-sm">
                    {getRelativePath(dependent.file)}
                  </span>

                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          )}
        </section>

        {/* References */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />

            <h3 className="text-sm font-semibold">
              Symbol References
            </h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Incoming */}
            <div className="rounded-xl border bg-background/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium">
                  Incoming
                </p>

                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px]">
                  {incoming.length}
                </span>
              </div>

              {incoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No incoming references.
                </p>
              ) : (
                <div className="space-y-2">
                  {incoming.map((reference, index) => (
                    <div
                      key={`${reference.source_file}-${index}`}
                      className="rounded-lg border bg-card px-3 py-2.5"
                    >
                      <p className="truncate text-xs font-medium">
                        {reference.source_symbol}
                      </p>

                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {getRelativePath(reference.source_file)}
                        {" · "}
                        L{reference.line}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div className="rounded-xl border bg-background/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium">
                  Outgoing
                </p>

                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px]">
                  {outgoing.length}
                </span>
              </div>

              {outgoing.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No outgoing references.
                </p>
              ) : (
                <div className="space-y-2">
                  {outgoing.map((reference, index) => (
                    <div
                      key={`${reference.target_file}-${index}`}
                      className="rounded-lg border bg-card px-3 py-2.5"
                    >
                      <p className="truncate text-xs font-medium">
                        {reference.target_symbol}
                      </p>

                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {getRelativePath(reference.target_file)}
                        {" · "}
                        L{reference.line}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

export default function CodeExplorerPage() {
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<CodeExplorerFile | null>(null);

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery({
      queryKey: ["code-explorer"],
      queryFn: getCodeExplorer,
      refetchInterval: 30000,
      refetchOnWindowFocus: false,
    });

  const files = data?.files ?? [];

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return files;
    }

    return files.filter((file) => {
      const fileMatch = file.file
        .toLowerCase()
        .includes(query);

      const symbolMatch = file.symbols.some((symbol) =>
        symbol.name.toLowerCase().includes(query)
      );

      return fileMatch || symbolMatch;
    });
  }, [files, search]);

  const effectiveSelectedFile = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return (
      files.find((file) => file.file === selectedFile.file) ??
      null
    );
  }, [files, selectedFile]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <PageHeader
          eyebrow="CODE INTELLIGENCE"
          title="Code Explorer"
          description="Explore files, symbols, imports, dependencies, and code references."
        />

        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">
            Unable to load code intelligence.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="CODE INTELLIGENCE"
        title="Code Explorer"
        description="Explore files, symbols, imports, dependencies, and code references."
      />

      {/* Analyzer status */}
      <div className="mt-6 flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>

          <span className="text-sm text-muted-foreground">
            Analyzer ready · {data.summary.total_files} files indexed
          </span>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent disabled:opacity-50"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Files"
          value={data.summary.total_files}
        />

        <Stat
          label="Symbols"
          value={data.summary.total_symbols}
        />

        <Stat
          label="References"
          value={data.summary.total_references}
        />
      </div>

      {/* Explorer */}
      <div className="mt-6 grid min-h-[760px] gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* File explorer */}
        <section className="min-w-0 overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />

              <h2 className="font-semibold">
                File Explorer
              </h2>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search files or symbols..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto p-4">
            {filteredFiles.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No matching files found.
              </div>
            ) : (
              <FileExplorer
                files={filteredFiles}
                selectedFile={effectiveSelectedFile}
                onSelect={setSelectedFile}
              />
            )}
          </div>
        </section>

        {/* Intelligence */}
        <section className="min-w-0">
          <AnimatePresence mode="wait">
            {effectiveSelectedFile ? (
              <CodeIntelligence
  file={effectiveSelectedFile}
  references={data.references}
  files={files}
  onClose={() => setSelectedFile(null)}
  onSelectFile={setSelectedFile}
/>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex min-h-[680px] items-center justify-center rounded-2xl border border-dashed bg-card/50 p-8"
              >
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-background">
                    <FileCode2 className="h-6 w-6 text-primary" />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    Select a file
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose a file from the explorer to inspect
                    its symbols, imports, dependents, and code
                    references.
                  </p>

                  <div className="mt-5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <ChevronRight className="h-3.5 w-3.5" />
                    Select any analyzed file
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}