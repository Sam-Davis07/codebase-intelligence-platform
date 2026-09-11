"use client";

import { motion } from "motion/react";
import {
  Code2,
  FileCode2,
  FunctionSquare,
  Gauge,
  GitBranch,
} from "lucide-react";

interface RepositoryOverviewProps {
  name: string;
  language?: string;
  files: number;
  functions: number;
  qualityScore: number;
}

export function RepositoryOverview({
  name,
  language,
  files,
  functions,
  qualityScore,
}: RepositoryOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border bg-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <h2 className="text-base font-semibold">
              {name}
            </h2>

            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Code2 className="h-3.5 w-3.5" />
              <span>{language ?? "Unknown language"}</span>
            </div>
          </div>
        </div>

        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          Analyzed
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <RepositoryStat
          icon={FileCode2}
          label="Files"
          value={files}
        />

        <RepositoryStat
          icon={FunctionSquare}
          label="Functions"
          value={functions}
        />

        <RepositoryStat
          icon={Gauge}
          label="Quality"
          value={`${qualityScore}/100`}
        />
      </div>
    </motion.div>
  );
}

function RepositoryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileCode2;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}