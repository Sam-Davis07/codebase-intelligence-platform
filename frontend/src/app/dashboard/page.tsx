const stats = [
  {
    label: "Files",
    value: "5",
  },
  {
    label: "Functions",
    value: "4",
  },
  {
    label: "Quality Score",
    value: "93",
  },
  {
    label: "Code Smells",
    value: "1",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">
            REPOSITORY
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Codebase Overview
          </h1>

          <p className="text-muted-foreground mt-1">
            Understand the structure and health of your repository.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-5"
            >
              <p className="text-sm text-muted-foreground">
                {stat.label}
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold">
              Architecture
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Explore how the repository is organized into
              architectural layers.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold">
              Dependency Graph
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Understand how files depend on each other.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}