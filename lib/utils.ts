/**
 * Format a Date as a YYYY-MM-DD local date string.
 * Defaults to today if no argument is given.
 */
export function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Human-readable elapsed time.
 * short=true  → "3m" / "2h" / "1d"   (for tight spaces like comment threads)
 * short=false → "3m ago" / "2h ago"   (default, for feed cards / notifications)
 */
export function timeAgo(dateStr: string, short = false): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return short ? `${Math.floor(diff / 60)}m`  : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return short ? `${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 3600)}h ago`;
  return short ? `${Math.floor(diff / 86400)}d` : `${Math.floor(diff / 86400)}d ago`;
}
