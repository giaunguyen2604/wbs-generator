// WBS task row. Estimates are stored in DAYS keyed by Role.key.
export type Task = {
  id: string;
  code: string; // WBS code, e.g. "2.04"

  level1: string;
  level2?: string;
  level3?: string;
  level4?: string;

  title: string;

  displayOrder: number; // order shown in the table
  scheduleOrder: number; // order used to generate the schedule

  estimates: Record<string, number>; // role.key -> days

  enabled: boolean;
  color?: string;
  note?: string;
};
