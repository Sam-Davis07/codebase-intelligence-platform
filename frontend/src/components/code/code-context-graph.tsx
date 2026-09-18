"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useMemo } from "react";

import type {
  CodeExplorerFile,
  CodeExplorerReference,
  CodeExplorerSymbol,
} from "@/lib/analysis";

interface CodeContextGraphProps {
  file: CodeExplorerFile;
  files: CodeExplorerFile[];
  references: CodeExplorerReference[];
  selectedSymbol?: CodeExplorerSymbol | null;
  onSelectFile: (file: CodeExplorerFile) => void;
}

function normalize(file: string) {
  return file.replaceAll("\\", "/");
}

function getFileName(file: string) {
  return normalize(file).split("/").pop() ?? file;
}

function getRelativePath(file: string) {
  const normalized = normalize(file);

  const srcIndex = normalized.indexOf("/src/");

  if (srcIndex !== -1) {
    return normalized.slice(srcIndex + 1);
  }

  return normalized;
}

export function CodeContextGraph({
  file,
  files,
  references,
  selectedSymbol,
  onSelectFile,
}: CodeContextGraphProps) {
  const graph = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeMap = new Map<string, Edge>();

    const selectedId = normalize(file.file);

    const selectedSymbolReferences = selectedSymbol
  ? references.filter(
      (reference) =>
        (
          reference.source_file === file.file &&
          reference.source_symbol === selectedSymbol.name
        ) ||
        (
          reference.target_file === file.file &&
          reference.target_symbol === selectedSymbol.name
        )
    )
  : [];

  const highlightedFiles = new Set<string>([
  selectedId,
]);

selectedSymbolReferences.forEach((reference) => {
  highlightedFiles.add(
    normalize(reference.source_file)
  );

  highlightedFiles.add(
    normalize(reference.target_file)
  );
});

    nodeMap.set(selectedId, {
      id: selectedId,
      position: { x: 0, y: 160 },
      data: {
        label: getFileName(file.file),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        width: 230,
        borderRadius: 14,
        padding: 14,
        fontSize: 12,
        fontWeight: 600,
        background: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
        border: "1px solid hsl(var(--primary))",
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
      },
    });

    const imports = Array.from(
      new Set(
        file.dependencies
          .map((dependency) => dependency.resolved_file)
          .filter(
            (dependency): dependency is string =>
              Boolean(dependency)
          )
      )
    );

    const dependents = Array.from(
      new Set(
        files
          .filter((candidate) =>
            candidate.dependencies.some(
              (dependency) =>
                dependency.resolved_file === file.file
            )
          )
          .map((candidate) => candidate.file)
      )
    );

    const outgoingReferences = Array.from(
      new Set(
        references
          .filter(
            (reference) =>
              reference.source_file === file.file
          )
          .map((reference) => reference.target_file)
      )
    );

    const incomingReferences = Array.from(
      new Set(
        references
          .filter(
            (reference) =>
              reference.target_file === file.file
          )
          .map((reference) => reference.source_file)
      )
    );

    const addNode = (
      filePath: string,
      position: { x: number; y: number },
      kind: string
    ) => {
      const id = normalize(filePath);

      if (nodeMap.has(id)) {
        return;
      }

      const nodeId = normalize(filePath);

      const isHighlighted =
        !selectedSymbol ||
        highlightedFiles.has(nodeId);

      nodeMap.set(id, {
  id,
  position,
  data: {
    label: getFileName(filePath),
  },
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  style: {
    width: 210,
    borderRadius: 12,
    padding: 12,
    fontSize: 11,
    background: isHighlighted
      ? "hsl(var(--card))"
      : "hsl(var(--muted))",
    color: isHighlighted
      ? "hsl(var(--foreground))"
      : "hsl(var(--muted-foreground))",
    border: isHighlighted
      ? "1px solid hsl(var(--primary) / 0.45)"
      : "1px solid hsl(var(--border))",
    boxShadow: isHighlighted
      ? "0 6px 22px rgba(0,0,0,0.12)"
      : "none",
    opacity: isHighlighted ? 1 : 0.42,
    transition:
      "opacity 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
  },
});

      void kind;
    };

    const addEdge = (
  source: string,
  target: string,
  label: string
) => {
  const id = `${source}-${target}-${label}`;

  if (edgeMap.has(id)) {
    return;
  }

  const normalizedSource = normalize(source);
  const normalizedTarget = normalize(target);

  const isHighlighted =
    !selectedSymbol ||
    (
      highlightedFiles.has(normalizedSource) &&
      highlightedFiles.has(normalizedTarget)
    );

  edgeMap.set(id, {
    id,
    source: normalizedSource,
    target: normalizedTarget,
    label,
    animated:
      selectedSymbol
        ? isHighlighted
        : label === "references",
    style: {
      strokeWidth: isHighlighted ? 2.4 : 1,
      opacity: isHighlighted ? 1 : 0.2,
      transition:
        "opacity 180ms ease, stroke-width 180ms ease",
    },
  });
};

    imports.forEach((dependency, index) => {
      addNode(
        dependency,
        {
          x: 360,
          y: 40 + index * 100,
        },
        "import"
      );

      addEdge(file.file, dependency, "imports");
    });

    dependents.forEach((dependent, index) => {
      addNode(
        dependent,
        {
          x: -320,
          y: 40 + index * 100,
        },
        "dependent"
      );

      addEdge(dependent, file.file, "depends on");
    });

    outgoingReferences.forEach((target, index) => {
      addNode(
        target,
        {
          x: 700,
          y: 40 + index * 100,
        },
        "reference"
      );

      addEdge(file.file, target, "references");
    });

    incomingReferences.forEach((source, index) => {
      addNode(
        source,
        {
          x: -640,
          y: 40 + index * 100,
        },
        "reference"
      );

      addEdge(source, file.file, "references");
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
    };
  }, [file, files, references]);

  const fileLookup = useMemo(() => {
    return new Map(
      files.map((candidate) => [
        normalize(candidate.file),
        candidate,
      ])
    );
  }, [files]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    const selected = fileLookup.get(node.id);

    if (selected) {
      onSelectFile(selected);
    }
  };

  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border bg-background">
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border bg-card/90 px-3 py-2 backdrop-blur">
  <p className="text-xs font-medium">
    {selectedSymbol
      ? "Symbol relationships"
      : "File relationships"}
  </p>

  <p className="mt-0.5 text-[11px] text-muted-foreground">
    {selectedSymbol
      ? `Showing relationships for ${selectedSymbol.name}`
      : "Click a node to inspect it"}
  </p>
</div>

      <ReactFlow
  colorMode={
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  }
        nodes={graph.nodes}
        edges={graph.edges}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1,
        }}
        minZoom={0.25}
        maxZoom={1.5}
        onNodeClick={handleNodeClick}
      >
        <Background gap={18} size={1} />

        <Controls
  showInteractive
  className="!border-border !bg-card !shadow-lg [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button:hover]:!bg-accent [&>button:hover]:!text-foreground"
/>

<MiniMap
  pannable
  zoomable
  nodeStrokeWidth={3}
  className="!border-border !bg-card !shadow-lg"
/>
      </ReactFlow>
    </div>
  );
}