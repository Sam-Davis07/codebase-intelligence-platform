"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes injects an inline script to prevent theme flicker.
// React 19 + Next.js 16 reports this as a false-positive console error.
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development"
) {
  const originalError = console.error;

  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
      return;
    }

    originalError(...args);
  };
}

const ThemeProviderBase =
  NextThemesProvider as unknown as React.ComponentType<{
    children?: React.ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
  }>;

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProviderBase
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProviderBase>
  );
}