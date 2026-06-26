import { describe, it, expect } from "vitest";
import { generateSegmentsParallel } from "@/domain/schedule/generate-segments-parallel";
import { simulateParallelTracks } from "@/domain/schedule/simulate-parallel-tracks";
import { buildTaskWork } from "@/domain/schedule/parallel-track-jobs";
import { createDefaultProjectConfig } from "@/constants/default-project-config";
import type { Task } from "@/types/task";
import type { JobInterval } from "@/domain/schedule/simulate-parallel-tracks";

const ROLE_KEYS = ["backend", "frontend", "qc", "brs"];

function task(id: string, order: number, est: Record<string, number>): Task {
  return {
    id, code: id, level1: "G", level2: id, title: id,
    displayOrder: order, scheduleOrder: order, estimates: est, enabled: true,
  };
}

// End time of a task's lane/phase from the simulation (absolute units).
function endOf(jobs: JobInterval[], taskId: string, track: string, phase?: string): number {
  const j = jobs.find((x) => x.taskId === taskId && x.track === track && (phase ? x.phase === phase : true));
  return j ? j.endUnits : -1;
}

describe("simulateParallelTracks", () => {
  const config = { ...createDefaultProjectConfig(), startDate: "2026-06-22" }; // Mon, 10u/d, r=0.6

  it("FE pulls next task UI forward instead of waiting for BE (user A/B example)", () => {
    // A: BE4/FE2, B: BE2/FE1. r=0.6. Units (10/day): A be40 ui12 int8; B be20 ui6 int4.
    const works = buildTaskWork(
      [task("A", 1, { backend: 4, frontend: 2 }), task("B", 2, { backend: 2, frontend: 1 })],
      config,
      ROLE_KEYS
    );
    const jobs = simulateParallelTracks(works, 0);

    // BE sequential: A done @40, B done @60.
    expect(endOf(jobs, "A", "be")).toBe(40);
    expect(endOf(jobs, "B", "be")).toBe(60);
    // FE does UI_A then UI_B before any integration (BE not done yet).
    expect(endOf(jobs, "A", "fe", "ui")).toBe(12);
    expect(endOf(jobs, "B", "fe", "ui")).toBe(18);
    // Integration waits for matching BE: int_A @40→48, int_B @60→64.
    expect(endOf(jobs, "A", "fe", "integration")).toBe(48);
    expect(endOf(jobs, "B", "fe", "integration")).toBe(64); // FE finishes @6.4d
  });

  it("beats Sigma-max on opposite-leaning workloads (A:BE4/FE1, B:BE1/FE4)", () => {
    const works = buildTaskWork(
      [task("A", 1, { backend: 4, frontend: 1 }), task("B", 2, { backend: 1, frontend: 4 })],
      config,
      ROLE_KEYS
    );
    const jobs = simulateParallelTracks(works, 0);
    const makespan = Math.max(...jobs.map((j) => j.endUnits));
    expect(makespan).toBe(66); // 6.6 days vs Sigma-max = 80 (8 days)
  });

  it("no backend: FE is a single UI phase (no integration), QC after UI", () => {
    const works = buildTaskWork([task("A", 1, { frontend: 2, qc: 1 })], config, ROLE_KEYS);
    expect(works[0].feUiUnits).toBe(20);
    expect(works[0].feIntUnits).toBe(0);
    const jobs = simulateParallelTracks(works, 0);
    expect(jobs.some((j) => j.phase === "integration")).toBe(false);
    expect(endOf(jobs, "A", "fe", "ui")).toBe(20);
    expect(endOf(jobs, "A", "qc")).toBe(30); // QC starts after FE UI done @20
  });

  it("feUiRatio=1: all FE is UI, integration is empty", () => {
    const cfg = { ...config, feUiRatio: 1 };
    const works = buildTaskWork([task("A", 1, { backend: 2, frontend: 3 })], cfg, ROLE_KEYS);
    expect(works[0].feUiUnits).toBe(30);
    expect(works[0].feIntUnits).toBe(0);
  });

  it("feUiRatio=0: all FE is integration, gated by BE", () => {
    const cfg = { ...config, feUiRatio: 0 };
    const works = buildTaskWork([task("A", 1, { backend: 2, frontend: 3 })], cfg, ROLE_KEYS);
    expect(works[0].feUiUnits).toBe(0);
    expect(works[0].feIntUnits).toBe(30);
    const jobs = simulateParallelTracks(works, 0);
    // Integration cannot start before BE done @20.
    const int = jobs.find((j) => j.phase === "integration")!;
    expect(int.startUnits).toBe(20);
    expect(int.endUnits).toBe(50);
  });

  it("no frontend: no QC even if a QC estimate exists", () => {
    const works = buildTaskWork([task("A", 1, { backend: 3, qc: 1 })], config, ROLE_KEYS);
    expect(works[0].qcUnits).toBe(0);
    const jobs = simulateParallelTracks(works, 0);
    expect(jobs.some((j) => j.track === "qc")).toBe(false);
  });
});

describe("generateSegmentsParallel", () => {
  const config = { ...createDefaultProjectConfig(), startDate: "2026-06-22" };

  it("tags segments with track/phase and slices across week boundaries", () => {
    const segs = generateSegmentsParallel(
      [task("A", 1, { backend: 4, frontend: 2 }), task("B", 2, { backend: 2, frontend: 1 })],
      config,
      ROLE_KEYS
    );
    // BE of B spans the week-0/week-1 boundary (40→60, weekCap 50).
    const beB = segs.filter((s) => s.taskId === "B" && s.track === "be");
    expect(beB.map((s) => s.weekIndex)).toEqual([0, 1]);
    expect(beB[0].durationUnits + beB[1].durationUnits).toBe(20);
    // FE integration is tagged.
    expect(segs.some((s) => s.track === "fe" && s.phase === "integration")).toBe(true);
    // int_B lands in week 1 at offset 10 (absolute 60 → 50 week start + 10).
    const intB = segs.find((s) => s.taskId === "B" && s.phase === "integration")!;
    expect(intB.weekIndex).toBe(1);
    expect(intB.offsetUnits).toBe(10);
  });
});
