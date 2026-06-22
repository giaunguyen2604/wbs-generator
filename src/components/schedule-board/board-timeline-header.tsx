import type { WeekColumn } from "@/types/schedule";
import { LEFT_COLS, leftOffset, groupWeeksByMonth } from "@/components/schedule-board/board-layout";
import { formatDayMonth } from "@/utils/week-calendar";

type Props = {
  weeks: WeekColumn[];
  cellWidth: number;
  todayIdx: number;
  weekCapacityUnits: number;
};

// Two-row sticky header: month groups + dated week columns. Capacity meter sits
// under each week label so density of work is visible at a glance.
export function BoardTimelineHeader({ weeks, cellWidth, todayIdx, weekCapacityUnits }: Props) {
  const months = groupWeeksByMonth(weeks);
  const leftTh = "sticky z-30 bg-slate-100 border-b border-r border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 text-left";

  return (
    <thead className="sticky top-0 z-20">
      {/* Month row */}
      <tr>
        {LEFT_COLS.map((c, i) => (
          <th
            key={c.key}
            rowSpan={2}
            className={leftTh}
            style={{ left: leftOffset(i), width: c.width, minWidth: c.width }}
          >
            {c.label}
          </th>
        ))}
        {months.map((m, i) => (
          <th
            key={i}
            colSpan={m.span}
            className="border-b border-r border-slate-200 bg-slate-100 px-1 py-1 text-center text-xs font-semibold text-slate-600"
          >
            {m.label}
          </th>
        ))}
      </tr>
      {/* Week row */}
      <tr>
        {weeks.map((w) => {
          const pct = weekCapacityUnits > 0 ? Math.min(100, (w.usedUnits / weekCapacityUnits) * 100) : 0;
          return (
            <th
              key={w.weekIndex}
              className={`border-b border-r border-slate-200 px-0.5 py-1 align-top text-[10px] font-medium ${
                w.weekIndex === todayIdx ? "bg-amber-50" : "bg-slate-50"
              }`}
              style={{ width: cellWidth, minWidth: cellWidth }}
              title={`${formatDayMonth(w.startDate)}–${formatDayMonth(w.endDate)} · ${pct.toFixed(0)}% full`}
            >
              <div className="text-slate-500">W{w.weekOfMonth}</div>
              <div className="truncate-cell text-[9px] text-slate-400">{formatDayMonth(w.startDate)}</div>
              <div className="mt-0.5 h-1 w-full rounded bg-slate-200">
                <div className="h-1 rounded bg-blue-400" style={{ width: `${pct}%` }} />
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
