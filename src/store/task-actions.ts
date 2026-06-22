import type { Task } from "@/types/task";
import type { ProjectStore, TaskActions, TaskPatch } from "@/store/store-types";
import { createBlankTask, cloneTask } from "@/utils/task-factory";
import { applyCellValue } from "@/store/apply-cell-value";
import { withTasks, reindexDisplayOrder, nextOrder, mapTask } from "@/store/data-helpers";

type SetFn = (fn: (s: ProjectStore) => Partial<ProjectStore>) => void;
type GetFn = () => ProjectStore;

// Task-level mutations. Each commits a new `data` object so zundo records it.
export function createTaskActions(set: SetFn, get: GetFn): TaskActions {
  const commit = (tasks: Task[]) =>
    set((s) => ({ data: withTasks(s.data, tasks) }));

  return {
    addTask: () => {
      const tasks = get().data.tasks;
      commit([...tasks, createBlankTask(nextOrder(tasks))]);
    },

    updateTask: (id: string, patch: TaskPatch) => {
      commit(mapTask(get().data.tasks, id, (t) => ({ ...t, ...patch })));
    },

    updateEstimate: (id: string, roleKey: string, days: number) => {
      commit(
        mapTask(get().data.tasks, id, (t) => ({
          ...t,
          estimates: { ...t.estimates, [roleKey]: Math.max(0, days || 0) },
        }))
      );
    },

    deleteTasks: (ids: string[]) => {
      const idSet = new Set(ids);
      commit(reindexDisplayOrder(get().data.tasks.filter((t) => !idSet.has(t.id))));
    },

    duplicateTask: (id: string) => {
      const tasks = get().data.tasks;
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const copy = cloneTask(tasks[idx], nextOrder(tasks));
      const next = [...tasks.slice(0, idx + 1), copy, ...tasks.slice(idx + 1)];
      commit(reindexDisplayOrder(next));
    },

    reorderTasks: (orderedIds: string[]) => {
      const byId = new Map(get().data.tasks.map((t) => [t.id, t]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((t): t is Task => Boolean(t))
        .map((t, i) => ({ ...t, displayOrder: i + 1, scheduleOrder: i + 1 }));
      commit(reordered);
    },

    setTaskEnabled: (id: string, enabled: boolean) => {
      commit(mapTask(get().data.tasks, id, (t) => ({ ...t, enabled })));
    },

    replaceTasks: (tasks: Task[]) => commit(reindexDisplayOrder(tasks)),

    appendTasks: (tasks: Task[]) => {
      const existing = get().data.tasks;
      const base = nextOrder(existing);
      const shifted = tasks.map((t, i) => ({
        ...t,
        displayOrder: existing.length + i + 1,
        scheduleOrder: base + i,
      }));
      commit([...existing, ...shifted]);
    },

    pasteGrid: (anchorRowIndex: number, fieldColumns: string[], grid: string[][]) => {
      const tasks = get().data.tasks.slice();
      grid.forEach((row, r) => {
        const rowIdx = anchorRowIndex + r;
        if (rowIdx >= tasks.length) {
          tasks.push(createBlankTask(nextOrder(tasks)));
        }
        let task = tasks[rowIdx];
        row.forEach((cell, c) => {
          const field = fieldColumns[c];
          if (field) task = applyCellValue(task, field, cell);
        });
        tasks[rowIdx] = task;
      });
      commit(reindexDisplayOrder(tasks));
    },
  };
}
