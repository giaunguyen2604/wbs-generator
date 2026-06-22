import { useMemo } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { generateSchedule } from "@/domain/schedule/generate-schedule";
import { indexSegmentsByTaskWeek } from "@/domain/schedule/bar-geometry";
import { buildGroupColorMap } from "@/utils/group-color";

// Derive the schedule from store data, memoized on [tasks, project] so it only
// recomputes when source data actually changes (live regenerate, no button).
export function useGeneratedSchedule() {
  const data = useProjectStore((s) => s.data);

  return useMemo(() => {
    const schedule = generateSchedule(data);
    const segmentsByTask = indexSegmentsByTaskWeek(schedule.segments);
    const groupColors = buildGroupColorMap(data.tasks.map((t) => t.level1));
    return { ...schedule, segmentsByTask, groupColors };
    // Depend on the actual schedule inputs, not the whole `data` object, so an
    // `updatedAt`-only bump (e.g. autosave stamp) does not trigger a recompute.
  }, [data.tasks, data.project]);
}
