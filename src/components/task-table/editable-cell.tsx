import { useEffect, useRef, useState } from "react";
import type { ColumnType } from "@/components/task-table/table-columns";

type Props = {
  value: string;
  type: ColumnType;
  active: boolean;
  width: number;
  align?: "left" | "right";
  onActivate: () => void;
  onCommit: (value: string) => void;
  onNavKey: (e: React.KeyboardEvent) => boolean;
};

// One editable grid cell. Shows text until focused; commits on blur/Enter.
// Keyboard navigation is delegated to onNavKey (arrow/Tab/Enter).
export function EditableCell({ value, type, active, width, align, onActivate, onCommit, onNavKey }: Props) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  // Sync external value when not actively editing.
  useEffect(() => setDraft(value), [value]);

  // Focus + select when this becomes the active cell.
  useEffect(() => {
    if (active && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [active]);

  const commit = () => {
    if (draft !== value) onCommit(draft);
  };

  return (
    <td
      className="border-b border-r border-slate-100 p-0"
      style={{ width, minWidth: width, maxWidth: width }}
      onClick={onActivate}
    >
      <input
        ref={ref}
        value={draft}
        inputMode={type === "number" ? "decimal" : "text"}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={onActivate}
        onBlur={commit}
        onKeyDown={(e) => {
          if (onNavKey(e)) commit();
        }}
        className={`w-full bg-transparent px-2 py-1 text-sm outline-none focus:bg-blue-50 ${
          align === "right" ? "text-right" : "text-left"
        }`}
      />
    </td>
  );
}
