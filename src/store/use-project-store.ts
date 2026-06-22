import { create } from "zustand";
import { temporal } from "zundo";
import type { ProjectStore } from "@/store/store-types";
import { createTaskActions } from "@/store/task-actions";
import { createProjectActions } from "@/store/project-actions";
import { createEmptyProjectData } from "@/constants/default-project-config";

// Trailing debounce for zundo's `handleSet`: collapses a burst of rapid edits
// (e.g. typing in a cell) into a single undo snapshot instead of one per change.
function debounceHandleSet<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number
): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Zustand store wrapped with zundo `temporal` for in-memory undo/redo.
// Only `data` is tracked (partialize) and history is capped at 50 entries so
// undo state never grows unbounded and is never persisted.
export const useProjectStore = create<ProjectStore>()(
  temporal(
    (set, get) => ({
      // Placeholder until Firestore hydration completes (see useFirestoreBootstrap).
      data: createEmptyProjectData(),
      projectList: [],
      saveStatus: "idle",
      hydrated: false,
      ...createTaskActions(set, get),
      ...createProjectActions(set, get),
    }),
    {
      limit: 50,
      partialize: (state) => ({ data: state.data }),
      // Coalesce rapid edits (e.g. typing) into a single snapshot per ~400ms burst.
      handleSet: (handleSet) => debounceHandleSet(handleSet, 400),
    }
  )
);

// Convenience hooks for undo/redo wired to zundo's temporal store.
export function useTemporalStore() {
  return useProjectStore.temporal.getState();
}
