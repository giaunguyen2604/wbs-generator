import type { ProjectData } from "@/types/project";
import type { GeneratedSchedule } from "@/types/schedule";
import { generateSegments } from "@/domain/schedule/generate-segments";
import { generateSegmentsParallel } from "@/domain/schedule/generate-segments-parallel";
import { buildWeekColumns } from "@/domain/schedule/build-week-columns";

// Top-level pure derivation: ProjectData -> GeneratedSchedule.
// Never persisted; recomputed (memoized at the hook layer) on data change.
export function generateSchedule(data: ProjectData): GeneratedSchedule {
  const { project, tasks } = data;
  const enabledRoleKeys = project.roles.filter((r) => r.enabled).map((r) => r.key);

  const segments =
    project.scheduleMode === "parallel-track"
      ? generateSegmentsParallel(tasks, project, enabledRoleKeys)
      : generateSegments(tasks, project, enabledRoleKeys);
  const weeks = buildWeekColumns(segments, project);
  const weekCapacityUnits = project.workingDaysPerWeek * project.unitPerDay;

  return { segments, weeks, weekCapacityUnits };
}
