import { useState, useCallback } from "react";
import { filesApi } from "../api/filesApi";
import type { FileInfo } from "../types/files";

export function useFileUpload() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback(async (newFiles: File[]) => {
    setIsUploading(true);
    try {
      const result = await filesApi.uploadFiles(newFiles);
      setFiles((prev) => {
        // Merge, avoiding duplicates by name
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

  return {
    files,
    isDragging,
    setIsDragging,
    isUploading,
    addFiles,
    removeFile,
    refreshFiles,
  };
}
