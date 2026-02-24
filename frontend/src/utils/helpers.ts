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
 *
 * Files whose cue count isn't known yet (total === 0) are estimated
 * using the average cue count of files that have been parsed, so
 * pending files properly count toward the denominator.
 */
export function overallProgress(
  files: { current: number; total: number }[],
): number {
  if (files.length === 0) return 0;

  const known = files.filter((f) => f.total > 0);
  const unknown = files.filter((f) => f.total === 0);

  if (known.length === 0) return 0;

  const knownTotal = known.reduce((s, f) => s + f.total, 0);
  const knownDone = known.reduce((s, f) => s + f.current, 0);

  // Estimate unknown files as having the average cue count of known files
  const avgCues = knownTotal / known.length;
  const estimatedTotal = knownTotal + unknown.length * avgCues;

  const pct = (knownDone / estimatedTotal) * 100;
  // Only show 100% when every known cue is truly done
  if (pct >= 100) return 100;
  return Math.min(Math.floor(pct), 99);
}
