"use client";

import { motion } from "motion/react";
import { Activity } from "lucide-react";

interface HealthCardProps {
  overallScore: number;
  components: {
    complexity: number;
    code_smells: number;
    maintainability: number;
    architecture: number;
  };
}

const healthMetrics = [
  {
    key: "complexity",
    label: "Complexity",
  },
  {
    key: "code_smells",
    label: "Code Smells",
  },
  {
    key: "maintainability",
    label: "Maintainability",
  },
  {
    key: "architecture",
    label: "Architecture",
  },
] as const;

export function HealthCard({
  overallScore,
  components,
}: HealthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border bg-card p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />

            <h2 className="text-sm font-semibold">
              Codebase Health
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Overall quality based on analyzer metrics.
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-semibold tracking-tight">
            {overallScore}
          </p>

          <p className="text-xs text-muted-foreground">
            / 100
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {healthMetrics.map((metric, index) => {
          const value = components[metric.key];

          return (
            <div key={metric.key}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {metric.label}
                </span>

                <span className="text-xs font-medium">
                  {value}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.08,
                  }}
                  className="h-full rounded-full bg-foreground"
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}