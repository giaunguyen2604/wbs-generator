import { useMemo, useState } from "react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useProjectStore } from "@/store/use-project-store";
import { useGeneratedSchedule } from "@/hooks/use-generated-schedule";
import { getTaskDurationDays } from "@/domain/schedule/task-duration";
import { validateTasks, issuesByTaskId } from "@/domain/import/validate-tasks";
import { colorForGroup } from "@/utils/group-color";
import { buildGridColumns } from "@/components/task-table/table-columns";
import { useGridNavigation } from "@/components/task-table/use-grid-navigation";
import { applyCellValue } from "@/store/apply-cell-value";
import { parseTsv, padGrid } from "@/domain/import/parse-tsv";
import { tasksToTsv, copyToClipboard } from "@/components/task-table/clipboard-tsv";
import { TaskTableRow } from "@/components/task-table/task-table-row";
import { TaskTableToolbar } from "@/components/task-table/task-table-toolbar";
import { TaskTableHeader } from "@/components/task-table/task-table-header";
import { TaskTableEmptyState } from "@/components/task-table/task-table-empty-state";

type Props = { onOpenImport: () => void };

// Excel-like editable WBS grid: inline edit, keyboard nav, paste/copy, drag reorder.
export function TaskTable({ onOpenImport }: Props) {
  const tasks = useProjectStore((s) => s.data.tasks);
  const roles = useProjectStore((s) => s.data.project.roles);
  const { groupColors } = useGeneratedSchedule();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hiddenRoleKeys, setHiddenRoleKeys] = useState<Set<string>>(new Set());

  const columns = useMemo(
    () => buildGridColumns(roles, new Set(roles.filter((r) => !hiddenRoleKeys.has(r.key)).map((r) => r.key))),
    [roles, hiddenRoleKeys]
  );
  const enabledRoleKeys = useMemo(() => roles.filter((r) => r.enabled).map((r) => r.key), [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) =>
      [t.code, t.level1, t.level2, t.title, t.note].some((v) => v?.toLowerCase().includes(q))
    );
  }, [tasks, search]);

  const issueMap = useMemo(() => issuesByTaskId(validateTasks(tasks)), [tasks]);
  const nav = useGridNavigation(filtered.length, columns.length);

  const updateTask = useProjectStore((s) => s.updateTask);
  const setTaskEnabled = useProjectStore((s) => s.setTaskEnabled);
  const duplicateTask = useProjectStore((s) => s.duplicateTask);
  const deleteTasks = useProjectStore((s) => s.deleteTasks);
  const addTask = useProjectStore((s) => s.addTask);
  const reorderTasks = useProjectStore((s) => s.reorderTasks);
  const pasteGrid = useProjectStore((s) => s.pasteGrid);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const commitCell = (taskId: string, field: string, value: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const { id: _id, ...patch } = applyCellValue(task, field, value);
    updateTask(taskId, patch);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!nav.active) return;
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return; // single value → normal edit
    e.preventDefault();
    const grid = padGrid(parseTsv(text));
    const fieldColumns = columns.slice(nav.active.col).map((c) => c.field);
    const anchorTask = filtered[nav.active.row];
    const anchorIndex = anchorTask ? tasks.findIndex((t) => t.id === anchorTask.id) : tasks.length;
    pasteGrid(anchorIndex < 0 ? tasks.length : anchorIndex, fieldColumns, grid);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    reorderTasks(arrayMove(ids, from, to));
  };

  const toggleSelect = (id: string, checked: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      checked ? next.add(id) : next.delete(id);
      return next;
    });

  const deleteSelected = () => {
    deleteTasks([...selected]);
    setSelected(new Set());
  };

  const copyTsv = () => copyToClipboard(tasksToTsv(tasks, columns));

  return (
    <div className="flex flex-col">
      <TaskTableToolbar
        search={search}
        onSearch={setSearch}
        selectedCount={selected.size}
        roles={roles}
        hiddenRoleKeys={hiddenRoleKeys}
        onToggleRoleColumn={(key) =>
          setHiddenRoleKeys((s) => {
            const next = new Set(s);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
          })
        }
        onAddRow={addTask}
        onDeleteSelected={deleteSelected}
        onCopyTsv={copyTsv}
        onOpenImport={onOpenImport}
      />

      {tasks.length === 0 ? (
        <TaskTableEmptyState onOpenImport={onOpenImport} onAddRow={addTask} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200" onPaste={handlePaste}>
          <table className="border-collapse">
            <TaskTableHeader columns={columns} />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filtered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {filtered.map((task, rowIndex) => (
                    <TaskTableRow
                      key={task.id}
                      task={task}
                      rowIndex={rowIndex}
                      columns={columns}
                      activeCol={nav.active?.row === rowIndex ? nav.active.col : null}
                      durationDays={getTaskDurationDays(task, enabledRoleKeys)}
                      color={colorForGroup(groupColors, task.level1)}
                      issues={issueMap.get(task.id) ?? []}
                      selected={selected.has(task.id)}
                      onActivateCell={(r, c) => nav.setActive({ row: r, col: c })}
                      onCommitCell={commitCell}
                      onNavKey={nav.handleNavKey}
                      onToggleEnabled={setTaskEnabled}
                      onToggleSelect={toggleSelect}
                      onDuplicate={duplicateTask}
                      onDelete={(id) => deleteTasks([id])}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      )}
    </div>
  );
}
