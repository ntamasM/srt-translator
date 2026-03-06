import { useEffect, useCallback } from "react";
import { useSettings } from "./useSettings";
import type { Theme } from "../types/settings";

/**
 * Reads the persisted theme from IndexedDB (via useSettings) and applies
 * the `dark` class on <html>. Supports "light", "dark", and "system"
 * (follows OS preference via matchMedia).
 */
export function useTheme() {
  const { settings, updateSettings } = useSettings();
  const theme: Theme = settings?.theme ?? "system";

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (resolved: "light" | "dark") => {
      if (resolved === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) =>
        applyTheme(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback(
    async (next: Theme) => {
      await updateSettings({ theme: next });
    },
    [updateSettings],
  );

  return { theme, setTheme };
}
