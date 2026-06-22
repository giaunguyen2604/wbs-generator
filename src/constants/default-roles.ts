import { nanoid } from "nanoid";
import type { Role } from "@/types/role";

// Role color palette — distinct, accessible-ish hues for estimate columns.
const ROLE_COLORS: Record<string, string> = {
  backend: "#2563eb",
  frontend: "#7c3aed",
  qc: "#059669",
  brs: "#d97706",
};

const DEFAULT_ROLE_SEEDS = [
  { key: "backend", name: "Backend" },
  { key: "frontend", name: "Frontend" },
  { key: "qc", name: "QC" },
  { key: "brs", name: "BrS" },
];

// Factory so every new project gets fresh role ids.
export function createDefaultRoles(): Role[] {
  return DEFAULT_ROLE_SEEDS.map((seed) => ({
    id: nanoid(8),
    key: seed.key,
    name: seed.name,
    color: ROLE_COLORS[seed.key],
    enabled: true,
  }));
}
