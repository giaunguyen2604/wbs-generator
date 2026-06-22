import type { Task } from "@/types/task";
import { ROLE_FIELD_KEYS } from "@/constants/column-aliases";
import { formatDays } from "@/utils/number-units";

// Read a task field as a display string for a grid cell / TSV copy.
export function readTaskField(task: Task, field: string): string {
  if ((ROLE_FIELD_KEYS as readonly string[]).includes(field)) {
    return formatDays(task.estimates[field]);
  }
  switch (field) {
    case "scheduleOrder":
      return String(task.scheduleOrder);
    case "displayOrder":
      return String(task.displayOrder);
    case "code":
      return task.code ?? "";
    case "level1":
      return task.level1 ?? "";
    case "level2":
      return task.level2 ?? "";
    case "level3":
      return task.level3 ?? "";
    case "level4":
      return task.level4 ?? "";
    case "title":
      return task.title ?? "";
    case "note":
      return task.note ?? "";
    default:
      return "";
  }
}
