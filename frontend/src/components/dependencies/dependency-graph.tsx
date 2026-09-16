"use client";

import { useMemo, useState } from "react";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import type {
  DependencyEdge,
  DependencyFileMetric,
  DependencyNode,
} from "@/lib/analysis";

interface DependencyGraphProps {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  files: DependencyFileMetric[];
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type FileNodeData = {
  file: string;
  fanIn: number;
  fanOut: number;
  selected: boolean;
  label: string;
  directory: string;
};

type FileFlowNode = Node<FileNodeData, "file">;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizePath(file: string): string {
  return file.replaceAll("\\", "/");
}

function getFileName(file: string): string {
  const normalized = normalizePath(file);

  return normalized.split("/").at(-1) ?? file;
}

function getDirectory(file: string): string {
  const normalized = normalizePath(file);
  const parts = normalized.split("/");

  if (parts.length <= 1) {
    return "";
  }

  return parts.slice(-3, -1).join("/");
}

/* -------------------------------------------------------------------------- */
/* Custom Node                                                                */
/* -------------------------------------------------------------------------- */

function FileNode({
  data,
}: NodeProps<FileFlowNode>) {
  const extension =
    getFileName(data.file)
      .split(".")
      .at(-1)
      ?.slice(0, 3)
      .toUpperCase() ?? "FILE";

  return (
    <div
      className={`relative min-w-[190px] rounded-xl border bg-card px-3.5 py-3 shadow-lg transition-all duration-200 ${
        data.selected
          ? "border-foreground ring-2 ring-foreground/10"
          : "border-border hover:border-foreground/30"
      }`}
    >
      {/* Incoming dependency handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-2 !border-background !bg-muted-foreground"
      />

      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            data.selected
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span className="text-[10px] font-bold">
            {extension}
          </span>
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">
            {data.label}
          </p>

          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {data.directory || "root"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-2.5">
        <div>
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            In
          </p>

          <p className="text-xs font-semibold">
            {data.fanIn}
          </p>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Out
          </p>

          <p className="text-xs font-semibold">
            {data.fanOut}
          </p>
        </div>
      </div>

      {/* Outgoing dependency handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
}

/*
 * Keep nodeTypes outside the component.
 * This is the recommended React Flow pattern.
 */
const nodeTypes = {
  file: FileNode,
};

/* -------------------------------------------------------------------------- */
/* Graph Layout                                                               */
/* -------------------------------------------------------------------------- */

function createLayout(
  graphNodes: DependencyNode[],
  graphEdges: DependencyEdge[],
  files: DependencyFileMetric[]
): FileFlowNode[] {
  const metrics = new Map<string, DependencyFileMetric>(
    files.map((file) => [file.file, file])
  );

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const node of graphNodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }

  for (const edge of graphEdges) {
    if (!outgoing.has(edge.source)) {
      outgoing.set(edge.source, []);
    }

    if (!incoming.has(edge.target)) {
      incoming.set(edge.target, []);
    }

    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
  }

  /*
   * Determine graph levels.
   *
   * Files with no incoming dependencies are placed at level 0.
   * Their dependencies are progressively placed to the right.
   */
  const levels = new Map<string, number>();

  const roots = graphNodes.filter(
    (node) =>
      (incoming.get(node.id)?.length ?? 0) === 0
  );

  const queue: string[] = roots.map(
    (node) => node.id
  );

  for (const root of queue) {
    levels.set(root, 0);
  }

  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex++;

    const currentLevel =
      levels.get(current) ?? 0;

    const children =
      outgoing.get(current) ?? [];

    for (const child of children) {
      const nextLevel = currentLevel + 1;

      const existingLevel =
        levels.get(child);

      if (
        existingLevel === undefined ||
        nextLevel > existingLevel
      ) {
        levels.set(child, nextLevel);
      }

      if (!queue.includes(child)) {
        queue.push(child);
      }
    }
  }

  /*
   * Any disconnected or cyclic node that wasn't reached
   * gets placed at level 0.
   */
  for (const node of graphNodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  }

  /*
   * Group nodes by graph level.
   */
  const grouped = new Map<
    number,
    DependencyNode[]
  >();

  for (const node of graphNodes) {
    const level =
      levels.get(node.id) ?? 0;

    const existing =
      grouped.get(level);

    if (existing) {
      existing.push(node);
    } else {
      grouped.set(level, [node]);
    }
  }

  const result: FileFlowNode[] = [];

  /*
   * Create React Flow nodes.
   */
  for (const [level, levelNodes] of grouped) {
    levelNodes.sort((a, b) => {
      const aMetric = metrics.get(a.id);
      const bMetric = metrics.get(b.id);

      return (
        (bMetric?.fan_in ?? 0) -
        (aMetric?.fan_in ?? 0)
      );
    });

    levelNodes.forEach((node, index) => {
      const metric = metrics.get(node.id);

      result.push({
        id: node.id,

        type: "file",

        position: {
          x: level * 300,
          y: index * 150,
        },

        data: {
          file: node.id,
          label: getFileName(node.id),
          directory: getDirectory(node.id),
          fanIn: metric?.fan_in ?? 0,
          fanOut: metric?.fan_out ?? 0,
          selected: false,
        },
      });
    });
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Dependency Graph                                                           */
/* -------------------------------------------------------------------------- */

export function DependencyGraph({
  nodes: graphNodes,
  edges: graphEdges,
  files,
}: DependencyGraphProps) {
  const [selectedFile, setSelectedFile] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  /*
   * File metrics lookup.
   */
  const metrics = useMemo(
    () =>
      new Map<string, DependencyFileMetric>(
        files.map((file) => [
          file.file,
          file,
        ])
      ),
    [files]
  );

  /*
   * Create graph nodes.
   */
  const initialNodes = useMemo(
    () =>
      createLayout(
        graphNodes,
        graphEdges,
        files
      ),
    [graphNodes, graphEdges, files]
  );

  /*
   * Search filtering.
   */
  const filteredNodes = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return initialNodes;
    }

    return initialNodes.map((node) => {
      const normalized =
        normalizePath(
          node.data.file
        ).toLowerCase();

      return {
        ...node,
        hidden: !normalized.includes(query),
      };
    });
  }, [initialNodes, search]);

  /*
   * Selected file metrics.
   */
  const selectedMetric = selectedFile
    ? metrics.get(selectedFile)
    : undefined;

  /*
   * Selected node.
   */
  const selectedNode = selectedFile
    ? initialNodes.find(
        (node) => node.id === selectedFile
      )
    : undefined;

  /*
   * Build graph edges.
   */
  const flowEdges = useMemo<Edge[]>(() => {
    return graphEdges.map((edge) => {
      const isConnected =
        selectedFile === null ||
        edge.source === selectedFile ||
        edge.target === selectedFile;

      return {
        id: `${edge.source}->${edge.target}`,

        source: edge.source,

        target: edge.target,

        type: "smoothstep",

        animated:
          selectedFile !== null &&
          isConnected,

        style: {
          stroke: isConnected
            ? "var(--foreground)"
            : "var(--border)",

          strokeWidth:
            selectedFile !== null &&
            isConnected
              ? 2
              : 1,

          opacity:
            selectedFile !== null &&
            !isConnected
              ? 0.2
              : 1,
        },
      };
    });
  }, [graphEdges, selectedFile]);

  /*
   * Mark selected node.
   */
  const finalNodes = filteredNodes.map(
    (node) => ({
      ...node,

      data: {
        ...node.data,

        selected:
          node.id === selectedFile,
      },
    })
  );

  /*
   * Files selectedFile depends on.
   */
  const dependencies = selectedFile
    ? graphEdges
        .filter(
          (edge) =>
            edge.source === selectedFile
        )
        .map((edge) => edge.target)
    : [];

  /*
   * Files depending on selectedFile.
   */
  const dependents = selectedFile
    ? graphEdges
        .filter(
          (edge) =>
            edge.target === selectedFile
        )
        .map((edge) => edge.source)
    : [];

    const handleNodeClick: NodeMouseHandler = (_, node) => {
  setSelectedFile(node.id);
};
  return (
    <div className="relative h-[680px] overflow-hidden rounded-xl border border-border bg-background">
      <ReactFlow
        nodes={finalNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
        minZoom={0.15}
        maxZoom={2}
        onNodeClick={handleNodeClick}
        onPaneClick={() => {
          setSelectedFile(null);
        }}
        proOptions={{
          hideAttribution: true,
        }}
      >
        {/* Background */}
        <Background
          gap={20}
          size={1}
          color="var(--border)"
        />

        {/* Zoom controls */}
        <Controls
          position="bottom-left"
          showInteractive={false}
        />

        {/* Minimap */}
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor="var(--muted-foreground)"
          maskColor="var(--background)"
        />

        {/* ---------------------------------------------------------------- */}
        {/* Search                                                           */}
        {/* ---------------------------------------------------------------- */}

        <Panel
          position="top-left"
          className="!m-4"
        >
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur">
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
              }}
              placeholder="Search files..."
              className="h-9 w-[240px] bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground"
            />

            {search.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                }}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </Panel>

