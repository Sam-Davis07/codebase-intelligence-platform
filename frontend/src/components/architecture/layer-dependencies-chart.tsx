"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LayerRelationship {
  source_layer: string;
  target_layer: string;
  dependency_count: number;
}

interface LayerDependenciesChartProps {
  relationships: LayerRelationship[];
}

const barColors = [
  "#f47287",
  "#a855f7",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      dependencies: number;
    };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground">
        {item.name}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {item.dependencies} dependencies
      </p>
    </div>
  );
}

export function LayerDependenciesChart({
  relationships,
}: LayerDependenciesChartProps) {
  const data = relationships.map((relationship) => ({
    name: `${relationship.source_layer} → ${relationship.target_layer}`,
    dependencies: relationship.dependency_count,
  }));

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            </div>

            <div>
              <h2 className="text-sm font-semibold">
                Layer Dependencies
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Number of dependencies between layers.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border px-2.5 py-1.5">
          <span className="text-xs font-medium">
            {relationships.length} relationships
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 h-[250px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No layer dependencies detected.
            </p>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 8,
                right: 35,
                left: 5,
                bottom: 5,
              }}
              barCategoryGap={22}
            >
              <CartesianGrid
                horizontal={false}
                stroke="var(--border)"
                strokeDasharray="3 4"
                opacity={0.5}
              />

              <XAxis
                type="number"
                allowDecimals={false}
                domain={[0, "dataMax + 1"]}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={145}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: "var(--muted)",
                  opacity: 0.25,
                }}
              />

              <Bar
                dataKey="dependencies"
                radius={[0, 5, 5, 0]}
                barSize={24}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={
                      barColors[
                        index % barColors.length
                      ]
                    }
                  />
                ))}

                <LabelList
                  dataKey="dependencies"
                  position="right"
                  fill="var(--foreground)"
                  fontSize={11}
                  fontWeight={500}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}