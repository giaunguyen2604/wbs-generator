import type { Task } from "@/types/task";
import type { InputMode } from "@/types/project";
import { parseTsv, padGrid } from "@/domain/import/parse-tsv";
import { rowsToTasks } from "@/domain/import/rows-to-tasks";
import { parseNumberCell } from "@/utils/number-units";

// Per-Level-1 paste: a vertical list with NO Level 1 column. Fixed column order:
// Level 2 | Backend | Frontend | QC | BrS. Level 1 is supplied once by the user.
const GROUP_FIELD_MAPPING = ["level2", "backend", "frontend", "qc", "brs"];

// First row is a header when an estimate column (index 1..4) holds a non-numeric
// label (e.g. "Backend") instead of a number — then we drop it from the body.
function looksLikeHeader(row: string[]): boolean {
  return [1, 2, 3, 4].some((i) => {
    const cell = (row[i] ?? "").trim();
    return cell !== "" && parseNumberCell(cell) === null;
  });
}

export type BuildLevelGroupOptions = {
  level1: string;
  inputMode: InputMode;
  hoursPerDay: number;
  startOrder: number; // first displayOrder/scheduleOrder for this group
};

// Parse a pasted Level-2 list under one Level 1 group into Task objects.
export function buildLevelGroupTasks(text: string, opts: BuildLevelGroupOptions): Task[] {
  const grid = padGrid(parseTsv(text));
  if (grid.length === 0) return [];

  const rows = looksLikeHeader(grid[0]) ? grid.slice(1) : grid;
  return rowsToTasks(rows, GROUP_FIELD_MAPPING, {
    inputMode: opts.inputMode,
    hoursPerDay: opts.hoursPerDay,
    startOrder: opts.startOrder,
    forcedLevel1: opts.level1.trim(),
  });
}
