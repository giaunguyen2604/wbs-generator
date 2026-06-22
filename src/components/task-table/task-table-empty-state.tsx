import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/use-project-store";

type Props = { onOpenImport: () => void; onAddRow: () => void };

// Zero-setup onboarding shown when a project has no tasks.
export function TaskTableEmptyState({ onOpenImport, onAddRow }: Props) {
  const loadSample = useProjectStore((s) => s.loadSample);
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
      <p className="text-sm font-medium text-slate-600">No tasks yet</p>
      <p className="max-w-sm text-xs text-slate-400">
        Paste a WBS range from Google Sheets, add rows manually, or load a sample
        project to see the schedule board in action.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={onOpenImport}>Paste from Sheets</Button>
        <Button variant="secondary" onClick={onAddRow}>Add a row</Button>
        <Button variant="ghost" onClick={loadSample}>Load sample data</Button>
      </div>
    </div>
  );
}
