"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Forzar el tema oscuro por defecto
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
