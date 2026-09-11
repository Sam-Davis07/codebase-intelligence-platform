import { PageHeader } from "@/components/layout/page-header";

export default function RepositoriesPage() {
  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Workspace"
          title="Repositories"
          description="Manage repositories and analyze their structure, dependencies, and code intelligence."
        />

        <section className="mt-8 rounded-xl border bg-card p-8">
          <p className="text-sm font-medium">No repository connected</p>

          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Connect a repository to start analyzing its codebase.
          </p>
        </section>
      </div>
    </main>
  );
}