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
  Layers3,
Route,
Sparkles,
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
  type CodeExplorerSymbol,
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

function FileOverview({
  file,
}: {
  file: CodeExplorerFile;
}) {
  const intelligence = file.intelligence;

  const role =
    intelligence?.role ?? "Source File";

  const layer =
    intelligence?.layer ?? "Other";

  const isEntryPoint =
    intelligence?.entry_point ?? false;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />

        <div>
          <h3 className="text-sm font-semibold">
            File Overview
          </h3>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Understand this file before exploring its relationships.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background/50">
        {/* Purpose */}
        <div className="border-b px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            What this file does
          </p>

          <p className="mt-2 text-sm leading-6">
            {getFileDescription(
              file,
              role,
              layer
            )}
          </p>
        </div>

        {/* Metadata */}
        <div className="grid gap-px bg-border sm:grid-cols-3">
          <OverviewItem
            icon={FileCode2}
            label="Role"
            value={role}
          />

          <OverviewItem
            icon={Layers3}
            label="Architecture Layer"
            value={layer}
          />

          <OverviewItem
            icon={Route}
            label="Entry Point"
            value={isEntryPoint ? "Yes" : "No"}
          />
        </div>
      </div>
    </section>
  );
}

function getFileDescription(
  file: CodeExplorerFile,
  role: string,
  layer: string
) {
  const fileName = getFileName(file.file);

  if (role === "Next.js Page") {
    return `${fileName} is a Next.js page responsible for part of the application's user-facing experience. It belongs to the ${layer.toLowerCase()} layer and serves as an application entry point.`;
  }

  if (role === "Next.js Layout") {
    return `${fileName} defines shared application layout structure for the Next.js application. It belongs to the ${layer.toLowerCase()} layer and provides structure around its child routes.`;
  }

  if (role === "API Route") {
    return `${fileName} contains API route logic responsible for handling application requests. It belongs to the ${layer.toLowerCase()} layer.`;
  }

  if (role === "React Component") {
    return `${fileName} contains reusable React UI logic. It belongs to the ${layer.toLowerCase()} layer and can be reused by other parts of the application.`;
  }

  if (role === "Utility / Service") {
    return `${fileName} contains reusable application logic. It belongs to the ${layer.toLowerCase()} layer and supports other parts of the codebase.`;
  }

  if (file.dependencies.length > 0) {
    return `${fileName} is a source file with ${file.dependencies.length} detected dependencies and ${file.symbols.length} indexed symbols. It belongs to the ${layer.toLowerCase()} layer.`;
  }

  return `${fileName} is part of the application's ${layer.toLowerCase()} layer. The analyzer has identified ${file.symbols.length} symbols in this file.`;
}

function OverviewItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileCode2;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card px-4 py-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />

        <span className="text-[10px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

