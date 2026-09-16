"use client";

import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
} from "recharts";

interface ArchitectureChartProps {
  layerCounts: Record<string, number>;
}

interface ChartItem {
  name: string;
  value: number;
}

interface ActiveShapeProps {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
}

const layerColors = [
  "#3b82f6",
  "#a855f7",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

function renderActiveShape(props: ActiveShapeProps) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = "#ffffff",
  } = props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="#ffffff"
      strokeWidth={2}
    />
  );
}

export function ArchitectureChart({
  layerCounts,
}: ArchitectureChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(
    null
  );

  const data: ChartItem[] = Object.entries(layerCounts).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const totalFiles = data.reduce(
    (total, item) => total + item.value,
    0
  );

  const activeItem =
    activeIndex !== null ? data[activeIndex] : null;

  const activePercentage =
    activeItem && totalFiles > 0
      ? Math.round(
          (activeItem.value / totalFiles) * 100
        )
      : 0;

  const activeColor =
    activeIndex !== null
      ? layerColors[
          activeIndex % layerColors.length
        ]
      : undefined;

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
            </div>

            <div>
              <h2 className="text-sm font-semibold">
                Architecture Composition
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Distribution of files across architectural layers.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border px-2.5 py-1.5">
          <span className="text-xs font-medium">
            {totalFiles} files
          </span>
        </div>
      </div>

      {/* Chart + Legend */}
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_170px] items-center gap-5">
        {/* Pie */}
        <div className="relative h-[250px] min-w-0">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                stroke="none"
                activeIndex={
                  activeIndex === null
                    ? undefined
                    : activeIndex
                }
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => {
                  setActiveIndex(index);
                }}
                onMouseLeave={() => {
                  setActiveIndex(null);
                }}
              >
                {data.map((entry, index) => {
                  const isActive =
                    activeIndex === index;

                  const hasActive =
                    activeIndex !== null;

                  return (
                    <Cell
                      key={entry.name}
                      fill={
                        layerColors[
                          index % layerColors.length
                        ]
                      }
                      opacity={
                        hasActive && !isActive
                          ? 0.25
                          : 1
                      }
                      style={{
                        transition:
                          "opacity 200ms ease",
                        cursor: "pointer",
                      }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Dynamic center */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {activeItem ? (
                <>
                  <p
                    className="text-base font-semibold capitalize transition-colors duration-200"
                    style={{
                      color: activeColor,
                    }}
                  >
                    {activeItem.name}
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {activeItem.value}
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    files · {activePercentage}%
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold tracking-tight">
                    {totalFiles}
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Total Files
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage =
              totalFiles > 0
                ? Math.round(
                    (item.value / totalFiles) * 100
                  )
                : 0;

            const isActive =
              activeIndex === index;

            const hasActive =
              activeIndex !== null;

            return (
              <div
                key={item.name}
                onMouseEnter={() =>
                  setActiveIndex(index)
                }
                onMouseLeave={() =>
                  setActiveIndex(null)
                }
                className={`group flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-2.5 py-2 transition-all duration-200 ${
                  isActive
                    ? "border-border bg-accent"
                    : hasActive
                      ? "border-transparent opacity-45"
                      : "border-transparent hover:bg-accent/50"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200"
                    style={{
                      backgroundColor:
                        layerColors[
                          index % layerColors.length
                        ],
                      transform: isActive
                        ? "scale(1.35)"
                        : "scale(1)",
                    }}
                  />

                  <div className="min-w-0">
                    <p
                      className={`truncate text-xs font-medium capitalize ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      {item.value} files
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-medium ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}