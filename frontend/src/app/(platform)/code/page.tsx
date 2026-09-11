import { PageHeader } from "@/components/layout/page-header";

export default function CodePage() {
  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Understand"
          title="Code Explorer"
          description="Explore files, symbols, functions, classes, and their relationships."
        />

        <section className="mt-8 rounded-xl border bg-card p-8">
          <p className="text-sm font-medium">Code explorer</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Repository files and symbols will appear here after analysis.
          </p>
        </section>
      </div>
    </main>
  );
}