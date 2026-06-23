import { useMemo, useState } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useGeneratedSchedule } from "@/hooks/use-generated-schedule";
import { getTaskDurationDays } from "@/domain/schedule/task-duration";
import { colorForGroup } from "@/utils/group-color";
import { BoardTimelineHeader } from "@/components/schedule-board/board-timeline-header";
import { BoardTaskRow } from "@/components/schedule-board/board-task-row";
import { BoardEmptyState } from "@/components/schedule-board/board-empty-state";
import { DENSITY_WIDTH, type Density, todayWeekIndex } from "@/components/schedule-board/board-layout";
import { Button } from "@/components/ui/button";

// Read-only weekly schedule board derived live from tasks + config.
export function ScheduleBoard() {
  const tasks = useProjectStore((s) => s.data.tasks);
  const project = useProjectStore((s) => s.data.project);
  const { weeks, segmentsByTask, groupColors, weekCapacityUnits } = useGeneratedSchedule();
  const [density, setDensity] = useState<Density>("comfortable");

  const enabledRoleKeys = useMemo(() => project.roles.filter((r) => r.enabled).map((r) => r.key), [project.roles]);

  // Rows in schedule order; only those that actually produce a bar.
  const rows = useMemo(
    () =>
      tasks
        .filter((t) => t.enabled && segmentsByTask.has(t.id))
        .sort((a, b) => a.scheduleOrder - b.scheduleOrder),
    [tasks, segmentsByTask]
  );

  const todayIdx = useMemo(() => todayWeekIndex(weeks, new Date()), [weeks]);
  const cellWidth = DENSITY_WIDTH[density];

  if (rows.length === 0) return <BoardEmptyState />;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
        <span>Density:</span>
        <Button
          variant={density === "compact" ? "primary" : "secondary"}
          onClick={() => setDensity("compact")}
        >
          Compact
        </Button>
        <Button
          variant={density === "comfortable" ? "primary" : "secondary"}
          onClick={() => setDensity("comfortable")}
        >
          Comfortable
        </Button>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-md border border-slate-200">
        <table className="border-collapse">
          <BoardTimelineHeader
            weeks={weeks}
            cellWidth={cellWidth}
            todayIdx={todayIdx}
            weekCapacityUnits={weekCapacityUnits}
          />
          <tbody>
            {rows.map((task) => (
              <BoardTaskRow
                key={task.id}
                task={task}
                weeks={weeks}
                cellWidth={cellWidth}
                todayIdx={todayIdx}
                color={colorForGroup(groupColors, task.level1)}
                durationDays={getTaskDurationDays(task, enabledRoleKeys)}
                unitPerDay={project.unitPerDay}
                weekCapacityUnits={weekCapacityUnits}
                segments={segmentsByTask.get(task.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
