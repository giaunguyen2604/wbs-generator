// Header aliases for auto-mapping pasted Google Sheets columns to fields.
// Keys map to either a Task field or a role key (backend/frontend/qc/brs).
export const COLUMN_ALIASES: Record<string, string[]> = {
  level1: ["level 1", "l1", "group", "module"],
  level2: ["level 2", "l2", "feature", "task"],
  level3: ["level 3", "l3", "subtask"],
  level4: ["level 4", "l4"],
  code: ["#", "code", "wbs", "no.", "no"],
  backend: ["backend", "backend (d)", "be"],
  frontend: ["frontend", "frontend (d)", "fe", "front end"],
  qc: ["qc", "qa", "tester"],
  brs: ["brs", "business"],
  order: ["order", "priority", "sort", "schedule order"],
  note: ["note", "notes", "remark"],
};

// Canonical mapping target identifiers used by the import UI.
export type ImportFieldKey = keyof typeof COLUMN_ALIASES | "ignore";

export const ROLE_FIELD_KEYS = ["backend", "frontend", "qc", "brs"] as const;
