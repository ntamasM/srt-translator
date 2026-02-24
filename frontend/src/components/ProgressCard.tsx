import React from "react";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import type { FileProgress } from "../types/translation";
import { Download } from "lucide-react";

interface ProgressCardProps {
  progress: FileProgress;
  onDownload?: () => void;
}

export default function ProgressCard({
  progress,
  onDownload,
}: ProgressCardProps) {
  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
          {progress.filename}
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={progress.status} />
          {progress.status === "done" && onDownload && (
            <button
              onClick={onDownload}
              className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              title="Download"
            >
              <Download size={16} />
            </button>
          )}
        </div>
      </div>
      <ProgressBar value={pct} />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {progress.current} / {progress.total} cues translated
      </p>
      {progress.error && (
        <p className="mt-1 text-xs text-red-600">{progress.error}</p>
      )}
    </div>
  );
}
