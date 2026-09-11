import { PageHeader } from "@/components/layout/page-header";

export default function ArchitecturePage() {
  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Understand"
          title="Architecture"
          description="Explore the architectural layers and relationships that make up your codebase."
        />

        <section className="mt-8 rounded-xl border bg-card p-8">
          <p className="text-sm font-medium">
            Architecture analysis
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Architecture insights will appear here once a repository is analyzed.
          </p>
        </section>
      </div>
    </main>
  );
}