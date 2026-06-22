import type { Task } from "@/types/task";

export type ValidationIssue = {
  taskId?: string;
  rowIndex?: number;
  field?: string;
  level: "error" | "warning";
  message: string;
};

// Validate a set of tasks. Most issues are non-blocking warnings (§16);
// only structurally-broken data (no level1/level2/title) is an error.
export function validateTasks(tasks: Task[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenOrder = new Map<number, number>();
  const seenCode = new Map<string, number>();

  tasks.forEach((task, i) => {
    if (!task.level1 && !task.level2 && !task.title) {
      issues.push({ taskId: task.id, rowIndex: i, level: "error", message: "Missing Level 1 / Level 2 / title" });
    }

    for (const [key, value] of Object.entries(task.estimates)) {
      if (Number.isNaN(value)) {
        issues.push({ taskId: task.id, rowIndex: i, field: key, level: "warning", message: `Invalid estimate for ${key}` });
      } else if (value < 0) {
        issues.push({ taskId: task.id, rowIndex: i, field: key, level: "warning", message: `Negative estimate for ${key}` });
      }
    }

    const hasEstimate = Object.values(task.estimates).some((v) => Number.isFinite(v) && v > 0);
    if (!hasEstimate) {
      issues.push({ taskId: task.id, rowIndex: i, level: "warning", message: "No positive estimate (won't render)" });
    }

    const prevOrder = seenOrder.get(task.scheduleOrder);
    if (prevOrder !== undefined) {
      issues.push({ taskId: task.id, rowIndex: i, field: "scheduleOrder", level: "warning", message: `Duplicate schedule order ${task.scheduleOrder}` });
    }
    seenOrder.set(task.scheduleOrder, i);

    if (task.code) {
      const prevCode = seenCode.get(task.code);
      if (prevCode !== undefined) {
        issues.push({ taskId: task.id, rowIndex: i, field: "code", level: "warning", message: `Duplicate code ${task.code}` });
      }
      seenCode.set(task.code, i);
    }
  });

  return issues;
}

// Quick per-task issue lookup for inline table badges.
export function issuesByTaskId(issues: ValidationIssue[]): Map<string, ValidationIssue[]> {
  const map = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    if (!issue.taskId) continue;
    const arr = map.get(issue.taskId) ?? [];
    arr.push(issue);
    map.set(issue.taskId, arr);
  }
  return map;
}
