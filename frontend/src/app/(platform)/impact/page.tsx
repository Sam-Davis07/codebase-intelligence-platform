import { PageHeader } from "@/components/layout/page-header";

export default function ImpactPage() {
  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Understand"
          title="Impact Analysis"
          description="Understand what could be affected when a symbol or file changes."
        />

        <section className="mt-8 rounded-xl border bg-card p-8">
          <p className="text-sm font-medium">Change impact</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Impact relationships will appear here after analysis.
          </p>
        </section>
      </div>
    </main>
  );
}