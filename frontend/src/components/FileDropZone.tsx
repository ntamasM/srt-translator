import React, { useCallback } from "react";
import { Upload } from "lucide-react";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}

export default function FileDropZone({
  onFiles,
  isDragging,
  setIsDragging,
}: FileDropZoneProps) {
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [setIsDragging],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    },
    [setIsDragging],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith(".srt"),
      );
      if (files.length) onFiles(files);
    },
    [onFiles, setIsDragging],
  );

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".srt";
    input.multiple = true;
    input.onchange = () => {
      if (input.files?.length) {
        onFiles(Array.from(input.files));
      }
    };
    input.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
        isDragging
          ? "border-primary bg-primary/10 dark:bg-dark-primary/10"
          : "border-base-300 bg-base-100 hover:border-base-300 dark:border-dark-base-300 dark:bg-dark-base-200/50 dark:hover:border-dark-base-300"
      }`}
    >
      <Upload
        size={40}
        className={`mb-3 ${
          isDragging
            ? "text-primary"
            : "text-base-content/50 dark:text-dark-base-content/50"
        }`}
      />
      <p className="text-sm font-medium text-base-content/70 dark:text-dark-base-content">
        Drag &amp; drop .srt files here
      </p>
      <p className="mt-1 text-xs text-base-content/60 dark:text-dark-base-content/50">
        or click to browse
      </p>
    </div>
  );
}
