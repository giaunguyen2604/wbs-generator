import type { Role } from "@/types/role";

export type ColumnType = "text" | "number";

// A grid column that participates in keyboard navigation + paste/copy.
export type GridColumn = {
  field: string; // task field key or role key
  header: string;
  type: ColumnType;
  width: number; // px
  isEstimate?: boolean;
};

// Build the ordered editable columns. Order also defines paste expansion order.
export function buildGridColumns(roles: Role[], visibleRoleKeys: Set<string>): GridColumn[] {
  const base: GridColumn[] = [
    { field: "scheduleOrder", header: "Order", type: "number", width: 64 },
    { field: "code", header: "Code", type: "text", width: 72 },
    { field: "level1", header: "Level 1", type: "text", width: 150 },
    { field: "level2", header: "Level 2", type: "text", width: 180 },
  ];

  const estimateCols: GridColumn[] = roles
    .filter((r) => r.enabled && visibleRoleKeys.has(r.key))
    .map((r) => ({
      field: r.key,
      header: r.name,
      type: "number" as const,
      width: 80,
      isEstimate: true,
    }));

  const tail: GridColumn[] = [
    { field: "note", header: "Note", type: "text", width: 140 },
  ];

  return [...base, ...estimateCols, ...tail];
}
