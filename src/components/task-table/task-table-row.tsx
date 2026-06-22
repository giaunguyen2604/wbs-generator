import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/task";
import type { GridColumn } from "@/components/task-table/table-columns";
import type { ValidationIssue } from "@/domain/import/validate-tasks";
import { EditableCell } from "@/components/task-table/editable-cell";
import { readTaskField } from "@/components/task-table/read-task-field";

type Props = {
  task: Task;
  rowIndex: number;
  columns: GridColumn[];
  activeCol: number | null;
  durationDays: number;
  color: string;
  issues: ValidationIssue[];
  selected: boolean;
  onActivateCell: (row: number, col: number) => void;
  onCommitCell: (taskId: string, field: string, value: string) => void;
  onNavKey: (e: React.KeyboardEvent) => boolean;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onToggleSelect: (id: string, checked: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

// A single draggable task row with inline-editable cells + row actions.
export function TaskTableRow(p: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const dim = !p.task.enabled || p.durationDays <= 0;
  const errorCount = p.issues.filter((i) => i.level === "error").length;
  const warnCount = p.issues.filter((i) => i.level === "warning").length;

  return (
    <tr ref={setNodeRef} style={style} className={dim ? "bg-slate-50 text-slate-400" : "bg-white"}>
      <td className="border-b border-slate-100 px-1 text-center">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab px-1 text-slate-300 hover:text-slate-500"
        >
          ⠿
        </button>
      </td>
      <td className="border-b border-slate-100 px-1 text-center">
        <input
          type="checkbox"
          checked={p.selected}
          onChange={(e) => p.onToggleSelect(p.task.id, e.target.checked)}
          aria-label="Select row"
        />
      </td>
      <td className="border-b border-slate-100 px-1 text-center">
        <input
          type="checkbox"
          checked={p.task.enabled}
          onChange={(e) => p.onToggleEnabled(p.task.id, e.target.checked)}
          aria-label="Enable in schedule"
        />
      </td>

      {p.columns.map((col, ci) => (
        <EditableCell
          key={col.field}
          value={readTaskField(p.task, col.field)}
          type={col.type}
          width={col.width}
          align={col.type === "number" ? "right" : "left"}
          active={p.activeCol === ci}
          onActivate={() => p.onActivateCell(p.rowIndex, ci)}
          onCommit={(v) => p.onCommitCell(p.task.id, col.field, v)}
          onNavKey={p.onNavKey}
        />
      ))}

      <td className="border-b border-r border-slate-100 px-2 py-1 text-right text-sm font-medium">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
          {p.durationDays > 0 ? p.durationDays : "—"}
        </span>
      </td>

      <td className="border-b border-slate-100 px-1 text-center">
        {(errorCount > 0 || warnCount > 0) && (
          <span
            title={p.issues.map((i) => i.message).join("\n")}
            className={errorCount > 0 ? "text-red-500" : "text-amber-500"}
          >
            {errorCount > 0 ? "⛔" : "⚠"}
          </span>
        )}
      </td>
      <td className="border-b border-slate-100 px-1 text-center whitespace-nowrap">
        <button onClick={() => p.onDuplicate(p.task.id)} title="Duplicate" className="px-1 text-slate-400 hover:text-slate-600">⧉</button>
        <button onClick={() => p.onDelete(p.task.id)} title="Delete" className="px-1 text-slate-400 hover:text-red-600">🗑</button>
      </td>
    </tr>
  );
}
