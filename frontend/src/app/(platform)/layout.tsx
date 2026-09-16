import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Application Area */}
      <div className="ml-64 min-h-screen">
        {/* Fixed Topbar */}
        <div className="fixed left-64 right-0 top-0 z-40">
          <Topbar />
        </div>

        {/* Scrollable Content */}
        <main className="h-screen overflow-y-auto pt-16">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}