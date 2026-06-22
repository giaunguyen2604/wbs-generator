import type { GridColumn } from "@/components/task-table/table-columns";

type Props = { columns: GridColumn[] };

// Sticky header row for the task grid (control cols + dynamic data cols).
export function TaskTableHeader({ columns }: Props) {
  const th = "border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-500";
  return (
    <thead className="sticky top-0 z-10">
      <tr>
        <th className={`${th} w-8`} aria-label="Reorder" />
        <th className={`${th} w-8`} aria-label="Select" />
        <th className={`${th} w-8`} title="Include in schedule">On</th>
        {columns.map((c) => (
          <th
            key={c.field}
            className={`${th} ${c.type === "number" ? "text-right" : "text-left"}`}
            style={{ width: c.width, minWidth: c.width }}
          >
            {c.header}
          </th>
        ))}
        <th className={`${th} text-right`} style={{ width: 80 }}>Duration</th>
        <th className={`${th} w-8`} title="Validation">!</th>
        <th className={`${th} w-16`}>Actions</th>
      </tr>
    </thead>
  );
}
