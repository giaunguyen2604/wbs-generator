import { describe, it, expect } from "vitest";
import { buildLevelGroupTasks } from "@/domain/import/build-level-group-tasks";

const OPTS = { level1: "Consumer Frontsite", inputMode: "days" as const, hoursPerDay: 8, startOrder: 1 };

describe("buildLevelGroupTasks", () => {
  it("forces the given Level 1 onto every row and maps estimates by position", () => {
    const text = `Authentication\t1.5\t0.5\t0.6\t0\nProfile\t1\t0.5\t0\t0`;
    const tasks = buildLevelGroupTasks(text, OPTS);
    expect(tasks).toHaveLength(2);
    expect(tasks.every((t) => t.level1 === "Consumer Frontsite")).toBe(true);
    expect(tasks[0].level2).toBe("Authentication");
    expect(tasks[0].estimates.backend).toBe(1.5);
    expect(tasks[0].estimates.frontend).toBe(0.5);
    expect(tasks[0].estimates.qc).toBe(0.6);
  });

  it("assigns sequential orders from startOrder", () => {
    const tasks = buildLevelGroupTasks(`A\t1\t0\t0\t0\nB\t2\t0\t0\t0`, { ...OPTS, startOrder: 5 });
    expect(tasks[0].scheduleOrder).toBe(5);
    expect(tasks[1].scheduleOrder).toBe(6);
  });

  it("drops a header row when estimate columns hold labels", () => {
    const text = `Level 2\tBackend\tFrontend\tQC\tBrS\nLogin\t1\t0.5\t0\t0`;
    const tasks = buildLevelGroupTasks(text, OPTS);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].level2).toBe("Login");
  });

  it("skips rows with no Level 2 (inherited Level 1 alone is not a task)", () => {
    const text = `Login\t1\t0\t0\t0\n\t\t\t\t`;
    expect(buildLevelGroupTasks(text, OPTS)).toHaveLength(1);
  });

  it("converts hours to days when inputMode is hours", () => {
    const tasks = buildLevelGroupTasks(`Login\t8\t4\t0\t0`, { ...OPTS, inputMode: "hours" });
    expect(tasks[0].estimates.backend).toBe(1);
    expect(tasks[0].estimates.frontend).toBe(0.5);
  });
});
