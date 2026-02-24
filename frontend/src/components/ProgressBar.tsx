import React from "react";

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  className = "",
  showLabel = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="min-w-[3rem] text-right text-xs font-medium text-gray-600 dark:text-gray-400">
          {clamped}%
        </span>
      )}
    </div>
  );
}
