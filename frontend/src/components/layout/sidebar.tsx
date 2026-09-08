"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Boxes,
  Network,
  Route,
  Code2,
  ShieldAlert,
  Sparkles,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Repositories",
    href: "/repositories",
    icon: GitBranch,
  },
];

const intelligenceNavigation = [
  {
    label: "Architecture",
    href: "/architecture",
    icon: Boxes,
  },
  {
    label: "Dependencies",
    href: "/dependencies",
    icon: Network,
  },
  {
    label: "Routes",
    href: "/routes",
    icon: Route,
  },
  {
    label: "Code Explorer",
    href: "/code",
    icon: Code2,
  },
  {
    label: "Impact Analysis",
    href: "/impact",
    icon: ShieldAlert,
  },
];

const systemNavigation = [
  {
    label: "AI Assistant",
    href: "/assistant",
    icon: Sparkles,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function NavigationItem({
  label,
  href,
  icon: Icon,
  pathname,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  pathname: string;
}) {
  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-background">
      {/* Brand */}
      <div className="flex h-16 items-center border-b px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code2 className="h-4 w-4" />
          </div>

          <span>Codebase IQ</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavigationItem
              key={item.href}
              {...item}
              pathname={pathname}
            />
          ))}
        </div>

        <div>
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Understand
          </p>

          <div className="space-y-1">
            {intelligenceNavigation.map((item) => (
              <NavigationItem
                key={item.href}
                {...item}
                pathname={pathname}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            System
          </p>

          <div className="space-y-1">
            {systemNavigation.map((item) => (
              <NavigationItem
                key={item.href}
                {...item}
                pathname={pathname}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs font-medium">
        Codebase IQ
      </p>

      <p className="pt-1 text-xs text-muted-foreground">
        v0.1.0
      </p>
    </div>

    <ThemeToggle />
  </div>
</div>
    </aside>
  );
}