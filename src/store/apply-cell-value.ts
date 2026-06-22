import type { Task } from "@/types/task";
import { ROLE_FIELD_KEYS } from "@/constants/column-aliases";
import { parseNumberCell } from "@/utils/number-units";

// Apply a single string value to a task field by field key (used by grid paste
// and inline edits). Returns a NEW task. Unknown fields are ignored.
export function applyCellValue(task: Task, field: string, raw: string): Task {
  const value = raw.trim();

  if ((ROLE_FIELD_KEYS as readonly string[]).includes(field)) {
    const n = parseNumberCell(value);
    return {
      ...task,
      estimates: { ...task.estimates, [field]: n === null ? 0 : Math.max(0, n) },
    };
  }

  switch (field) {
    case "code":
    case "level1":
    case "level2":
    case "level3":
    case "level4":
    case "title":
    case "note":
      return { ...task, [field]: value };
    case "order":
    case "scheduleOrder": {
      const n = parseNumberCell(value);
      return { ...task, scheduleOrder: n === null ? task.scheduleOrder : n };
    }
    case "displayOrder": {
      const n = parseNumberCell(value);
      return { ...task, displayOrder: n === null ? task.displayOrder : n };
    }
    default:
      return task;
  }
}
