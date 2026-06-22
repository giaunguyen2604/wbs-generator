import { nanoid } from "nanoid";
import type { Task } from "@/types/task";
import { ROLE_FIELD_KEYS } from "@/constants/column-aliases";
import { parseNumberCell, hoursToDays } from "@/utils/number-units";
import type { InputMode } from "@/types/project";

export type RowsToTasksOptions = {
  inputMode: InputMode;
  hoursPerDay: number;
  startOrder: number; // first scheduleOrder/displayOrder value
  forcedLevel1?: string; // when set, every row inherits this Level 1 (per-level import)
};

// Convert mapped + filled rows into Task objects.
// fieldMapping: columnIndex -> field key ("level1", "backend", "order", …).
export function rowsToTasks(
  rows: string[][],
  fieldMapping: string[],
  opts: RowsToTasksOptions
): Task[] {
  const tasks: Task[] = [];

  rows.forEach((row, rowIdx) => {
    const get = (field: string): string => {
      const ci = fieldMapping.indexOf(field);
      return ci >= 0 ? (row[ci] ?? "").trim() : "";
    };

    const level1 = opts.forcedLevel1 ?? get("level1");
    const level2 = get("level2");
    // Skip fully empty rows. With a forced Level 1, a row counts as empty when it
    // has no Level 2 / code, so the inherited Level 1 alone does not create a task.
    if (opts.forcedLevel1 ? !level2 && !get("code") : !level1 && !level2 && !get("code")) return;

    const estimates: Record<string, number> = {};
    for (const roleKey of ROLE_FIELD_KEYS) {
      const ci = fieldMapping.indexOf(roleKey);
      if (ci < 0) continue;
      const parsed = parseNumberCell(row[ci] ?? "");
      const value = parsed === null ? 0 : Math.max(0, parsed);
      estimates[roleKey] =
        opts.inputMode === "hours" ? hoursToDays(value, opts.hoursPerDay) : value;
    }

    const orderRaw = parseNumberCell(get("order"));
    const order = orderRaw && orderRaw > 0 ? orderRaw : opts.startOrder + rowIdx;

    tasks.push({
      id: nanoid(10),
      code: get("code"),
      level1,
      level2,
      level3: get("level3") || undefined,
      level4: get("level4") || undefined,
      title: level2 || level1,
      displayOrder: opts.startOrder + rowIdx,
      scheduleOrder: order,
      estimates,
      enabled: true,
      note: get("note") || undefined,
    });
  });

  return tasks;
}
