"use client";

import { usePathname } from "next/navigation";
import { CheckCircle2, GitBranch } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/repositories": "Repositories",
  "/architecture": "Architecture",
  "/dependencies": "Dependencies",
  "/routes": "Routes",
  "/code": "Code Explorer",
  "/impact": "Impact Analysis",
  "/assistant": "AI Assistant",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();

  const title = pageTitles[pathname] ?? "Codebase Intelligence";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Page context */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-semibold">
            {title}
          </h1>

          <span className="hidden text-muted-foreground sm:inline">
            /
          </span>

          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            Codebase Intelligence
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Understand your repository structure and relationships.
        </p>
      </div>

      {/* Repository / analyzer status */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 sm:flex">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />

          <div>
            <p className="text-xs font-medium">Repository</p>
            <p className="text-[11px] text-muted-foreground">
              Local workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />

          <div className="hidden sm:block">
            <p className="text-xs font-medium">Analyzer</p>
            <p className="text-[11px] text-muted-foreground">
              Ready
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}