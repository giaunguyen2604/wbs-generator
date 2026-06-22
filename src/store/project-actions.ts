import type { ProjectData } from "@/types/project";
import type { ProjectStore, ProjectActions } from "@/store/store-types";
import { createEmptyProjectData } from "@/constants/default-project-config";
import { createSampleProjectData } from "@/constants/sample-project-data";
import { fetchProject, fetchProjectList, removeProject } from "@/storage/project-firestore-repository";
import { nanoid } from "nanoid";

type SetFn = (fn: (s: ProjectStore) => Partial<ProjectStore>) => void;
type GetFn = () => ProjectStore;

const stamp = (data: ProjectData): ProjectData => ({ ...data, updatedAt: new Date().toISOString() });

// Project- and config-level actions (switch, create, duplicate, import, roles).
// Data changes are persisted to Firestore by the debounced autosave hook; only
// structural ops (delete, list refresh, initial load) talk to Firestore here.
export function createProjectActions(set: SetFn, get: GetFn): ProjectActions {
  // Swap the active project in memory. Autosave persists it after the change.
  const setData = (data: ProjectData) => set(() => ({ data: stamp(data) }));

  const refreshProjectList = async () => {
    const list = await fetchProjectList();
    set(() => ({ projectList: list }));
  };

  return {
    updateConfig: (patch) =>
      set((s) => ({ data: stamp({ ...s.data, project: { ...s.data.project, ...patch } }) })),

    updateRoles: (roles) =>
      set((s) => ({ data: stamp({ ...s.data, project: { ...s.data.project, roles } }) })),

    renameProject: (name) =>
      set((s) => ({ data: stamp({ ...s.data, project: { ...s.data.project, name } }) })),

    loadProject: async (id) => {
      const data = await fetchProject(id);
      if (data) setData(data);
    },

    newProject: (name) => setData(createEmptyProjectData(name)),

    duplicateProject: () => {
      const src = get().data;
      const copy: ProjectData = {
        ...src,
        project: { ...src.project, id: nanoid(10), name: `${src.project.name} (copy)` },
        tasks: src.tasks.map((t) => ({ ...t })),
      };
      setData(copy);
    },

    clearTasks: () => set((s) => ({ data: stamp({ ...s.data, tasks: [] }) })),

    deleteProjectById: async (id) => {
      await removeProject(id);
      const list = await fetchProjectList();
      set(() => ({ projectList: list }));
      // If the active project was deleted, switch to another or create a fresh one.
      if (get().data.project.id === id) {
        const next = list[0] ? await fetchProject(list[0].id) : null;
        setData(next ?? createEmptyProjectData());
      }
    },

    importProjectData: (data) => setData(data),

    loadSample: () => setData(createSampleProjectData()),

    refreshProjectList,

    // Initial load: list projects, open the most recent, else keep the in-memory
    // empty project (it is saved on the first edit via autosave).
    hydrate: async () => {
      const list = await fetchProjectList();
      const recent = list[0] ? await fetchProject(list[0].id) : null;
      set(() => ({
        projectList: list,
        ...(recent ? { data: recent } : {}),
        hydrated: true,
      }));
    },
  };
}
