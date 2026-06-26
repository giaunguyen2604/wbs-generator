import type { Task } from "@/types/task";
import type { ProjectConfig } from "@/types/project";
import { daysToUnits } from "@/utils/number-units";

// Role keys used by parallel-track scheduling. Backend/Frontend/QC are the
// default roles; other custom roles are ignored in this mode (per spec).
export const BE_KEY = "backend";
export const FE_KEY = "frontend";
export const QC_KEY = "qc";

// Per-task work broken into the three parallel lanes (in internal units).
// Rules:
// - FE splits into UI (feUiRatio) + integration (remainder); integration waits
//   for BE. If the task has NO backend work, FE is a single UI phase (no split).
// - QC only exists when the task has FE work (manual test of the built UI).
export type TaskWork = {
  taskId: string;
  beUnits: number;
  feUiUnits: number;
  feIntUnits: number; // 0 when there is no backend dependency
  qcUnits: number; // 0 when there is no FE work
};

function unitsFor(task: Task, key: string, config: ProjectConfig, enabled: Set<string>): number {
  if (!enabled.has(key)) return 0;
  return daysToUnits(task.estimates[key] ?? 0, config.unitPerDay);
}

// Build ordered per-task work for enabled tasks, sorted by scheduleOrder.
export function buildTaskWork(
  tasks: Task[],
  config: ProjectConfig,
  enabledRoleKeys: string[]
): TaskWork[] {
  const enabled = new Set(enabledRoleKeys);
  const ratio = clampRatio(config.feUiRatio);

  return tasks
    .filter((t) => t.enabled)
    .sort((a, b) => a.scheduleOrder - b.scheduleOrder)
    .map((task) => {
      const beUnits = unitsFor(task, BE_KEY, config, enabled);
      const feUnits = unitsFor(task, FE_KEY, config, enabled);
      const qcRaw = unitsFor(task, QC_KEY, config, enabled);

      // No backend dependency → all FE is UI (nothing to integrate against).
      const feUiUnits = beUnits > 0 ? Math.round(feUnits * ratio) : feUnits;
      const feIntUnits = beUnits > 0 ? feUnits - feUiUnits : 0;
      const qcUnits = feUnits > 0 ? qcRaw : 0;

      return { taskId: task.id, beUnits, feUiUnits, feIntUnits, qcUnits };
    })
    .filter((w) => w.beUnits > 0 || w.feUiUnits > 0 || w.feIntUnits > 0 || w.qcUnits > 0);
}

// Clamp the FE UI ratio to [0, 1], falling back to the default on bad input.
export function clampRatio(r: number): number {
  if (!Number.isFinite(r)) return 0.6;
  return Math.min(1, Math.max(0, r));
}
