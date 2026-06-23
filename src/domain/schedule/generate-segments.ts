import type { Task } from "@/types/task";
import type { ProjectConfig } from "@/types/project";
import type { ScheduleSegment } from "@/types/schedule";
import { getTaskDurationUnits } from "@/domain/schedule/task-duration";
import { leadingWorkingDayOffset } from "@/utils/week-calendar";

// Core packing algorithm (requirements §10.6).
// Sorts enabled tasks by scheduleOrder, then fills sequential week capacity,
// splitting a task across weeks and skipping a near-full week (<= skipThreshold).
export function generateSegments(
  tasks: Task[],
  config: ProjectConfig,
  enabledRoleKeys: string[]
): ScheduleSegment[] {
  const segments: ScheduleSegment[] = [];
  const weekUsed: number[] = [];

  const weekCapacity = config.workingDaysPerWeek * config.unitPerDay;
  const skipThreshold = config.skipThresholdDays * config.unitPerDay;
  if (weekCapacity <= 0) return segments;

  // Mid-week start: block the leading working days of week 0 so tasks pack into
  // the remaining days only (e.g. a Wednesday start leaves 3 days, not 5). The
  // week column stays full-width; bars begin at the correct weekday offset.
  weekUsed[0] =
    leadingWorkingDayOffset(config.startDate, config.workingDaysPerWeek) *
    config.unitPerDay;

  const sorted = tasks
    .filter((t) => t.enabled)
    .sort((a, b) => a.scheduleOrder - b.scheduleOrder);

  let weekIndex = 0;

  for (const task of sorted) {
    let remaining = getTaskDurationUnits(task, config, enabledRoleKeys);
    if (remaining <= 0) continue;

    // Guard against runaway loops on pathological configs.
    let safety = 0;
    while (remaining > 0 && safety++ < 100000) {
      const used = weekUsed[weekIndex] ?? 0;
      const available = weekCapacity - used;

      // Near-full week: leftover too small to bother, move on.
      if (available <= skipThreshold) {
        weekIndex += 1;
        continue;
      }

      const take = Math.min(remaining, available);
      segments.push({
        taskId: task.id,
        weekIndex,
        offsetUnits: used,
        durationUnits: take,
      });

      weekUsed[weekIndex] = used + take;
      remaining -= take;

      if (weekCapacity - weekUsed[weekIndex] <= skipThreshold) {
        weekIndex += 1;
      }
    }
  }

  return segments;
}
