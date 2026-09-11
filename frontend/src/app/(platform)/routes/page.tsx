import { PageHeader } from "@/components/layout/page-header";

export default function RoutesPage() {
  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Understand"
          title="Routes"
          description="Discover API routes, handlers, and the execution paths behind them."
        />

        <section className="mt-8 rounded-xl border bg-card p-8">
          <p className="text-sm font-medium">Route intelligence</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Route analysis will appear here after a repository is analyzed.
          </p>
        </section>
      </div>
    </main>
  );
}