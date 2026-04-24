/**
 * Format a Date as a YYYY-MM-DD local date string.
 * Defaults to today if no argument is given.
 */
export function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Compute current streak from an array of YYYY-MM-DD passage dates.
 * Counts from today if posted, otherwise from yesterday (don't penalise
 * users who haven't posted yet today).
 */
export function computeStreak(dates: string[]): number {
  const unique = [...new Set(dates)].sort().reverse();
  const todayStr = localDateStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateStr(yesterday);

  const startStr = unique.includes(todayStr) ? todayStr : yesterdayStr;

  let streak = 0;
  let expected = startStr;
  for (const date of unique) {
    if (date === expected) {
      streak++;
      const prev = new Date(expected + 'T12:00:00');
      prev.setDate(prev.getDate() - 1);
      expected = localDateStr(prev);
    } else if (date < expected) {
      break;
    }
  }
  return streak;
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
