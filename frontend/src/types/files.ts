export interface FileInfo {
  name: string;
  size: number;
  modified: string;
}

export interface UploadResponse {
  files: FileInfo[];
  message: string;
}
