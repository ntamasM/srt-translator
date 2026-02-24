import { useState, useCallback, useRef } from "react";
import { translationApi } from "../api/translationApi";
import type {
  TranslationStatus,
  TranslationProgress,
  FileProgress,
} from "../types/translation";
import type { MatchingWord, Settings } from "../types/settings";

export function useTranslation() {
  const [status, setStatus] = useState<TranslationStatus>("idle");
  const [fileProgress, setFileProgress] = useState<
    Record<string, FileProgress>
  >({});
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const startTranslation = useCallback(
    async (
      files: string[],
      settings: Settings,
      matchingWords: MatchingWord[] = [],
      removalWords: string[] = [],
    ) => {
      setStatus("translating");
      setError(null);
      setCompletedFiles([]);

      // Initialise per-file progress
      const initial: Record<string, FileProgress> = {};
      files.forEach((f) => {
        initial[f] = { filename: f, current: 0, total: 0, status: "pending" };
      });
      setFileProgress(initial);

      try {
        const result = await translationApi.startTranslation(
          files,
          settings,
          matchingWords,
          removalWords,
        );
        const jobId = result.job_id;
        jobIdRef.current = jobId;

        // Open WebSocket
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
    // Send cancel message via WebSocket (instant)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "cancel" }));
    }
    // Also hit the REST endpoint as fallback
    if (jobIdRef.current) {
      try {
        await translationApi.cancelTranslation(jobIdRef.current);
      } catch {
        // ignore – WS cancel is the primary mechanism
      }
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

  return {
    status,
    fileProgress,
    completedFiles,
    error,
    startTranslation,
    cancelTranslation,
    reset,
  };
}
