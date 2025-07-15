"use client";

import type * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/pricing";

  return (
    <NextThemesProvider {...props} forcedTheme={isHome ? "light" : undefined}>
      {children}
    </NextThemesProvider>
  );
}
