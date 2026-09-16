"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  Position,
} from "@xyflow/react";

interface LayerRelationship {
  source_layer: string;
  target_layer: string;
  dependency_count: number;
}

interface ArchitectureGraphProps {
  layerCounts: Record<string, number>;
  relationships: LayerRelationship[];
}

const layerStyles: Record<
  string,
  {
    border: string;
    icon: string;
    glow: string;
  }
> = {
  configuration: {
    border: "border-blue-500/60",
    icon: "text-blue-400",
    glow: "shadow-blue-500/10",
  },
  presentation: {
    border: "border-violet-500/60",
    icon: "text-violet-400",
    glow: "shadow-violet-500/10",
  },
  api: {
    border: "border-emerald-500/60",
    icon: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  shared: {
    border: "border-amber-500/60",
    icon: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
};

function ArchitectureNode({
  data,
}: {
  data: {
    label: string;
    files: number;
    style: (typeof layerStyles)[string];
  };
}) {
  return (
    <div
      className={`min-w-[190px] rounded-xl border bg-card px-4 py-3 shadow-xl ${data.style.border} ${data.style.glow}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${data.style.icon}`}>
            {data.label}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Architectural layer
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold">
            {data.files}
          </p>

          <p className="text-[10px] text-muted-foreground">
            files
          </p>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  architecture: ArchitectureNode,
};

export function ArchitectureGraph({
  layerCounts,
  relationships,
}: ArchitectureGraphProps) {
  const layers = Object.keys(layerCounts);

  const nodes: Node[] = layers.map((layer, index) => {
    const normalizedLayer = layer.toLowerCase();

    const positions = [
      { x: 80, y: 80 },
      { x: 380, y: 80 },
      { x: 680, y: 80 },
      { x: 380, y: 280 },
      { x: 680, y: 280 },
      { x: 80, y: 280 },
    ];

    return {
      id: layer,
      type: "architecture",
      position:
        positions[index] ?? {
          x: 80 + (index % 3) * 300,
          y: 80 + Math.floor(index / 3) * 200,
        },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label: layer,
        files: layerCounts[layer],
        style:
          layerStyles[normalizedLayer] ??
          {
            border: "border-primary/50",
            icon: "text-primary",
            glow: "shadow-primary/10",
          },
      },
    };
  });

  const edges: Edge[] = relationships.map(
    (relationship, index) => ({
      id: `${relationship.source_layer}-${relationship.target_layer}-${index}`,
      source: relationship.source_layer,
      target: relationship.target_layer,
      type: "smoothstep",
      animated: true,
      label: `${relationship.dependency_count} deps`,
      style: {
        stroke: "hsl(var(--muted-foreground))",
        strokeWidth: 1.5,
      },
      labelStyle: {
        fill: "hsl(var(--muted-foreground))",
        fontSize: 11,
      },
      labelBgStyle: {
        fill: "hsl(var(--card))",
        fillOpacity: 0.9,
      },
    })
  );

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold">
          Architecture Structure
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Interactive map of architectural layers and their
          dependencies.
        </p>
      </div>

      <div className="h-[520px] overflow-hidden rounded-lg border bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.25,
          }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          proOptions={{
            hideAttribution: true,
          }}
        >
          <Background gap={20} size={1} />

          <Controls />

          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => {
              const layer =
                node.data?.label?.toString().toLowerCase();

              if (layer === "configuration") {
                return "#3b82f6";
              }

              if (layer === "presentation") {
                return "#8b5cf6";
              }

              if (layer === "api") {
                return "#10b981";
              }

              if (layer === "shared") {
                return "#f59e0b";
              }

              return "#71717a";
            }}
          />
        </ReactFlow>
      </div>
    </section>
  );
}