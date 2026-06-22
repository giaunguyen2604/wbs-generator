import type { Task } from "@/types/task";
import type { ProjectConfig } from "@/types/project";
import { daysToUnits } from "@/utils/number-units";

// Duration of a task in DAYS. Teams work in parallel, so the schedule duration
// is the MAX role estimate (not the sum). Disabled roles are still counted if
// they carry an estimate value — only enabled roles' estimates are written, so
// the stored estimates map already reflects active roles.
export function getTaskDurationDays(task: Task, enabledRoleKeys?: string[]): number {
  const values = enabledRoleKeys
    ? enabledRoleKeys.map((k) => task.estimates[k] ?? 0)
    : Object.values(task.estimates);
  const positive = values.filter((v) => Number.isFinite(v) && v > 0);
  return positive.length ? Math.max(...positive) : 0;
}

// Duration in internal integer units.
export function getTaskDurationUnits(
  task: Task,
  config: ProjectConfig,
  enabledRoleKeys?: string[]
): number {
  return daysToUnits(getTaskDurationDays(task, enabledRoleKeys), config.unitPerDay);
}
