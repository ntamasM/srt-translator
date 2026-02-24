/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculate overall progress percentage from per-file progress.
 */
export function overallProgress(
  files: { current: number; total: number }[],
): number {
  const totalCues = files.reduce((s, f) => s + f.total, 0);
  if (totalCues === 0) return 0;
  const doneCues = files.reduce((s, f) => s + f.current, 0);
  return Math.round((doneCues / totalCues) * 100);
}
