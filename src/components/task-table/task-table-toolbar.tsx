import type { Role } from "@/types/role";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/labeled-field";

type Props = {
  search: string;
  onSearch: (v: string) => void;
  selectedCount: number;
  roles: Role[];
  hiddenRoleKeys: Set<string>;
  onToggleRoleColumn: (key: string) => void;
  onAddRow: () => void;
  onDeleteSelected: () => void;
  onCopyTsv: () => void;
  onOpenImport: () => void;
};

// Action bar above the task grid: add/delete, search, column toggles, copy/import.
export function TaskTableToolbar(p: Props) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <Button variant="primary" onClick={p.onAddRow}>+ Row</Button>
      <Button variant="danger" onClick={p.onDeleteSelected} disabled={p.selectedCount === 0}>
        Delete{p.selectedCount > 0 ? ` (${p.selectedCount})` : ""}
      </Button>
      <input
        value={p.search}
        onChange={(e) => p.onSearch(e.target.value)}
        placeholder="Search tasks…"
        className={`${inputClass} w-40`}
        aria-label="Search tasks"
      />

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>Columns:</span>
          {p.roles.filter((r) => r.enabled).map((r) => (
            <label key={r.key} className="flex items-center gap-0.5">
              <input
                type="checkbox"
                checked={!p.hiddenRoleKeys.has(r.key)}
                onChange={() => p.onToggleRoleColumn(r.key)}
              />
              {r.name}
            </label>
          ))}
        </div>
        <Button variant="secondary" onClick={p.onCopyTsv}>Copy TSV</Button>
        <Button variant="secondary" onClick={p.onOpenImport}>Import</Button>
      </div>
    </div>
  );
}
