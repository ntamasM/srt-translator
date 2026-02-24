export type TranslationStatus =
  | "idle"
  | "uploading"
  | "translating"
  | "complete"
  | "cancelled"
  | "error";

export interface TranslationProgress {
  type: "progress" | "file_complete" | "all_complete" | "cancelled" | "error";
  file?: string;
  current?: number;
  total?: number;
  message?: string;
  files?: string[];
  output?: string;
}

export interface FileProgress {
  filename: string;
  current: number;
  total: number;
  status: "pending" | "translating" | "done" | "error" | "cancelled";
  error?: string;
}

export interface TranslationResult {
  job_id: string;
  status: string;
  message?: string;
}
