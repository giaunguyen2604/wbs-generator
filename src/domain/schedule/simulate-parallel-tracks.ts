import type { ScheduleTrack, SchedulePhase } from "@/types/schedule";
import type { TaskWork } from "@/domain/schedule/parallel-track-jobs";

// An absolute time interval (in internal units, continuous calendar timeline)
// occupied by one piece of work on one resource lane.
export type JobInterval = {
  taskId: string;
  track: ScheduleTrack;
  phase?: SchedulePhase;
  startUnits: number;
  endUnits: number;
};

// Discrete-event simulation of three serial resource lanes (BE, FE, QC) sharing
// one calendar. Each lane has capacity 1 (one person). Dependencies:
//   FE_int(i) waits for BE(i) done AND FE_UI(i) done.
//   QC(i)     waits for FE(i) fully done.
// FE picks ready integration first (earliest ready), else next UI in order; it
// never preempts. Idle time on a lane simply becomes a gap (no interval).
export function simulateParallelTracks(works: TaskWork[], startUnits: number): JobInterval[] {
  const jobs: JobInterval[] = [];

  // --- BE lane: strictly sequential in schedule order. ---
  const beDone = new Map<string, number>();
  let beFree = startUnits;
  for (const w of works) {
    if (w.beUnits <= 0) continue;
    const start = beFree;
    const end = start + w.beUnits;
    push(jobs, w.taskId, "be", undefined, start, end);
    beFree = end;
    beDone.set(w.taskId, end);
  }

  // --- FE lane: UI work + integration, with priority + dependencies. ---
  const uiDone = new Map<string, number>(); // when each task's UI finished
  const feDone = new Map<string, number>(); // when FE is fully done (for QC)
  // Tasks whose integration has no UI job still need a UI-done marker.
  for (const w of works) {
    if (w.feIntUnits > 0 && w.feUiUnits <= 0) uiDone.set(w.taskId, startUnits);
  }
  const pendingUi = works.filter((w) => w.feUiUnits > 0).map((w) => w.taskId);
  const pendingInt = new Set(works.filter((w) => w.feIntUnits > 0).map((w) => w.taskId));
  const workById = new Map(works.map((w) => [w.taskId, w] as const));
  let feFree = startUnits;
  let safety = 0;

  while ((pendingUi.length > 0 || pendingInt.size > 0) && safety++ < 1_000_000) {
    const t = feFree;

    // Ready integrations: UI done and BE done by time t. pendingInt iterates in
    // schedule order, so strict `<` keeps the earliest-ordered task on ties.
    let pick: { taskId: string; readyAt: number } | null = null;
    for (const taskId of pendingInt) {
      const ui = uiDone.get(taskId);
      const be = beDone.get(taskId) ?? startUnits;
      if (ui === undefined) continue; // UI not scheduled yet
      const readyAt = Math.max(ui, be);
      if (readyAt <= t && (!pick || readyAt < pick.readyAt)) pick = { taskId, readyAt };
    }

    if (pick) {
      const w = workById.get(pick.taskId)!;
      const end = t + w.feIntUnits;
      push(jobs, pick.taskId, "fe", "integration", t, end);
      feFree = end;
      feDone.set(pick.taskId, end);
      pendingInt.delete(pick.taskId);
      continue;
    }

    if (pendingUi.length > 0) {
      const taskId = pendingUi.shift()!;
      const w = workById.get(taskId)!;
      const end = t + w.feUiUnits;
      push(jobs, taskId, "fe", "ui", t, end);
      feFree = end;
      uiDone.set(taskId, end);
      // UI is the final FE phase only if there is no integration phase.
      if (w.feIntUnits <= 0) feDone.set(taskId, end);
      continue;
    }

    // No ready integration and no UI left: jump ahead to the earliest unblock.
    // Reaching here implies every pending integration has its UI done (UIs are
    // all scheduled, or pre-seeded when feUiUnits=0) and BE recorded (feInt only
    // exists when beUnits>0), so both lookups are guaranteed present.
    let next = Infinity;
    for (const taskId of pendingInt) {
      const be = beDone.get(taskId)!;
      const ui = uiDone.get(taskId)!;
      next = Math.min(next, Math.max(be, ui));
    }
    if (!Number.isFinite(next) || next <= feFree) break; // safety
    feFree = next;
  }

  // --- QC lane: sequential, each gated by its task's FE completion. ---
  let qcFree = startUnits;
  for (const w of works) {
    if (w.qcUnits <= 0) continue;
    const ready = feDone.get(w.taskId) ?? startUnits;
    const start = Math.max(qcFree, ready);
    const end = start + w.qcUnits;
    push(jobs, w.taskId, "qc", undefined, start, end);
    qcFree = end;
  }

  return jobs;
}

function push(
  jobs: JobInterval[],
  taskId: string,
  track: ScheduleTrack,
  phase: SchedulePhase | undefined,
  startUnits: number,
  endUnits: number
): void {
  if (endUnits > startUnits) jobs.push({ taskId, track, phase, startUnits, endUnits });
}
