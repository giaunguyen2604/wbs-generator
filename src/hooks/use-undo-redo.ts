import { useEffect } from "react";
import { useStore } from "zustand";
import { useProjectStore } from "@/store/use-project-store";

// React-reactive access to zundo's temporal store (undo/redo + availability).
export function useUndoRedo() {
  const pastStates = useStore(useProjectStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useProjectStore.temporal, (s) => s.futureStates);
  const { undo, redo, clear } = useProjectStore.temporal.getState();

  return {
    undo,
    redo,
    clear,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}

// Global keyboard shortcuts: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z (or +Y) redo.
// Skips when focus is in a text input/textarea unless it's a grid cell.
export function useUndoRedoShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (!mod || (key !== "z" && key !== "y")) return;

      const { undo, redo } = useProjectStore.temporal.getState();
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
