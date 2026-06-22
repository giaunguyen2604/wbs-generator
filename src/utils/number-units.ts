// Conversions between human-facing days/hours and internal integer "units".
// Using integer units (default 1 day = 10 units) avoids float drift when
// summing/splitting estimates across weeks.

// Convert days -> integer units, rounded to nearest unit.
export function daysToUnits(days: number, unitPerDay: number): number {
  if (!Number.isFinite(days) || days <= 0) return 0;
  return Math.round(days * unitPerDay);
}

// Convert internal units -> days (float, for display).
export function unitsToDays(units: number, unitPerDay: number): number {
  if (unitPerDay <= 0) return 0;
  return units / unitPerDay;
}

// Convert hours -> days using project hoursPerDay.
export function hoursToDays(hours: number, hoursPerDay: number): number {
  if (hoursPerDay <= 0) return 0;
  return hours / hoursPerDay;
}

export function daysToHours(days: number, hoursPerDay: number): number {
  return days * hoursPerDay;
}

// Format a day value compactly (drop trailing .0), tolerant of undefined.
export function formatDays(days: number | undefined): string {
  if (days === undefined || days === null || Number.isNaN(days)) return "";
  if (days === 0) return "0";
  return Number(days.toFixed(2)).toString();
}

// Parse a loosely-typed cell into a non-negative number, or null if invalid.
export function parseNumberCell(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
