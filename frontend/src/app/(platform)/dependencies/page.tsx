import { PageHeader } from "@/components/layout/page-header";

export default function DependenciesPage() {
  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Understand"
          title="Dependencies"
          description="Explore how files and modules depend on each other."
        />

        <section className="mt-8 rounded-xl border bg-card p-8">
          <p className="text-sm font-medium">Dependency graph</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Dependency relationships will appear here after analysis.
          </p>
        </section>
      </div>
    </main>
  );
}