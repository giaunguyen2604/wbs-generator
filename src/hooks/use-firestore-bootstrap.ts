import { useEffect } from "react";
import { useProjectStore } from "@/store/use-project-store";

// Run the initial Firestore load once on mount: open the most-recent project (or
// keep the in-memory empty one), then clear undo history so the load itself is
// not an undoable step. Always marks the store hydrated so the UI can proceed.
export function useFirestoreBootstrap(): void {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await useProjectStore.getState().hydrate();
      } catch {
        if (!cancelled) useProjectStore.setState({ hydrated: true });
      } finally {
        // Drop the placeholder→loaded transition from undo history.
        useProjectStore.temporal.getState().clear();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
