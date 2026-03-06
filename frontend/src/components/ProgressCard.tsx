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
      ? progress.current >= progress.total
        ? 100
        : Math.min(Math.floor((progress.current / progress.total) * 100), 99)
      : 0;

  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm dark:border-dark-base-300 dark:bg-dark-base-200">
      <div className="mb-2 flex items-center justify-between">
        <span className="truncate text-sm font-medium text-base-content dark:text-dark-base-content">
          {progress.filename}
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={progress.status} />
          {progress.status === "done" && onDownload && (
            <button
              onClick={onDownload}
              className="rounded p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30"
              title="Download"
            >
              <Download size={16} />
            </button>
          )}
        </div>
      </div>
      <ProgressBar value={pct} />
      <p className="mt-1 text-xs text-base-content/60 dark:text-dark-base-content/50">
        {progress.current} / {progress.total} cues translated
      </p>
      {progress.error && (
        <p className="mt-1 text-xs text-error">{progress.error}</p>
      )}
    </div>
  );
}
