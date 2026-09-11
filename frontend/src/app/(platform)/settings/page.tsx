import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="System"
          title="Settings"
          description="Configure your Codebase Intelligence Platform workspace."
        />

        <section className="mt-8 rounded-xl border bg-card p-8">
          <p className="text-sm font-medium">Workspace settings</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Configuration options will be added as the platform develops.
          </p>
        </section>
      </div>
    </main>
  );
}