"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  index?: number;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  description,
  index = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
      }}
      className="group rounded-xl border bg-card p-5 transition-colors hover:bg-accent/30"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-2">
          <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>
      </div>

      {description && (
        <p className="mt-3 text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </motion.div>
  );
}