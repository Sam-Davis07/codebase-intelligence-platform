"use client";

import { motion } from "motion/react";
import {
  Boxes,
  FileCode2,
  Network,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ArchitectureStatsProps {
  totalLayers: number;
  totalFiles: number;
  totalRelationships: number;
  dominantLayer: string;
  dominantLayerPercentage: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  index: number;
}
function StatCard({
  label,
  value,
  description,
  icon: Icon,
  index,
}: StatCardProps) {
  const accents = [
    {
      icon: "bg-violet-500/10 text-violet-400",
      border: "hover:border-violet-500/40",
    },
    {
      icon: "bg-blue-500/10 text-blue-400",
      border: "hover:border-blue-500/40",
    },
    {
      icon: "bg-emerald-500/10 text-emerald-400",
      border: "hover:border-emerald-500/40",
    },
    {
      icon: "bg-amber-500/10 text-amber-400",
      border: "hover:border-amber-500/40",
    },
  ];

  const accent = accents[index % accents.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
      }}
      className={`group rounded-xl border border-border bg-card p-5 transition-all duration-200 ${accent.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

export function ArchitectureStats({
  totalLayers,
  totalFiles,
  totalRelationships,
  dominantLayer,
  dominantLayerPercentage,
}: ArchitectureStatsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Architectural Layers"
        value={totalLayers}
        description="Detected in your codebase"
        icon={Boxes}
        index={0}
      />

      <StatCard
        label="Total Files"
        value={totalFiles}
        description="Across all layers"
        icon={FileCode2}
        index={1}
      />

      <StatCard
        label="Layer Relationships"
        value={totalRelationships}
        description="Cross-layer dependencies"
        icon={Network}
        index={2}
      />

      <StatCard
        label="Dominant Layer"
        value={`${dominantLayerPercentage}%`}
        description={`${dominantLayer} files`}
        icon={TrendingUp}
        index={3}
      />
    </section>
  );
}