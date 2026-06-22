# Phase 07 — Task Input Table (Excel-like grid)

## Context Links
- Requirements §12.3 (table cols + features + keyboard + visual feedback), §11.B (grid paste), §11.0 (copy TSV), §12.6.1 (Sheets muscle memory), §16 (warnings).
- Plan overview: ./plan.md

## Overview
- **Priority:** P1 (core adoption driver)
- **Status:** pending
- **Description:** Editable WBS grid: columns per §12.3, inline edit, Excel-like keyboard navigation, TSV paste-into-grid (multi-cell, auto-create rows), range copy as TSV, drag/drop + keyboard reorder, fill-down, multi-select delete, show/hide role cols, inline warning badges, group color chips, real-time Duration.

## Key Insights
- This is the highest-effort phase; decompose aggressively (< 200 lines/file).
- Grid paste reuses Phase 05 parse-tsv (DRY). Copy emits TSV for round-trip (§11.0).
- Undo/redo from zundo already global — edits/reorder/delete all undoable.

## Requirements
- Columns (§12.3): Enabled, Schedule Order, Display Order, Code, Level1, Level2, role estimates (Backend/Frontend/QC/BrS dynamic), Duration (computed), Note. Show/hide role columns.
- Inline edit; commit on Enter/Tab; numeric cells parse numbers.
- Keyboard grid nav (§12.3): arrows move active cell; Enter/Tab commit+move; Ctrl/Cmd+C copy range TSV; Ctrl/Cmd+V paste TSV multi-cell (auto-create rows §11.B); Ctrl/Cmd+Z/Shift+Z undo/redo; Ctrl+D / drag fill-down.
- Row ops: add, duplicate, multi-select + bulk delete (confirm), search/filter, sort by schedule order.
- Drag/drop reorder via @dnd-kit with visible handle; Alt+↑/↓ keyboard move; reorder updates scheduleOrder → live regenerate.
- Visual feedback (§12.3): real-time Duration; warning badge per row (negative/duplicate-order/no-estimate); enabled=false or duration 0 dimmed; group color chip consistent with bars.

## Architecture
Controlled grid over store tasks. A small `use-grid-selection` hook tracks active cell + range. Cell renderers per type. Paste/copy handlers convert between TSV and cell ranges. dnd-kit SortableContext for rows.

## Related Code Files
**Create:**
- `src/components/task-table/task-table.tsx` (composition root)
- `src/components/task-table/task-table-header.tsx` (col visibility, sort)
- `src/components/task-table/task-row.tsx`, `sortable-task-row.tsx`
- `src/components/task-table/editable-cell.tsx`, `number-cell.tsx`, `text-cell.tsx`, `enabled-cell.tsx`
- `src/components/task-table/duration-cell.tsx` (derived)
- `src/components/task-table/group-color-chip.tsx`
- `src/components/task-table/row-warning-badge.tsx`
- `src/components/task-table/drag-handle.tsx`
- `src/components/task-table/table-toolbar.tsx` (add/duplicate/delete/search/col-toggle/copy buttons)
- `src/hooks/use-grid-selection.ts` (active cell + range + arrow nav)
- `src/hooks/use-grid-clipboard.ts` (copy range→TSV, paste TSV→cells via parse-tsv)
- `src/hooks/use-fill-down.ts`
- `src/domain/task/row-warnings.ts` (compute per-row warnings, reuse validate logic)
- `src/domain/task/tsv-range.ts` (cells↔TSV range mapping)

## Implementation Steps
1. Render table from store tasks with column config + show/hide roles.
2. Implement editable cells (text/number/checkbox); commit to store.updateTask.
3. `use-grid-selection`: track active cell + shift-range; arrow/Enter/Tab nav.
4. `use-grid-clipboard`: Ctrl+C → TSV of range; Ctrl+V → parse-tsv → write cells, auto-create rows when overflow (§11.B).
5. Fill-down (Ctrl+D / drag) copies value down selected range.
6. dnd-kit sortable rows + drag handle + Alt+↑/↓; on drop recompute scheduleOrder.
7. Toolbar: add/duplicate/multi-delete(confirm)/search-filter/copy-table-TSV/col-toggle.
8. Duration cell + row warning badges + dim disabled/zero rows + group color chip.

## Todo List
- [ ] table render + column visibility + sort
- [ ] editable text/number/checkbox cells → store
- [ ] grid selection + arrow/Enter/Tab nav
- [ ] copy range TSV + paste TSV multi-cell + auto-row
- [ ] fill-down (Ctrl+D/drag)
- [ ] dnd-kit reorder + drag handle + Alt+↑/↓ → scheduleOrder
- [ ] toolbar (add/dup/bulk-delete/search/col-toggle/copy)
- [ ] duration cell + warning badges + dim + color chip

## Success Criteria
- §21.6: paste TSV fills multi-cell + creates rows; copy round-trips to Sheets; keyboard nav + fill-down + undo/redo work; drag reorder changes scheduleOrder and board regenerates live; warnings inline non-blocking; files < 200 lines.

## Risk Assessment
- Keyboard nav vs input focus conflicts → manage focus carefully; capture keys at cell vs grid level.
- Paste perf on large ranges → batch store update in one action (one undo step).

## Security Considerations
- Untrusted paste text → parse only, escape on render.

## Next Steps
- Phase 08 board consumes same tasks; Phase 10 responsive table h-scroll.
