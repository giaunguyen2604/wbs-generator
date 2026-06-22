import { nanoid } from "nanoid";
import type { Task } from "@/types/task";

// Create a blank task with sane defaults and the given order positions.
export function createBlankTask(order: number): Task {
  return {
    id: nanoid(10),
    code: "",
    level1: "",
    level2: "",
    title: "",
    displayOrder: order,
    scheduleOrder: order,
    estimates: {},
    enabled: true,
  };
}

// Deep-clone a task with a fresh id (used by duplicate-row).
export function cloneTask(task: Task, order: number): Task {
  return {
    ...task,
    id: nanoid(10),
    displayOrder: order,
    scheduleOrder: order,
    estimates: { ...task.estimates },
  };
}
