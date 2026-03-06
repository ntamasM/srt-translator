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
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-base-300 dark:bg-dark-base-300">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="min-w-[3rem] text-right text-xs font-medium text-base-content/70 dark:text-dark-base-content/50">
          {clamped}%
        </span>
      )}
    </div>
  );
}
