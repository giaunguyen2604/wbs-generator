import type { Task } from "@/types/task";
import type { ScheduleSegment, WeekColumn } from "@/types/schedule";
import { LEFT_COLS, leftOffset } from "@/components/schedule-board/board-layout";
import { ScheduleBar } from "@/components/schedule-board/schedule-bar";
import { unitsToDays } from "@/utils/number-units";

type Props = {
  task: Task;
  weeks: WeekColumn[];
  cellWidth: number;
  todayIdx: number;
  color: string;
  durationDays: number;
  unitPerDay: number;
  weekCapacityUnits: number;
  segments: Map<number, ScheduleSegment> | undefined;
};

// One board row: sticky Code/Level1/Level2/Days cells + a bar per occupied week.
export function BoardTaskRow(p: Props) {
  const leftTd = "sticky z-10 bg-white border-b border-r border-slate-100 px-2 py-1 text-xs text-slate-600 truncate-cell";
  const cells = [p.task.code, p.task.level1, p.task.level2, p.durationDays || "—"];

  return (
    <tr>
      {LEFT_COLS.map((c, i) => (
        <td
          key={c.key}
          className={`${leftTd} ${c.key === "duration" ? "text-right font-medium" : ""}`}
          style={{ left: leftOffset(i), width: c.width, minWidth: c.width, maxWidth: c.width }}
          title={String(cells[i] ?? "")}
        >
          {i === 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
              {cells[i]}
            </span>
          ) : (
            cells[i]
          )}
        </td>
      ))}

      {p.weeks.map((w) => {
        const seg = p.segments?.get(w.weekIndex);
        return (
          <td
            key={w.weekIndex}
            className={`relative border-b border-r border-slate-100 ${w.weekIndex === p.todayIdx ? "bg-amber-50/40" : ""}`}
            style={{ width: p.cellWidth, minWidth: p.cellWidth, height: 28 }}
          >
            {seg && (
              <ScheduleBar
                segment={seg}
                weekCapacityUnits={p.weekCapacityUnits}
                color={p.color}
                tooltip={buildTooltip(p.task, seg, p.unitPerDay)}
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}

function buildTooltip(task: Task, seg: ScheduleSegment, unitPerDay: number): string {
  const days = unitsToDays(seg.durationUnits, unitPerDay);
  const name = task.title || task.level2 || task.level1;
  return `${task.code ? task.code + " " : ""}${name} — ${days}d this week`;
}
