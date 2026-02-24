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
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-gray-500"
      }`}
    >
      <Upload
        size={40}
        className={`mb-3 ${
          isDragging ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
        }`}
      />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        Drag &amp; drop .srt files here
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        or click to browse
      </p>
    </div>
  );
}
