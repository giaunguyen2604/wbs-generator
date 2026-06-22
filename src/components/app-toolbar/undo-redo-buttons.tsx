import { Button } from "@/components/ui/button";
import { useUndoRedo } from "@/hooks/use-undo-redo";

// Undo/redo buttons bound to the zundo temporal store.
export function UndoRedoButtons() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" onClick={() => undo()} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">
        ↶ Undo
      </Button>
      <Button variant="ghost" onClick={() => redo()} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">
        ↷ Redo
      </Button>
    </div>
  );
}
