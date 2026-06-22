# WBS Schedule Generator — System Architecture

## Overview

**WBS Schedule Generator** is a frontend-only React SPA that auto-generates weekly project schedules from WBS task data. The app replaces manual Google Sheets color-coding with instant, regenerative scheduling.

**Core principle:** Source data (tasks + config) → Pure domain logic → Generated schedule → UI render.
Generated schedule is **never persisted**; it's always derived on demand from source data.

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│  UI Layer (React Components)                         │
│  - App shell, config panel, task table, schedule     │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│  Hooks & Custom Logic                               │
│  - useGeneratedSchedule (memoized)                  │
│  - useAutosave (debounced 500ms)                    │
│  - useUndoRedo (keyboard shortcuts Ctrl+Z/Shift+Z)  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│  Store (Zustand + zundo)                            │
│  - ProjectStore: data + actions                     │
│  - Temporal undo/redo (~50 snapshots in-memory)     │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│  Domain Logic (Pure Functions)                      │
│  - Schedule generation (packing algorithm)          │
│  - Task duration (MAX of role estimates)            │
│  - Import pipeline (TSV → Tasks)                    │
│  - Calendar & week math                             │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│  Storage & Utilities                                │
│  - localStorage (project persistence)              │
│  - Number units conversion (days ↔ units)           │
│  - Type definitions (Task, Project, Schedule)       │
└─────────────────────────────────────────────────────┘
```

---

## Key Modules by Responsibility

### Types (`src/types/`)
Single source of truth for data shape.

| File | Purpose |
|------|---------|
| `task.ts` | Task: WBS code, levels 1–4, estimates per role, display/schedule order |
| `project.ts` | ProjectConfig: startDate, working days/week, input mode, roles |
| `schedule.ts` | ScheduleSegment (generated), WeekColumn, GeneratedSchedule |
| `role.ts` | Role: id, key, name, color, enabled flag |

### Constants (`src/constants/`)
Immutable defaults and sample data.

| File | Purpose |
|------|---------|
| `default-roles.ts` | Backend, Frontend, QC, BrS roles |
| `default-project-config.ts` | 5 working days/week, 10 units/day, 0.5 skip threshold |
| `column-aliases.ts` | TSV column name variations (Level 1, L1, Module; Backend, BE, etc.) |
| `sample-project-data.ts` | Demo project for "Load sample data" button |

### Utilities (`src/utils/`)
Conversion and helper functions.

| File | Purpose |
|------|---------|
| `number-units.ts` | daysToUnits, unitsToDays, hoursToDays, formatDays, parseNumberCell |
| `week-calendar.ts` | Date math: week boundaries, Monday starts, month/week labeling |
| `task-factory.ts` | Task creation with defaults (id, displayOrder, scheduleOrder) |
| `group-color.ts` | Auto-assign consistent colors to level1 groups |

### Domain Logic (`src/domain/`)
Pure, testable business logic (no React, no state mutations).

#### `domain/schedule/`
Schedule generation engine.

| File | Purpose |
|------|---------|
| `generate-segments.ts` | Core packing algorithm: sort by scheduleOrder, fill weeks, skip near-empty weeks |
| `task-duration.ts` | Duration = MAX(enabled role estimates); respects inputMode (days/hours) |
| `generate-schedule.ts` | Orchestrate: generate segments, build week columns, compute capacity |
| `bar-geometry.ts` | Index segments for efficient rendering; compute bar position/width % |
| `build-week-columns.ts` | Create WeekColumn[] with date ranges, month/week labels |

#### `domain/import/`
TSV → Task conversion pipeline.

| File | Purpose |
|------|---------|
| `parse-tsv.ts` | Split text by tabs/newlines, pad grid to rectangle |
| `detect-header.ts` | Heuristic: is first row a header? (e.g., contains "Level 1", "Backend") |
| `map-columns.ts` | Alias matching: map column names to field keys (e.g., "BE" → "backend") |
| `fill-down-groups.ts` | Fill blank group cells with nearest non-blank above (Sheets behavior) |
| `rows-to-tasks.ts` | Convert grid rows → Task objects, assign display/schedule order |
| `validate-tasks.ts` | Check for missing required fields, invalid estimates, duplicate orders |
| `import-pipeline.ts` | Orchestrate: parse, detect header, map, fill-down, convert |

### Store (`src/store/`)
Zustand state management with zundo undo/redo.

| File | Purpose |
|------|---------|
| `use-project-store.ts` | Root Zustand store (temporal wrapper for in-memory undo, limit: 50 snapshots) |
| `store-types.ts` | ProjectStore interface (data, saveStatus, actions) |
| `bootstrap-initial-data.ts` | Load from localStorage or create empty project |
| `task-actions.ts` | updateTask, addTask, deleteTask, reorderTasks, importTasks, clearAll |
| `project-actions.ts` | updateProjectConfig, switchProject, createProject, deleteProject |
| `apply-cell-value.ts` | Parse & apply a cell edit (number, text, date) to a task field |
| `data-helpers.ts` | getEnabledRoles, isTaskValid, task lookup helpers |

### Storage (`src/storage/`)
localStorage persistence layer.

| File | Purpose |
|------|---------|
| `project-storage.ts` | readProject, writeProject, deleteProject, project list index |
| `project-json-backup.ts` | Export/import JSON for backup (user-triggered, not auto) |
| `storage-keys.ts` | Key constants: `schedule-app:project:{id}`, `schedule-app:project-list` |

### Hooks (`src/hooks/`)
React custom hooks for reactive logic.

| File | Purpose |
|------|---------|
| `use-generated-schedule.ts` | Memoized: derive schedule from store data (recomputes only when data changes) |
| `use-autosave.ts` | Debounce save: watch store data, write to localStorage every 500ms |
| `use-undo-redo.ts` | Keyboard: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo |

### Components (`src/components/`)
Presentational React components.

#### `components/app-toolbar/`
Top action bar.

| File | Purpose |
|------|---------|
| `app-toolbar.tsx` | Header layout: undo/redo, project switcher, backup actions, save status |
| `undo-redo-buttons.tsx` | Buttons wired to zundo temporal store |
| `project-switcher.tsx` | Dropdown: create new, load, delete, duplicate projects |
| `backup-actions.tsx` | Export JSON, import JSON, clear with confirm |
| `save-status-indicator.tsx` | Shows "Saved" when data hits localStorage |

#### `components/project-config/`
Configuration section.

| File | Purpose |
|------|---------|
| `project-config-panel.tsx` | Form: project name, start date, working days, skip threshold, display months |
| `role-settings.tsx` | Manage roles: enable/disable, rename, reorder, add/remove |

#### `components/task-table/`
Editable task grid with keyboard nav.

| File | Purpose |
|------|---------|
| `task-table.tsx` | Main table layout, inline cell editing |
| `task-table-header.tsx` | Column headers: enabled, order, code, levels, estimates, duration, note |
| `task-table-row.tsx` | One row per task; contains EditableCell for each field |
| `editable-cell.tsx` | Inline cell editor: number, text, date inputs with validation |
| `table-columns.ts` | Column definitions: field key, label, renderer, editor |
| `task-table-toolbar.tsx` | Add row, delete selected, copy as TSV, paste TSV, fill-down |
| `use-grid-navigation.ts` | Keyboard: arrow keys, Enter/Tab, copy/paste, undo/redo shortcuts |
| `clipboard-tsv.ts` | TSV serialization: copy table → clipboard, paste clipboard → grid |
| `read-task-field.ts` | Safe field read with display conversion (units → days, etc.) |

#### `components/schedule-board/`
Timeline view.

| File | Purpose |
|------|---------|
| `schedule-board.tsx` | Main layout: sticky left columns + scrollable timeline |
| `board-layout.ts` | Sticky column widths (code, level1, level2, estimates, duration) |
| `board-timeline-header.tsx` | Month/week headers with date ranges, today marker |
| `board-task-row.tsx` | One row per task; renders schedule bars from segments |
| `schedule-bar.tsx` | Colored bar with hover tooltip (task, duration, week %, capacity) |
| `board-empty-state.tsx` | Guidance when no enabled tasks exist |

#### `components/import-sheet/`
Import dialog and preview.

| File | Purpose |
|------|---------|
| `import-sheet-dialog.tsx` | Modal: textarea input, parse, preview, mapping, confirm |
| `import-preview-table.tsx` | Show parsed grid with mapped columns highlighted |
| `column-mapping-select.tsx` | Dropdown per column: select field (level1, code, backend, etc.) |

#### `components/ui/`
Reusable UI primitives.

| File | Purpose |
|------|---------|
| `button.tsx` | Styled button (primary, secondary, sm/md/lg) |
| `modal-dialog.tsx` | Modal wrapper (title, close, footer actions) |
| `confirm-dialog.tsx` | Confirmation: "Are you sure?"; wraps destructive actions |
| `collapsible-section.tsx` | Expandable panel (config, tasks, board default collapsed/open) |
| `labeled-field.tsx` | Label + input wrapper; required asterisk |

---

## Data Flow & State Mutations

### Read Path: Schedule Generation
```
useGeneratedSchedule() [React hook]
  ↓ useMemo (deps: [data])
  generateSchedule(data)
    ├ generateSegments(tasks, config)
    │   └ Packing algorithm: sort by scheduleOrder, fill weeks
    ├ buildWeekColumns(config, weekCount)
    │   └ Compute week dates, labels, capacity
    └ indexSegmentsByTaskWeek()
        └ Segment lookup by task+week for rendering
