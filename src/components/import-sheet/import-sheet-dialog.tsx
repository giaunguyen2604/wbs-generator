import { useMemo, useState } from "react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { LabeledField, inputClass } from "@/components/ui/labeled-field";
import { buildLevelGroupTasks } from "@/domain/import/build-level-group-tasks";
import { validateTasks } from "@/domain/import/validate-tasks";
import { useProjectStore } from "@/store/use-project-store";
import type { Task } from "@/types/task";

type Props = { open: boolean; onClose: () => void };

// Per-Level-1 import: enter a Level 1 name, paste its Level 2 list (Level 2 +
// estimate columns), add it to a staging list, repeat for more Level 1 groups,
// then commit everything at once (replace or append to the project).
export function ImportSheetDialog({ open, onClose }: Props) {
  const [level1, setLevel1] = useState("");
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<Task[]>([]);
  const [mode, setMode] = useState<"replace" | "append">("append");

  const project = useProjectStore((s) => s.data.project);
  const replaceTasks = useProjectStore((s) => s.replaceTasks);
  const appendTasks = useProjectStore((s) => s.appendTasks);

  // Live preview of the tasks the current Level 1 + pasted text would produce.
  const previewTasks = useMemo(() => {
    if (!level1.trim() || !text.trim()) return [];
    return buildLevelGroupTasks(text, {
      level1,
      inputMode: project.inputMode,
      hoursPerDay: project.hoursPerDay,
      startOrder: staged.length + 1,
    });
  }, [level1, text, project.inputMode, project.hoursPerDay, staged.length]);

  const previewWarnings = useMemo(
    () => validateTasks(previewTasks).filter((i) => i.level === "warning").length,
    [previewTasks]
  );

  // Group counts for the staged summary list.
  const stagedGroups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of staged) counts.set(t.level1, (counts.get(t.level1) ?? 0) + 1);
    return [...counts.entries()];
  }, [staged]);

  const reset = () => {
    setLevel1("");
    setText("");
    setStaged([]);
    setMode("append");
  };

  const handleAddGroup = () => {
    if (previewTasks.length === 0) return;
    // Re-number against the running staged length so orders stay sequential.
    const startOrder = staged.length + 1;
    const renumbered = previewTasks.map((t, i) => ({
      ...t,
      displayOrder: startOrder + i,
      scheduleOrder: startOrder + i,
    }));
    setStaged((prev) => [...prev, ...renumbered]);
    setLevel1("");
    setText("");
  };

  const handleConfirm = () => {
    if (staged.length === 0) return;
    if (mode === "replace") replaceTasks(staged);
    else appendTasks(staged);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      title="Import by Level 1"
      onClose={handleClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <div className="mr-auto flex gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />
              Replace all
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === "append"} onChange={() => setMode("append")} />
              Append
            </label>
          </div>
          <Button variant="primary" onClick={handleConfirm} disabled={staged.length === 0}>
            Import {staged.length} task{staged.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Staged groups summary */}
        {stagedGroups.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2 text-sm">
            <span className="text-slate-500">Added:</span>
            {stagedGroups.map(([name, count]) => (
              <span key={name} className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                {name} · {count}
              </span>
            ))}
            <Button variant="ghost" onClick={() => setStaged([])} className="ml-auto text-xs">
              Clear all
            </Button>
          </div>
        )}

        {/* Level 1 + paste area */}
        <LabeledField label="Level 1 name">
          <input
            value={level1}
            onChange={(e) => setLevel1(e.target.value)}
            placeholder="e.g. Consumer Frontsite"
            className={inputClass}
          />
        </LabeledField>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-600">
            Paste Level 2 rows — columns: Level 2 · Backend · Frontend · QC · BrS
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={"Authentication\t1.5\t0.5\t0.6\t0\nProfile\t1\t0.5\t0\t0"}
            className="w-full rounded-md border border-slate-300 p-2 font-mono text-xs focus:border-blue-400 focus:outline-none"
          />
        </div>

        {/* Preview line for the current group */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className={previewTasks.length > 0 ? "text-emerald-600" : "text-slate-400"}>
            {previewTasks.length > 0
              ? `${previewTasks.length} task(s) ready${previewWarnings > 0 ? ` · ${previewWarnings} warning(s)` : ""}`
              : "Enter a Level 1 name and paste rows to add a group."}
          </span>
          <Button variant="secondary" onClick={handleAddGroup} disabled={previewTasks.length === 0}>
            + Add this Level 1
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
}
