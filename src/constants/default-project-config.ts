import { nanoid } from "nanoid";
import type { ProjectConfig, ProjectData } from "@/types/project";
import { createDefaultRoles } from "@/constants/default-roles";

// Today's date as ISO yyyy-mm-dd (local), used as default project start.
function todayIso(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function createDefaultProjectConfig(name = "Untitled Project"): ProjectConfig {
  return {
    id: nanoid(10),
    name,
    startDate: todayIso(),
    workingDaysPerWeek: 5,
    hoursPerDay: 8,
    inputMode: "days",
    skipThresholdDays: 0.5,
    unitPerDay: 10,
    displayMonths: 3,
    scheduleMode: "waterfall",
    feUiRatio: 0.6,
    roles: createDefaultRoles(),
  };
}

// Backfill config fields added after a project was first saved, so older
// Firestore/JSON payloads stay valid (controlled inputs, correct routing).
export function withConfigDefaults(data: ProjectData): ProjectData {
  const p = data.project;
  return {
    ...data,
    project: {
      ...p,
      scheduleMode: p.scheduleMode ?? "waterfall",
      feUiRatio: typeof p.feUiRatio === "number" ? p.feUiRatio : 0.6,
    },
  };
}

export function createEmptyProjectData(name?: string): ProjectData {
  return {
    version: 1,
    project: createDefaultProjectConfig(name),
    tasks: [],
    updatedAt: new Date().toISOString(),
  };
}
