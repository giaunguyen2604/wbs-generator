import { useRef } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import {
  serializeProject,
  parseProjectBackup,
  downloadTextFile,
} from "@/storage/project-json-backup";

// Export/import JSON backups + clear tasks (§15.4). Destructive ops confirm.
export function BackupActions() {
  const data = useProjectStore((s) => s.data);
  const importProjectData = useProjectStore((s) => s.importProjectData);
  const clearTasks = useProjectStore((s) => s.clearTasks);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const safe = data.project.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
    downloadTextFile(`${safe || "project"}.json`, serializeProject(data));
  };

  const onImportFile = async (file: File) => {
    try {
      const parsed = parseProjectBackup(await file.text());
      const ok = await confirm({
        title: "Import project",
        message: `Load "${parsed.project.name}"? It will be added as a project in this browser.`,
        confirmLabel: "Import",
      });
      if (ok) importProjectData(parsed);
    } catch (err) {
      await confirm({
        title: "Import failed",
        message: err instanceof Error ? err.message : "Could not read the file.",
        confirmLabel: "OK",
      });
    }
  };

  const onClear = async () => {
    const ok = await confirm({
      title: "Clear all tasks",
      message: "Remove every task from this project? You can undo with Ctrl/Cmd+Z.",
      confirmLabel: "Clear",
      danger: true,
    });
    if (ok) clearTasks();
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" onClick={onExport} title="Export JSON backup">Export</Button>
      <Button variant="ghost" onClick={() => fileRef.current?.click()} title="Import JSON backup">Import JSON</Button>
      <Button variant="ghost" onClick={onClear} title="Clear all tasks">Clear</Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImportFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
