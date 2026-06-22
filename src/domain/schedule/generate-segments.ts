import type { Task } from "@/types/task";
import type { ProjectConfig } from "@/types/project";
import type { ScheduleSegment } from "@/types/schedule";
import { getTaskDurationUnits } from "@/domain/schedule/task-duration";

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
