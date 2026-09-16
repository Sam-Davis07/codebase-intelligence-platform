"use client";

import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({
  message = "Loading...",
}: PageLoaderProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Loader2 className="h-6 w-6 text-muted-foreground" />
        </motion.div>

        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}