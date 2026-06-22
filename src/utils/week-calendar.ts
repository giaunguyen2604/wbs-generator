// Calendar helpers mapping a project startDate + workingDaysPerWeek to dated
// week columns. Weeks are contiguous blocks of working days (Mon-based span).

// Parse an ISO yyyy-mm-dd into a local Date at midnight.
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Snap a date back to the Monday of its week (start of working week).
export function snapToWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Start/end calendar dates of week N counting from a snapped start.
export function weekDateRange(
  start: Date,
  weekIndex: number,
  workingDaysPerWeek: number
): { startDate: Date; endDate: Date } {
  const startDate = addDays(start, weekIndex * 7);
  // End = last working day of the week (inclusive).
  const endDate = addDays(startDate, Math.max(0, workingDaysPerWeek - 1));
  return { startDate, endDate };
}

// 1-based week index within its own month, derived from the week start date.
export function weekOfMonth(date: Date): number {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

export function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Short "MM/DD" label for week date ranges.
export function formatDayMonth(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
