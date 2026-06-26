import type { ScheduleSegment } from "@/types/schedule";

// Percentage geometry for rendering a segment bar inside a week cell.
export function barGeometry(
  segment: ScheduleSegment,
  weekCapacityUnits: number
): { leftPercent: number; widthPercent: number } {
  if (weekCapacityUnits <= 0) return { leftPercent: 0, widthPercent: 0 };
  const leftPercent = (segment.offsetUnits / weekCapacityUnits) * 100;
  const widthPercent = (segment.durationUnits / weekCapacityUnits) * 100;
  return {
    leftPercent: Math.max(0, Math.min(100, leftPercent)),
    widthPercent: Math.max(0, Math.min(100 - leftPercent, widthPercent)),
  };
}

// Group segments by taskId then weekIndex for quick cell lookup in the board.
// A cell holds an array because parallel-track mode renders multiple lanes
// (BE / FE / QC) in the same week; waterfall mode yields a single-element array.
export function indexSegmentsByTaskWeek(
  segments: ScheduleSegment[]
): Map<string, Map<number, ScheduleSegment[]>> {
  const map = new Map<string, Map<number, ScheduleSegment[]>>();
  for (const s of segments) {
    let inner = map.get(s.taskId);
    if (!inner) {
      inner = new Map();
      map.set(s.taskId, inner);
    }
    const cell = inner.get(s.weekIndex);
    if (cell) cell.push(s);
    else inner.set(s.weekIndex, [s]);
  }
  return map;
}
