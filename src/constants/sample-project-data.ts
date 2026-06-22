import { nanoid } from "nanoid";
import type { ProjectData } from "@/types/project";
import { createDefaultProjectConfig } from "@/constants/default-project-config";
import type { Task } from "@/types/task";

// Demo dataset so a new user can see a populated board immediately.
type Seed = [string, string, string, number, number, number, number];

// [code, level1, level2, backend, frontend, qc, brs] — estimates in days.
const SEEDS: Seed[] = [
  ["1.01", "Setup", "Project Setup", 0.5, 0.5, 0, 0.3],
  ["1.02", "Setup", "Database Schema", 1, 0, 0.3, 0.5],
  ["2.02", "Consumer Frontsite", "Authentication", 1.5, 0.5, 0.6, 0],
  ["2.03", "Consumer Frontsite", "Pickup", 0.5, 0.2, 0.3, 0],
  ["2.04", "Consumer Frontsite", "Chef Plan", 2.4, 1.0, 0.9, 0],
  ["2.05", "Consumer Frontsite", "Checkout", 2.0, 1.5, 1.0, 0.5],
  ["3.01", "Admin", "Dashboard", 1.2, 2.0, 0.8, 0],
  ["3.02", "Admin", "Reports", 1.0, 1.0, 0.5, 0.4],
];

function makeTask(seed: Seed, idx: number): Task {
  const [code, level1, level2, backend, frontend, qc, brs] = seed;
  return {
    id: nanoid(10),
    code,
    level1,
    level2,
    title: level2,
    displayOrder: idx + 1,
    scheduleOrder: idx + 1,
    estimates: { backend, frontend, qc, brs },
    enabled: true,
  };
}

export function createSampleProjectData(): ProjectData {
  const project = createDefaultProjectConfig("Sample Project");
  return {
    version: 1,
    project,
    tasks: SEEDS.map(makeTask),
    updatedAt: new Date().toISOString(),
  };
}