        {/* ---------------------------------------------------------------- */}
        {/* Graph statistics                                                 */}
        {/* ---------------------------------------------------------------- */}

        <Panel
          position="top-right"
          className="!m-4"
        >
          <div className="rounded-xl border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Nodes
                </p>

                <p className="text-xs font-semibold">
                  {graphNodes.length}
                </p>
              </div>

              <div className="h-6 w-px bg-border" />

              <div>
                <p className="text-[10px] text-muted-foreground">
                  Relationships
                </p>

                <p className="text-xs font-semibold">
                  {graphEdges.length}
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {/* ---------------------------------------------------------------- */}
        {/* Selected file details                                            */}
        {/* ---------------------------------------------------------------- */}

        {selectedFile &&
          selectedNode && (
            <Panel
              position="bottom-right"
              className="!m-4"
            >
              <div className="w-[310px] rounded-xl border border-border bg-card p-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {getFileName(
                        selectedFile
                      )}
                    </p>

                    <p className="mt-1 break-all text-[10px] text-muted-foreground">
                      {normalizePath(
                        selectedFile
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close file details"
                    onClick={() => {
                      setSelectedFile(null);
                    }}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    ×
                  </button>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border p-2.5">
                    <p className="text-[10px] text-muted-foreground">
                      Fan-in
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedMetric?.fan_in ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-2.5">
                    <p className="text-[10px] text-muted-foreground">
                      Fan-out
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedMetric?.fan_out ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-2.5">
                    <p className="text-[10px] text-muted-foreground">
                      Connections
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedMetric?.total_connections ??
                        0}
                    </p>
                  </div>
                </div>

                {/* Dependencies */}
                <div className="mt-4">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Dependencies
                  </p>

                  {dependencies.length >
                  0 ? (
                    <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                      {dependencies.map(
                        (file) => (
                          <button
                            key={file}
                            type="button"
                            onClick={() => {
                              setSelectedFile(
                                file
                              );
                            }}
                            className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            {getFileName(
                              file
                            )}
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No internal dependencies.
                    </p>
                  )}
                </div>

                {/* Dependents */}
                <div className="mt-4">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Dependents
                  </p>

                  {dependents.length >
                  0 ? (
                    <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                      {dependents.map(
                        (file) => (
                          <button
                            key={file}
                            type="button"
                            onClick={() => {
                              setSelectedFile(
                                file
                              );
                            }}
                            className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            {getFileName(
                              file
                            )}
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No internal dependents.
                    </p>
                  )}
                </div>
              </div>
            </Panel>
          )}
      </ReactFlow>
    </div>
  );
}