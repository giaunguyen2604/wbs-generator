import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/firebase-app";
import type { ProjectData, ProjectListItem } from "@/types/project";

// Async persistence layer backed by Firestore (replaces localStorage).
// One document per project, keyed by project.id, in the `projects` collection.
// The project list is derived from the collection — no separate index doc.
const PROJECTS = "projects";

const projectDoc = (id: string) => doc(db, PROJECTS, id);

// List all projects (lightweight fields only), most-recently-updated first.
export async function fetchProjectList(): Promise<ProjectListItem[]> {
  const snap = await getDocs(query(collection(db, PROJECTS), orderBy("updatedAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data() as ProjectData;
    return { id: d.id, name: data.project?.name ?? "Untitled", updatedAt: data.updatedAt ?? "" };
  });
}

// Load one full project payload, or null if it does not exist.
export async function fetchProject(id: string): Promise<ProjectData | null> {
  const snap = await getDoc(projectDoc(id));
  return snap.exists() ? (snap.data() as ProjectData) : null;
}

// Create or overwrite a project document.
export async function saveProject(data: ProjectData): Promise<void> {
  await setDoc(projectDoc(data.project.id), data);
}

// Permanently remove a project document.
export async function removeProject(id: string): Promise<void> {
  await deleteDoc(projectDoc(id));
}
