import type { ProjectData } from "@/types/project";
import { withConfigDefaults } from "@/constants/default-project-config";

// Export a project to a downloadable JSON string (backup, §15.4).
export function serializeProject(data: ProjectData): string {
  return JSON.stringify(data, null, 2);
}

// Parse + lightly validate an imported JSON backup.
export function parseProjectBackup(json: string): ProjectData {
  const parsed = JSON.parse(json) as ProjectData;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tasks)) {
    throw new Error("Invalid project file: missing tasks array.");
  }
  const project = parsed.project;
  if (!project || typeof project.id !== "string" || typeof project.name !== "string") {
    throw new Error("Invalid project file: missing project id or name.");
  }
  if (parsed.version !== 1) {
    throw new Error(`Unsupported project file version: ${String(parsed.version)}.`);
  }
  return withConfigDefaults(parsed);
}

// Trigger a browser download of the given text content.
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
