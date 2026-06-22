import { ProjectSwitcher } from "@/components/app-toolbar/project-switcher";
import { UndoRedoButtons } from "@/components/app-toolbar/undo-redo-buttons";
import { BackupActions } from "@/components/app-toolbar/backup-actions";
import { SaveStatusIndicator } from "@/components/app-toolbar/save-status-indicator";

// Top app bar: title, project switcher, undo/redo, backup, save status.
export function AppToolbar() {
  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur">
      <h1 className="text-sm font-bold tracking-tight text-slate-800">
        WBS <span className="text-blue-600">Schedule</span> Generator
      </h1>
      <ProjectSwitcher />
      <UndoRedoButtons />
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <SaveStatusIndicator />
        <BackupActions />
      </div>
    </header>
  );
}
