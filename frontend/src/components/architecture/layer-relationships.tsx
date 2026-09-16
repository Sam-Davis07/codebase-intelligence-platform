"use client";

import { motion } from "motion/react";
import { ArrowDown, Network } from "lucide-react";

interface LayerFile {
  source: string;
  target: string;
}

interface LayerRelationship {
  source_layer: string;
  target_layer: string;
  dependency_count: number;
  files: LayerFile[];
}

interface LayerRelationshipsProps {
  totalRelationships: number;
  relationships: LayerRelationship[];
}

export function LayerRelationships({
  totalRelationships,
  relationships,
}: LayerRelationshipsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border bg-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-muted-foreground" />

            <h2 className="text-sm font-semibold">
              Layer Relationships
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Dependencies between architectural layers.
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-semibold">
            {totalRelationships}
          </p>

          <p className="text-xs text-muted-foreground">
            relationships
          </p>
        </div>
      </div>

      {relationships.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium">
            No layer relationships detected
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            The analyzer did not find dependencies between architectural
            layers.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {relationships.map((relationship, index) => (
            <motion.div
              key={`${relationship.source_layer}-${relationship.target_layer}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
              }}
              className="rounded-lg border bg-background p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-md border px-3 py-1.5 text-xs font-medium capitalize">
                    {relationship.source_layer}
                  </span>

                  <ArrowDown className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="rounded-md border px-3 py-1.5 text-xs font-medium capitalize">
                    {relationship.target_layer}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground">
                  {relationship.dependency_count} dependencies
                </span>
              </div>

              {relationship.files.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    File relationships
                  </p>

                  <div className="space-y-2">
                    {relationship.files
                      .slice(0, 5)
                      .map((file) => (
                        <div
                          key={`${file.source}-${file.target}`}
                          className="flex flex-col gap-1 rounded-md border bg-card px-3 py-2 font-mono text-[11px] sm:flex-row sm:items-center"
                        >
                          <span className="truncate text-muted-foreground">
                            {file.source}
                          </span>

                          <ArrowDown className="hidden h-3 w-3 shrink-0 text-muted-foreground sm:block" />

                          <span className="truncate">
                            {file.target}
                          </span>
                        </div>
                      ))}

                    {relationship.files.length > 5 && (
                      <p className="pt-1 text-xs text-muted-foreground">
                        + {relationship.files.length - 5} more file
                        relationships
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}