```

### Write Path: Task Edit
```
User types in cell
  ↓ EditableCell onChange
  useProjectStore.updateTask(taskId, field, value)
    ├ Zustand set() → state.data.tasks[…]
    ├ zundo captures snapshot (if different)
    ├ React re-render
    ├ useGeneratedSchedule recomputes (deps: [data])
    ├ ScheduleBoard re-renders with new bars
    └ useAutosave debounces → writeProject to localStorage
```

### Undo/Redo Path
```
Ctrl+Z pressed
  ↓ useUndoRedoShortcuts hook
  zundo temporal.undo()
    ├ Restore previous state snapshot
    ├ useGeneratedSchedule recomputes
    └ UI re-renders
```

### Import Path
```
User pastes TSV + confirms import
  ↓ buildTasksFromImport(rows, fieldMapping, opts)
  useProjectStore.importTasks(tasks, mode)
    ├ Zustand: replace or append tasks
    ├ Re-number scheduleOrder (if replace)
    ├ zundo captures snapshot
    ├ useGeneratedSchedule recomputes
    └ useAutosave debounces → localStorage
```

---

## Key Design Patterns

### 1. Source of Truth Principle
- **Persisted:** Task data + ProjectConfig only
- **Derived:** ScheduleSegments, WeekColumns, UI state (expand/collapse)
- **Transient:** Undo/redo history (in-memory, max 50 snapshots, never persisted)

### 2. Integer Units for Schedule Math
- 1 day = 10 units (configurable via `unitPerDay`)
- Avoids floating-point drift when splitting tasks across weeks
- Conversion: `daysToUnits(days, 10)`, `unitsToDays(units, 10)`

### 3. Memoization for Schedule Regeneration
- `useGeneratedSchedule()` uses `useMemo([data])`
- Schedule only recalculates when tasks or config change
- Prevents unnecessary re-renders on UI state changes (e.g., collapse toggle)

### 4. Zustand with Temporal (zundo) for Undo/Redo
- Partialize: only `data` is tracked, not UI state
- Limit: ~50 snapshots to prevent unbounded growth
- Scope: global undo (any task, config, import, clear)

### 5. Debounced Auto-Save
- 500ms debounce after last store change
- Avoids excessive localStorage writes
- "Saved" indicator shows when write completes

### 6. TSV Round-Trip with Google Sheets
- Copy table/schedule → clipboard as TSV
- Paste from Sheets → import with column mapping
- Support both header auto-detection + user mapping
- Fill-down blank group cells (Sheets convention)

### 7. Pure Domain Logic
- `generateSegments()`, `getTaskDuration()`, `buildWeekColumns()` are pure functions
- Easy to test, mock, or refactor without React coupling
- Enables future CLI/server-side use

---

## Performance Considerations

### What's Memoized
1. **useGeneratedSchedule():** Recomputes only when `data` changes
2. **React.memo on task rows:** Prevents re-render unless task changed
3. **Week columns:** Built once per schedule regeneration

### What's Not Memoized (OK for MVP)
- Task table rows (re-render on store change, but fast due to cell-level onChange)
- Import preview grid (not perf-critical)

### Scaling Notes
- MVP tested with ~50 tasks; scales to ~200 with memoization
- If >300 tasks needed, consider virtualizing task table rows
- localStorage limit ~5–10MB per origin; ~1000 tasks should fit safely

---

## Storage & Persistence

### localStorage Keyspace
```
schedule-app:project-list          → ProjectListItem[]
schedule-app:project:{projectId}   → ProjectData
schedule-app:activeProjectId       → string (currently open project)
```

### Never Persisted
- Generated schedule (ScheduleSegments, WeekColumns)
- Undo/redo history
- UI state (panel open/collapse)

### Export/Import (Manual)
- User clicks "Export JSON" → downloads JSON file
- User clicks "Import JSON" → selects file, reads, replaces current project
- Goal: data portability; no lock-in

---

## Integration Points

### External Dependencies
- **React 18:** UI framework
- **Zustand 4.5.5:** State management
- **zundo 2.3.0:** Temporal undo/redo middleware
- **@dnd-kit 6.1.0 + 8.0.0:** Drag-drop reorder tasks
- **nanoid 5.0.7:** Unique IDs (taskId, roleId, projectId)
- **Tailwind CSS 3.x:** Styling

### Browser APIs Used
- **localStorage:** Project persistence
- **Clipboard API:** Copy/paste TSV
- **Drag & Drop (HTML5):** Reorder tasks
- **Date API:** Week math, date parsing

### Accessibility
- Semantic HTML (table, button, input, label)
- ARIA labels on interactive elements
- Keyboard navigation (arrows, Enter, Tab, Ctrl+Z)
- Sufficient color contrast (Tailwind defaults)

---

## Testing Strategy

### Unit Tests (Vitest)
- `domain/schedule/` — packing algorithm, duration, week math
- `utils/number-units.ts` — conversion edge cases
- `domain/import/` — parse, map, fill-down, validate
- `storage/` — localStorage I/O

### Integration Tests
- Import TSV → generate schedule → verify bars
- Edit task → verify undo/redo snapshot
- Drag reorder → verify scheduleOrder update

### Manual (No E2E in MVP)
- Keyboard nav, copy/paste, drag/drop
- Responsive layout on mobile, tablet, desktop
- Round-trip Sheets ↔ app

---

## Future Enhancements

1. **Task dependencies & critical path** — Identify blocking tasks
2. **Resource capacity** — Detect over-allocation per role
3. **Holiday calendar** — Skip non-working days
4. **Schedule per role** — Separate timelines by Backend/Frontend/QC
5. **Cloud sync** — Supabase/Firebase for multi-device access
6. **Mobile card view** — Edit tasks via bottom sheet on phones
7. **Direct Sheets API** — Two-way sync with Google Sheets

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-21
