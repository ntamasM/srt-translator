/**
 * Global translation context — keeps translation progress, uploaded files,
 * and translated files alive across page navigations.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { translationApi } from "../api/translationApi";
import { filesApi } from "../api/filesApi";
import type {
  TranslationStatus,
  TranslationProgress,
  FileProgress,
} from "../types/translation";
import type { FileInfo } from "../types/files";
import type { MatchingWord, Settings } from "../types/settings";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TranslationContextValue {
  // File state
  files: FileInfo[];
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  isUploading: boolean;
  addFiles: (newFiles: File[]) => Promise<{ files: FileInfo[]; message: string }>;
  removeFile: (filename: string) => Promise<void>;
  refreshFiles: () => Promise<void>;

  // Translation state
  status: TranslationStatus;
  fileProgress: Record<string, FileProgress>;
  completedFiles: string[];
  error: string | null;
  startTranslation: (
    files: string[],
    settings: Settings,
    matchingWords?: MatchingWord[],
    removalWords?: string[],
  ) => Promise<void>;
  cancelTranslation: () => Promise<void>;
  reset: () => void;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  // ── File state ──────────────────────────────────────────────────
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback(async (newFiles: File[]) => {
    setIsUploading(true);
    try {
      const result = await filesApi.uploadFiles(newFiles);
      setFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name));
        const unique = result.files.filter((f) => !existing.has(f.name));
        return [...prev, ...unique];
      });
      return result;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeFile = useCallback(async (filename: string) => {
    await filesApi.deleteFile(filename);
    setFiles((prev) => prev.filter((f) => f.name !== filename));
  }, []);

  const refreshFiles = useCallback(async () => {
    const list = await filesApi.listFiles();
    setFiles(list);
  }, []);

  // ── Translation state ───────────────────────────────────────────
  const [status, setStatus] = useState<TranslationStatus>("idle");
  const [fileProgress, setFileProgress] = useState<Record<string, FileProgress>>({});
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const startTranslation = useCallback(
    async (
      fileNames: string[],
      settings: Settings,
      matchingWords: MatchingWord[] = [],
      removalWords: string[] = [],
    ) => {
      setStatus("translating");
      setError(null);
      setCompletedFiles([]);

      const initial: Record<string, FileProgress> = {};
      fileNames.forEach((f) => {
        initial[f] = { filename: f, current: 0, total: 0, status: "pending" };
      });
      setFileProgress(initial);

      try {
        const result = await translationApi.startTranslation(
          fileNames,
          settings,
          matchingWords,
          removalWords,
        );
        const jobId = result.job_id;
        jobIdRef.current = jobId;

        const ws = translationApi.createProgressWebSocket(jobId, {
          onProgress: (data: TranslationProgress) => {
            switch (data.type) {
              case "progress":
                setFileProgress((prev) => ({
                  ...prev,
                  [data.file!]: {
                    filename: data.file!,
                    current: data.current!,
                    total: data.total!,
                    status: "translating",
                  },
                }));
                break;
              case "file_complete":
                setFileProgress((prev) => ({
                  ...prev,
                  [data.file!]: {
                    ...prev[data.file!],
                    status: "done",
                    current: prev[data.file!]?.total ?? 0,
                  },
                }));
                setCompletedFiles((prev) => [...prev, data.file!]);
                break;
              case "all_complete":
                setStatus("complete");
                break;
              case "cancelled":
                if (data.file) {
                  setFileProgress((prev) => ({
                    ...prev,
                    [data.file!]: {
                      ...prev[data.file!],
                      status: "cancelled",
                    },
                  }));
                }
                setStatus("cancelled");
                break;
              case "error":
                if (data.file) {
                  setFileProgress((prev) => ({
                    ...prev,
                    [data.file!]: {
                      ...prev[data.file!],
                      status: "error",
                      error: data.message,
                    },
                  }));
                } else {
                  setError(data.message || "Translation failed");
                  setStatus("error");
                }
                break;
            }
          },
          onClose: () => {
            setStatus((prev) => (prev === "translating" ? "complete" : prev));
          },
          onError: () => {
            setError("WebSocket connection lost");
            setStatus("error");
          },
        });

        wsRef.current = ws;
      } catch (err: any) {
        setError(err.message || "Failed to start translation");
        setStatus("error");
      }
    },
    [],
  );

  const cancelTranslation = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "cancel" }));
    }
    if (jobIdRef.current) {
      try {
        await translationApi.cancelTranslation(jobIdRef.current);
      } catch {}
    }
    setStatus("cancelled");
  }, []);

  const reset = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    jobIdRef.current = null;
    setStatus("idle");
    setFileProgress({});
    setCompletedFiles([]);
    setError(null);
  }, []);

  // ── Value ───────────────────────────────────────────────────────
  const value: TranslationContextValue = {
    files,
    isDragging,
    setIsDragging,
    isUploading,
    addFiles,
    removeFile,
    refreshFiles,
    status,
    fileProgress,
    completedFiles,
    error,
    startTranslation,
    cancelTranslation,
    reset,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useTranslationContext() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslationContext must be used within TranslationProvider");
  }
  return ctx;
}
