// Resource lane in parallel-track mode. Undefined in waterfall mode (single track).
export type ScheduleTrack = "be" | "fe" | "qc";
// Phase of a FE segment (UI vs API integration). Undefined when not applicable.
export type SchedulePhase = "ui" | "integration";

// Generated schedule data. NEVER persisted — always derived from tasks+config.
export type ScheduleSegment = {
  taskId: string;
  weekIndex: number; // 0-based week from startDate
  offsetUnits: number; // start position within the week (in internal units)
  durationUnits: number; // units consumed within this week
  track?: ScheduleTrack; // parallel-track mode: which resource lane
  phase?: SchedulePhase; // parallel-track mode: FE UI vs integration
};

// A week column in the rendered timeline.
export type WeekColumn = {
  weekIndex: number;
  year: number;
  month: number; // 1-12
  weekOfMonth: number; // 1-based label (W1, W2…)
  startDate: Date;
  endDate: Date;
  usedUnits: number; // capacity consumed across all tasks
};

export type GeneratedSchedule = {
  segments: ScheduleSegment[];
  weeks: WeekColumn[];
  weekCapacityUnits: number;
};
