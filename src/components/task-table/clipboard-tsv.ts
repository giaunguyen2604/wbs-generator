import type { Task } from "@/types/task";
import type { GridColumn } from "@/components/task-table/table-columns";
import { readTaskField } from "@/components/task-table/read-task-field";

// Serialize tasks to TSV (header + rows) for pasting back into Google Sheets.
export function tasksToTsv(tasks: Task[], columns: GridColumn[]): string {
  const header = columns.map((c) => c.header).join("\t");
  const rows = tasks.map((t) => columns.map((c) => readTaskField(t, c.field)).join("\t"));
  return [header, ...rows].join("\n");
}

// Best-effort clipboard write with a legacy fallback.
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}
