import type { ProjectConfig } from "@/types/project";
import type { ScheduleSegment, WeekColumn } from "@/types/schedule";
import {
  parseIsoDate,
  snapToWeekStart,
  weekDateRange,
  weekOfMonth,
} from "@/utils/week-calendar";

// Build dated week columns covering at least the configured displayMonths and
// every week touched by a segment. Each column carries used capacity for hints.
export function buildWeekColumns(
  segments: ScheduleSegment[],
  config: ProjectConfig
): WeekColumn[] {
  const start = snapToWeekStart(parseIsoDate(config.startDate));

  // Minimum weeks from displayMonths (~4.345 weeks/month), and from segments.
  const minWeeks = Math.max(1, Math.ceil(config.displayMonths * 4.345));
  const maxSegmentWeek = segments.reduce((m, s) => Math.max(m, s.weekIndex), -1);
  const weekCount = Math.max(minWeeks, maxSegmentWeek + 1);

  const usedByWeek = new Map<number, number>();
  for (const s of segments) {
    usedByWeek.set(s.weekIndex, (usedByWeek.get(s.weekIndex) ?? 0) + s.durationUnits);
  }

  const columns: WeekColumn[] = [];
  for (let i = 0; i < weekCount; i++) {
    const { startDate, endDate } = weekDateRange(start, i, config.workingDaysPerWeek);
    // Assign the week's month/label by its LAST working day, so a week spilling
    // into the next month (e.g. 29/06–03/07) is grouped as W1 of that month, not
    // the trailing week of the previous one.
    columns.push({
      weekIndex: i,
      year: endDate.getFullYear(),
      month: endDate.getMonth() + 1,
      weekOfMonth: weekOfMonth(endDate),
      startDate,
      endDate,
      usedUnits: usedByWeek.get(i) ?? 0,
    });
  }

  return columns;
}