function SymbolIntelligence({
  symbol,
  file,
  references,
}: {
  symbol: CodeExplorerSymbol;
  file: CodeExplorerFile;
  references: CodeExplorerReference[];
}) {
  const incomingReferences = references.filter(
    (reference) =>
      reference.target_file === file.file &&
      reference.target_symbol === symbol.name
  );

  const outgoingReferences = references.filter(
    (reference) =>
      reference.source_file === file.file &&
      reference.source_symbol === symbol.name
  );

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Braces className="h-4 w-4 text-primary" />

        <div>
          <h3 className="text-sm font-semibold">
            Symbol Intelligence
          </h3>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Understand how this symbol participates in the codebase.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background/50">
        {/* Symbol Header */}
        <div className="border-b px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-lg border bg-card px-3 py-2 text-sm font-semibold">
              {symbol.name}
            </code>

            {symbol.type && (
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {symbol.type}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>
              Defined in{" "}
              <span className="font-medium text-foreground">
                {getFileName(file.file)}
              </span>
            </span>

            {symbol.start_line && (
              <span>
                Lines{" "}
                <span className="font-medium text-foreground">
                  {symbol.start_line}
                  {symbol.end_line &&
                    symbol.end_line !== symbol.start_line
                    ? `–${symbol.end_line}`
                    : ""}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Relationship Stats */}
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
          <SymbolStat
            label="Incoming"
            value={incomingReferences.length}
          />

          <SymbolStat
            label="Outgoing"
            value={outgoingReferences.length}
          />

          <SymbolStat
            label="Total References"
            value={
              incomingReferences.length +
              outgoingReferences.length
            }
          />
        </div>

        {/* Used By */}
        {incomingReferences.length > 0 && (
          <div className="border-t px-5 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Used By
            </p>

            <div className="mt-3 space-y-2">
              {incomingReferences.map((reference, index) => (
                <div
                  key={`${reference.source_file}-${reference.source_symbol}-${index}`}
                  className="rounded-lg border bg-card px-3 py-3"
                >
                  <p className="text-xs font-medium">
                    {reference.source_symbol}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {getRelativePath(reference.source_file)}
                  </p>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Line {reference.line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calls / References */}
        {outgoingReferences.length > 0 && (
          <div className="border-t px-5 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              References
            </p>

            <div className="mt-3 space-y-2">
              {outgoingReferences.map((reference, index) => (
                <div
                  key={`${reference.target_file}-${reference.target_symbol}-${index}`}
                  className="rounded-lg border bg-card px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-xs font-medium">
                      {reference.target_symbol}
                    </code>

                    <span className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                      {reference.type}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {getRelativePath(reference.target_file)}
                  </p>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Line {reference.line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Relationships */}
        {incomingReferences.length === 0 &&
          outgoingReferences.length === 0 && (
            <div className="border-t px-5 py-5">
              <p className="text-xs text-muted-foreground">
                No cross-file symbol references were detected for
                this symbol.
              </p>
            </div>
          )}
      </div>
    </section>
  );
}

function SymbolStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-card px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold">
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

  const [selectedSymbol, setSelectedSymbol] =
    useState<CodeExplorerSymbol | null>(null);
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

        <FileOverview file={file} />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <Stat
    label="Symbols"
    value={file.symbols.length}
  />

  <Stat
    label="Dependencies"
    value={file.dependencies.length}
  />

  <Stat
    label="Dependents"
    value={dependents.length}
  />

  <Stat
    label="References"
    value={
      file.incoming_references +
      file.outgoing_references
    }
  />
</div>

<section>
  <div className="mb-3 flex items-center gap-2">
    <Layers3 className="h-4 w-4 text-primary" />

    <h3 className="text-sm font-semibold">
      Architecture Context
    </h3>
  </div>

  <div className="rounded-xl border bg-background/50 p-5">
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-lg border bg-card px-3 py-2 text-xs font-medium">
        {file.intelligence?.layer ?? "Other"}
      </span>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />

      <span className="rounded-lg border bg-card px-3 py-2 text-xs font-medium">
        {file.intelligence?.role ?? "Source File"}
      </span>

      {file.intelligence?.entry_point && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />

          <span className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
            Entry Point
          </span>
        </>
      )}
    </div>

    <p className="mt-4 text-xs leading-5 text-muted-foreground">
      This context is derived from the repository analyzer
      using the file's location, role, symbols, and detected
      relationships.
    </p>
  </div>
</section>

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

    <div>
      <h3 className="text-sm font-semibold">
        Symbols
      </h3>

      <p className="mt-0.5 text-xs text-muted-foreground">
        Functions, components, and other indexed symbols.
      </p>
    </div>
  </div>

  <div className="space-y-2">
    {file.symbols.map((symbol) => {
      const isSelected =
        selectedSymbol?.name === symbol.name &&
        selectedSymbol?.start_line === symbol.start_line;

      return (
        <button
          key={`${symbol.name}-${symbol.start_line}`}
          type="button"
          onClick={() => setSelectedSymbol(symbol)}
          className={[
            "w-full rounded-xl border px-4 py-3 text-left transition-colors",
            isSelected
              ? "border-primary/50 bg-primary/5"
              : "bg-background/50 hover:bg-accent",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <code className="text-xs font-medium">
                {symbol.name}
              </code>

              {symbol.start_line && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Line {symbol.start_line}
                  {symbol.end_line &&
                    symbol.end_line !== symbol.start_line
                    ? `–${symbol.end_line}`
                    : ""}
                </p>
              )}
            </div>

            {symbol.type && (
              <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                {symbol.type}
              </span>
            )}
          </div>
        </button>
      );
    })}
  </div>
</section>

{selectedSymbol && (
  <SymbolIntelligence
    symbol={selectedSymbol}
    file={file}
    references={references}
  />
)}

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
  const [selectedFile, setSelectedFile] = useState<CodeExplorerFile | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<CodeExplorerSymbol | null>(null);
  
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