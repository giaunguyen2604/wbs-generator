import type { WeekColumn } from "@/types/schedule";

// Sticky left columns shown before the scrollable timeline.
export const LEFT_COLS = [
  { key: "code", label: "Code", width: 70 },
  { key: "level1", label: "Level 1", width: 130 },
  { key: "level2", label: "Level 2", width: 160 },
  { key: "duration", label: "Days", width: 56 },
] as const;

// Cumulative left offset (px) for each sticky column index.
export function leftOffset(index: number): number {
  return LEFT_COLS.slice(0, index).reduce((sum, c) => sum + c.width, 0);
}

export const TOTAL_LEFT_WIDTH = LEFT_COLS.reduce((s, c) => s + c.width, 0);

export const DENSITY_WIDTH = { compact: 44, comfortable: 76 } as const;
export type Density = keyof typeof DENSITY_WIDTH;

// Index of the week containing "today", or -1 if outside the range.
export function todayWeekIndex(weeks: WeekColumn[], today: Date): number {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return weeks.findIndex((w) => {
    const start = w.startDate.getTime();
    const end = start + 7 * 86400000; // full 7-day span
    return t >= start && t < end;
  });
}

// Group consecutive weeks by year/month for the month header row.
export function groupWeeksByMonth(weeks: WeekColumn[]): { label: string; span: number }[] {
  const groups: { label: string; span: number }[] = [];
  for (const w of weeks) {
    const label = `${w.year}/${String(w.month).padStart(2, "0")}`;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.span += 1;
    else groups.push({ label, span: 1 });
  }
  return groups;
}
