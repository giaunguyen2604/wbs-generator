import { useProjectStore } from "@/store/use-project-store";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { inputClass } from "@/components/ui/labeled-field";

// Switch between projects + create/duplicate/delete. Storage supports many
// projects; this is the lightweight switcher (no full dashboard in MVP).
export function ProjectSwitcher() {
  const list = useProjectStore((s) => s.projectList);
  const activeId = useProjectStore((s) => s.data.project.id);
  const activeName = useProjectStore((s) => s.data.project.name);
  const loadProject = useProjectStore((s) => s.loadProject);
  const newProject = useProjectStore((s) => s.newProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const deleteProjectById = useProjectStore((s) => s.deleteProjectById);

  // The active project may not yet be in the persisted list (before first save).
  const options = list.some((p) => p.id === activeId)
    ? list
    : [{ id: activeId, name: activeName, updatedAt: "" }, ...list];

  const onDelete = async () => {
    const ok = await confirm({
      title: "Delete project",
      message: `Delete "${activeName}"? This removes it from this browser. Export a backup first if unsure.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) deleteProjectById(activeId);
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={activeId}
        onChange={(e) => loadProject(e.target.value)}
        className={`${inputClass} max-w-[180px]`}
        aria-label="Active project"
      >
        {options.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <Button variant="ghost" title="New project" onClick={() => newProject()}>＋</Button>
      <Button variant="ghost" title="Duplicate project" onClick={duplicateProject}>⧉</Button>
      <Button variant="ghost" title="Delete project" onClick={onDelete}>🗑</Button>
    </div>
  );
}
