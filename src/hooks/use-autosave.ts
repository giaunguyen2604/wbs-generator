import { useEffect, useRef } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { saveProject, fetchProjectList } from "@/storage/project-firestore-repository";

// Debounced autosave: persist source data to Firestore `delay`ms after the last
// change, then refresh the project list + expose save status. Writes are skipped
// until the initial Firestore hydration has completed.
export function useAutosave(delay = 600): void {
  const data = useProjectStore((s) => s.data);
  const hydrated = useProjectStore((s) => s.hydrated);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Don't write the placeholder/loaded state before hydration finishes.
    if (!hydrated) return;

    useProjectStore.setState({ saveStatus: "saving" });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Don't await the write: with offline persistence setDoc only resolves once
      // the server acknowledges, which never happens while offline. Treat the
      // local-cache write as success; a hard failure (e.g. rules) flips to error.
      saveProject(data).catch(() => useProjectStore.setState({ saveStatus: "error" }));
      fetchProjectList()
        .then((projectList) => useProjectStore.setState({ saveStatus: "saved", projectList }))
        .catch(() => useProjectStore.setState({ saveStatus: "saved" }));
    }, delay);

    return () => clearTimeout(timer.current);
  }, [data, hydrated, delay]);
}
