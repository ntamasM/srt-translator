import { get, del, upload } from "./client";
import type { FileInfo, UploadResponse } from "../types/files";
import { API_BASE_URL } from "../utils/constants";

export const filesApi = {
  uploadFiles: (files: File[]) =>
    upload<UploadResponse>("/files/upload", files),

  listFiles: () => get<FileInfo[]>("/files"),

  listTranslated: () => get<FileInfo[]>("/files/translated"),

  downloadFile: (filename: string) => {
    // Trigger browser download
    const a = document.createElement("a");
    a.href = `${API_BASE_URL}/files/download/${encodeURIComponent(filename)}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  getTranslatedFileText: async (filename: string) => {
    const res = await fetch(
      `${API_BASE_URL}/files/download/${encodeURIComponent(filename)}`,
    );
    if (!res.ok) {
      throw new Error(`Failed to load translated file: ${filename}`);
    }
    return res.text();
  },

  downloadAllFiles: (filenames: string[]) => {
    // Stagger downloads slightly to reduce chance of browser blocking.
    filenames.forEach((name, idx) => {
      window.setTimeout(() => {
        const a = document.createElement("a");
        a.href = `${API_BASE_URL}/files/download/${encodeURIComponent(name)}`;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 120);
    });
  },

  deleteFile: (filename: string) =>
    del<{ message: string }>(`/files/${encodeURIComponent(filename)}`),

  deleteTranslatedFile: (filename: string) =>
    del<{ message: string }>(
      `/files/translated/${encodeURIComponent(filename)}`,
    ),
};
