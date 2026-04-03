import { get } from "./client";

export interface AppConfig {
  file_max_age_days: number;
  max_upload_size_mb: number;
  max_upload_count: number;
}

let cached: AppConfig | null = null;

export const configApi = {
  /** Fetch public backend config (cached after first call). */
  getConfig: async (): Promise<AppConfig> => {
    if (cached) return cached;
    cached = await get<AppConfig>("/config");
    return cached;
  },
};
