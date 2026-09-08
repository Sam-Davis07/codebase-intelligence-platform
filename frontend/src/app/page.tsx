import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            CODEBASE INTELLIGENCE PLATFORM
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Understand your codebase.
          </h1>

          <p className="text-muted-foreground mt-3 max-w-lg">
            Analyze architecture, dependencies, code quality,
            routes, symbols, and execution relationships.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}