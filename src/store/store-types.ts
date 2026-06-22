import type { ProjectData, ProjectConfig, ProjectListItem } from "@/types/project";
import type { Task } from "@/types/task";
import type { Role } from "@/types/role";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// Patch shape for inline task edits (any subset of editable fields).
export type TaskPatch = Partial<Omit<Task, "id">>;

export type ProjectStoreState = {
  data: ProjectData; // the only undo-tracked slice
  projectList: ProjectListItem[];
  saveStatus: SaveStatus;
  hydrated: boolean; // true once the initial Firestore load has completed
};

export type TaskActions = {
  addTask: () => void;
  updateTask: (id: string, patch: TaskPatch) => void;
  updateEstimate: (id: string, roleKey: string, days: number) => void;
  deleteTasks: (ids: string[]) => void;
  duplicateTask: (id: string) => void;
  reorderTasks: (orderedIds: string[]) => void; // applies new scheduleOrder
  setTaskEnabled: (id: string, enabled: boolean) => void;
  replaceTasks: (tasks: Task[]) => void;
  appendTasks: (tasks: Task[]) => void;
  // Bulk grid paste: fieldColumns[c] is the target field for pasted column c,
  // starting at table row anchorRowIndex. Overflow rows are appended.
  pasteGrid: (anchorRowIndex: number, fieldColumns: string[], grid: string[][]) => void;
};

export type ProjectActions = {
  updateConfig: (patch: Partial<ProjectConfig>) => void;
  updateRoles: (roles: Role[]) => void;
  loadProject: (id: string) => Promise<void>;
  newProject: (name?: string) => void;
  duplicateProject: () => void;
  clearTasks: () => void;
  renameProject: (name: string) => void;
  deleteProjectById: (id: string) => Promise<void>;
  importProjectData: (data: ProjectData) => void;
  loadSample: () => void;
  // Initial Firestore load: pick the most-recent project or a fresh one.
  hydrate: () => Promise<void>;
  // Re-read the project list from Firestore (after saves/deletes).
  refreshProjectList: () => Promise<void>;
};

export type ProjectStore = ProjectStoreState & TaskActions & ProjectActions;
