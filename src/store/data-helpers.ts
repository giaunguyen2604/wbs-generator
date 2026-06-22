import type { ProjectData } from "@/types/project";
import type { Task } from "@/types/task";

// Produce a new ProjectData with patched tasks and a refreshed timestamp.
export function withTasks(data: ProjectData, tasks: Task[]): ProjectData {
  return { ...data, tasks, updatedAt: new Date().toISOString() };
}

// Reindex displayOrder sequentially (1-based) preserving array order.
export function reindexDisplayOrder(tasks: Task[]): Task[] {
  return tasks.map((t, i) => ({ ...t, displayOrder: i + 1 }));
}

// Next order value (max existing scheduleOrder + 1).
export function nextOrder(tasks: Task[]): number {
  return tasks.reduce((m, t) => Math.max(m, t.scheduleOrder, t.displayOrder), 0) + 1;
}

// Map a single task by id through an updater, returning a new array.
export function mapTask(
  tasks: Task[],
  id: string,
  updater: (t: Task) => Task
): Task[] {
  return tasks.map((t) => (t.id === id ? updater(t) : t));
}
