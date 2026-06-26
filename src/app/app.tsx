import { useState } from "react";
import { AppToolbar } from "@/components/app-toolbar/app-toolbar";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ProjectConfigPanel } from "@/components/project-config/project-config-panel";
import { TaskTable } from "@/components/task-table/task-table";
import { ScheduleBoard } from "@/components/schedule-board/schedule-board";
import { ImportSheetDialog } from "@/components/import-sheet/import-sheet-dialog";
import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { PasscodeGate } from "@/components/passcode-gate/passcode-gate";
import { useAutosave } from "@/hooks/use-autosave";
import { useUndoRedoShortcuts } from "@/hooks/use-undo-redo";
import { useFirestoreBootstrap } from "@/hooks/use-firestore-bootstrap";
import { useProjectStore } from "@/store/use-project-store";

// Root layout: one screen with Config / Task Table / Schedule Board sections.
export function App() {
  const [importOpen, setImportOpen] = useState(false);
  const hydrated = useProjectStore((s) => s.hydrated);
  useFirestoreBootstrap();
  useAutosave();
  useUndoRedoShortcuts();

  if (!hydrated) {
    return (
      <PasscodeGate>
        <div className="flex min-h-full items-center justify-center text-sm text-slate-500">
          Loading projects…
        </div>
      </PasscodeGate>
    );
  }

  return (
    <PasscodeGate>
    <div className="min-h-full">
      <AppToolbar />

      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4">
        <CollapsibleSection title="Project Config" defaultOpen={false}>
          <ProjectConfigPanel />
        </CollapsibleSection>

        <CollapsibleSection title="Tasks (WBS)">
          <TaskTable onOpenImport={() => setImportOpen(true)} />
        </CollapsibleSection>

        <CollapsibleSection title="Schedule Board">
          <ScheduleBoard />
        </CollapsibleSection>
      </main>

      <ImportSheetDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ConfirmDialogHost />
    </div>
    </PasscodeGate>
  );
}
