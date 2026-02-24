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

  deleteFile: (filename: string) =>
    del<{ message: string }>(`/files/${encodeURIComponent(filename)}`),
};
