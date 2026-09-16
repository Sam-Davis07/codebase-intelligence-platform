"use client";

import { motion } from "motion/react";
import {
  Boxes,
  FileCode2,
  Layers3,
} from "lucide-react";

interface ArchitectureOverviewProps {
  totalLayers: number;
  layerCounts: Record<string, number>;
  layers: Record<string, string[]>;
}

export function ArchitectureOverview({
  totalLayers,
  layerCounts,
  layers,
}: ArchitectureOverviewProps) {
  const layerEntries = Object.entries(layerCounts);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border bg-card p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-muted-foreground" />

              <h2 className="text-sm font-semibold">
                Architecture Overview
              </h2>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Layers detected from the repository structure.
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold">
              {totalLayers}
            </p>

            <p className="text-xs text-muted-foreground">
              layers
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {layerEntries.map(([layer, count], index) => (
            <motion.div
              key={layer}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.06,
              }}
              className="rounded-lg border bg-background p-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers3 className="h-4 w-4" />

                <span className="text-xs capitalize">
                  {layer}
                </span>
              </div>

              <p className="mt-2 text-xl font-semibold">
                {count}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                files
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(layers).map(
          ([layer, files], index) => (
            <motion.div
              key={layer}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.06,
              }}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold capitalize">
                    {layer}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {files.length} files
                  </p>
                </div>

                <FileCode2 className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="mt-4 space-y-2">
                {files.slice(0, 8).map((file) => (
                  <div
                    key={file}
                    className="rounded-md border bg-background px-3 py-2"
                  >
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {file}
                    </p>
                  </div>
                ))}

                {files.length > 8 && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    + {files.length - 8} more files
                  </p>
                )}
              </div>
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}