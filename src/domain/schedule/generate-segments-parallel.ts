import type { Task } from "@/types/task";
import type { ProjectConfig } from "@/types/project";
import type { ScheduleSegment } from "@/types/schedule";
import { buildTaskWork } from "@/domain/schedule/parallel-track-jobs";
import { simulateParallelTracks, type JobInterval } from "@/domain/schedule/simulate-parallel-tracks";
import { leadingWorkingDayOffset } from "@/utils/week-calendar";

// Parallel-track schedule generation. Simulates BE / FE / QC as parallel lanes,
// then slices each absolute job interval into per-week render segments. A job
// spanning a week boundary yields one segment per touched week. Idle stretches
// on a lane produce no segment (visible gap).
export function generateSegmentsParallel(
  tasks: Task[],
  config: ProjectConfig,
  enabledRoleKeys: string[]
): ScheduleSegment[] {
  const weekCapacity = config.workingDaysPerWeek * config.unitPerDay;
  if (weekCapacity <= 0) return [];

  // Mid-week start blocks the leading working days of week 0 for every lane.
  const startUnits =
    leadingWorkingDayOffset(config.startDate, config.workingDaysPerWeek) * config.unitPerDay;

  const works = buildTaskWork(tasks, config, enabledRoleKeys);
  const jobs = simulateParallelTracks(works, startUnits);

  const segments: ScheduleSegment[] = [];
  for (const job of jobs) sliceIntoWeeks(job, weekCapacity, segments);
  return segments;
}

// Split an absolute [start, end) interval into week-local segments.
function sliceIntoWeeks(job: JobInterval, weekCapacity: number, out: ScheduleSegment[]): void {
  let cursor = job.startUnits;
  let safety = 0;
  while (cursor < job.endUnits && safety++ < 100000) {
    const weekIndex = Math.floor(cursor / weekCapacity);
    const weekStart = weekIndex * weekCapacity;
    const weekEnd = weekStart + weekCapacity;
    const take = Math.min(job.endUnits, weekEnd) - cursor;
    out.push({
      taskId: job.taskId,
      weekIndex,
      offsetUnits: cursor - weekStart,
      durationUnits: take,
      track: job.track,
      phase: job.phase,
    });
    cursor += take;
  }
}
