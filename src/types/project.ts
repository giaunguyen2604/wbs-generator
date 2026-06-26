import type { Role } from "@/types/role";
import type { Task } from "@/types/task";

export type InputMode = "days" | "hours";

// Schedule generation strategy:
// - "waterfall": each task duration = max(role estimates), packed sequentially.
// - "parallel-track": BE / FE / QC scheduled as parallel resource lanes with
//   cross dependencies (FE integration waits for BE; QC waits for FE).
export type ScheduleMode = "waterfall" | "parallel-track";

// Project-level configuration controlling schedule generation + input UX.
export type ProjectConfig = {
  id: string;
  name: string;
  startDate: string; // ISO date string; snapped to week boundary at render
  workingDaysPerWeek: number;
  hoursPerDay: number; // used only when inputMode === "hours"
  inputMode: InputMode;
  skipThresholdDays: number; // skip to next week when leftover <= this
  unitPerDay: number; // internal integer unit scale (default 10)
  displayMonths: number;
  scheduleMode: ScheduleMode; // default "waterfall"
  feUiRatio: number; // parallel-track: fraction of FE that is UI work (0..1, default 0.6)
  roles: Role[];
};

// Full persisted project payload (source of truth, schedule excluded).
export type ProjectData = {
  version: 1;
  project: ProjectConfig;
  tasks: Task[];
  updatedAt: string;
};

// Lightweight entry stored in the project index for the switcher.
export type ProjectListItem = {
  id: string;
  name: string;
  updatedAt: string;
};
