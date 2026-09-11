import { PageHeader } from "@/components/layout/page-header";

export default function AssistantPage() {
  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="System"
          title="AI Assistant"
          description="Ask questions about your codebase and understand how different parts of the system work."
        />

        <section className="mt-8 rounded-xl border bg-card p-8">
          <p className="text-sm font-medium">AI codebase assistant</p>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-powered codebase questions will be available after the
            intelligence pipeline is connected.
          </p>
        </section>
      </div>
    </main>
  );
}