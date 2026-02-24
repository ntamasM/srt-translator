import { useState, useEffect, useCallback } from "react";
import { getSettings, saveSettings } from "../utils/db";
import type { Settings } from "../types/settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (data: Partial<Settings>) => {
    try {
      const updated = await saveSettings(data);
      setSettings(updated);
      return updated;
    } catch (err: any) {
      throw err;
    }
  }, []);

  return { settings, isLoading, error, updateSettings, refetch: fetchSettings };
}
