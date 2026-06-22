import { describe, it, expect } from "vitest";
import { generateSegments } from "@/domain/schedule/generate-segments";
import { createDefaultProjectConfig } from "@/constants/default-project-config";
import type { Task } from "@/types/task";

const ROLE_KEYS = ["backend", "frontend", "qc", "brs"];

function task(id: string, order: number, est: Record<string, number>): Task {
  return {
    id, code: id, level1: "G", level2: id, title: id,
    displayOrder: order, scheduleOrder: order, estimates: est, enabled: true,
  };
}

describe("generateSegments", () => {
  const config = createDefaultProjectConfig(); // 5 days/week, 10 units/day, skip 0.5d

  it("duration uses MAX role estimate, not sum", () => {
    const segs = generateSegments([task("A", 1, { backend: 3, frontend: 2, qc: 1 })], config, ROLE_KEYS);
    const total = segs.reduce((s, x) => s + x.durationUnits, 0);
    expect(total).toBe(30); // 3 days * 10 units, not 6 days
  });

  it("splits a task across weeks when it overflows the current week", () => {
    // Week capacity = 50 units (5d). A=2d fills part, B=5d must split.
    const segs = generateSegments(
      [task("A", 1, { backend: 2 }), task("B", 2, { backend: 5 })],
      config,
      ROLE_KEYS
    );
    const b = segs.filter((s) => s.taskId === "B");
    expect(b.length).toBe(2);
    expect(b[0].weekIndex).toBe(0);
    expect(b[0].durationUnits).toBe(30); // remaining 3d in week 0
    expect(b[1].weekIndex).toBe(1);
    expect(b[1].durationUnits).toBe(20); // 2d into week 1
  });

  it("skips to next week when leftover <= skip threshold (0.5d)", () => {
    // A=4.6d leaves 0.4d (4 units) <= 5-unit threshold → B starts week 1.
    const segs = generateSegments(
      [task("A", 1, { backend: 4.6 }), task("B", 2, { backend: 1 })],
      config,
      ROLE_KEYS
    );
    const b = segs.find((s) => s.taskId === "B")!;
    expect(b.weekIndex).toBe(1);
    expect(b.offsetUnits).toBe(0);
  });

  it("ignores disabled tasks and zero-duration tasks", () => {
    const t1 = { ...task("A", 1, { backend: 2 }), enabled: false };
    const t2 = task("B", 2, {});
    expect(generateSegments([t1, t2], config, ROLE_KEYS)).toHaveLength(0);
  });

  it("orders by scheduleOrder, not array order", () => {
    const segs = generateSegments(
      [task("late", 2, { backend: 1 }), task("early", 1, { backend: 1 })],
      config,
      ROLE_KEYS
    );
    expect(segs[0].taskId).toBe("early");
  });
});
