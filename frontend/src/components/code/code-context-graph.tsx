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
} from "@/lib/analysis";

interface CodeContextGraphProps {
  file: CodeExplorerFile;
  files: CodeExplorerFile[];
  references: CodeExplorerReference[];
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
  onSelectFile,
}: CodeContextGraphProps) {
  const graph = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeMap = new Map<string, Edge>();

    const selectedId = normalize(file.file);

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
          background: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
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

      edgeMap.set(id, {
        id,
        source: normalize(source),
        target: normalize(target),
        label,
        animated: label === "references",
        style: {
          strokeWidth: 1.5,
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
          File relationships
        </p>

        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Click a node to inspect it
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