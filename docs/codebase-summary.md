# WBS Schedule Generator — Codebase Summary

## Directory Structure

```
src/
├── app/
│   └── app.tsx                        Root layout: AppToolbar, Config, TaskTable, ScheduleBoard
├── components/
│   ├── app-toolbar/
│   │   ├── app-toolbar.tsx            Header: undo/redo, project switcher, backup, save status
│   │   ├── undo-redo-buttons.tsx      Undo/redo buttons wired to zundo
│   │   ├── project-switcher.tsx       Dropdown: new, load, delete, duplicate projects
│   │   ├── backup-actions.tsx         Export/import JSON, clear project
│   │   └── save-status-indicator.tsx  "Saved" indicator
│   ├── project-config/
│   │   ├── project-config-panel.tsx   Form: name, start date, days/week, threshold
│   │   └── role-settings.tsx          Manage roles: enable/disable, add/remove
│   ├── task-table/
│   │   ├── task-table.tsx             Main grid with inline editing
│   │   ├── task-table-header.tsx      Column headers
│   │   ├── task-table-row.tsx         One task row with editable cells
│   │   ├── editable-cell.tsx          Number/text/date input cell
│   │   ├── table-columns.ts           Column defs (field, label, editor type)
│   │   ├── task-table-toolbar.tsx     Add, delete, copy, paste, fill-down buttons
│   │   ├── use-grid-navigation.ts     Keyboard: arrow, Enter, Tab, copy/paste
│   │   ├── clipboard-tsv.ts           TSV serialization for copy/paste
│   │   ├── read-task-field.ts         Safe field read with unit conversion
│   │   └── task-table-empty-state.tsx Placeholder when no tasks
│   ├── schedule-board/
│   │   ├── schedule-board.tsx         Timeline with sticky left columns
│   │   ├── board-layout.ts            Sticky column widths
│   │   ├── board-timeline-header.tsx  Month/week headers, today marker
│   │   ├── board-task-row.tsx         One row with schedule bars
│   │   ├── schedule-bar.tsx           Colored bar with tooltip
│   │   └── board-empty-state.tsx      Guidance when no tasks scheduled
│   ├── import-sheet/
│   │   ├── import-sheet-dialog.tsx    Modal: paste, preview, map, confirm
│   │   ├── import-preview-table.tsx   Grid preview with column mapping
│   │   └── column-mapping-select.tsx  Dropdown per column
│   └── ui/
│       ├── button.tsx                 Styled button
│       ├── modal-dialog.tsx           Modal wrapper
│       ├── confirm-dialog.tsx         Confirmation dialog + host
│       ├── collapsible-section.tsx    Expandable panel
│       └── labeled-field.tsx          Label + input wrapper
├── constants/
│   ├── default-roles.ts               Backend, Frontend, QC, BrS
│   ├── default-project-config.ts      5 days/week, 10 units/day, 0.5 skip threshold
│   ├── column-aliases.ts              TSV column name variations
│   └── sample-project-data.ts         Demo project
├── domain/
│   ├── schedule/
│   │   ├── generate-segments.ts       Core packing algorithm (~60 lines)
│   │   ├── task-duration.ts           Duration = MAX(enabled estimates)
│   │   ├── generate-schedule.ts       Orchestrate segments + week columns
│   │   ├── bar-geometry.ts            Segment indexing + bar position %
│   │   ├── build-week-columns.ts      Create WeekColumn[] with dates
│   │   └── generate-segments.test.ts  Unit tests
│   └── import/
│       ├── parse-tsv.ts              TSV → grid (split tabs/newlines)
│       ├── map-columns.ts            Map column names → field keys
│       ├── fill-down-groups.ts       Fill blank group cells (Sheets behavior)
│       ├── rows-to-tasks.ts          Grid rows → Task objects
│       ├── validate-tasks.ts         Check for errors/warnings
│       ├── import-pipeline.ts        Orchestrate parse → map → fill → validate
│       └── import-pipeline.test.ts   Unit tests
├── hooks/
│   ├── use-generated-schedule.ts      Memoized: derive schedule from data
│   ├── use-autosave.ts                Debounce → localStorage
│   └── use-undo-redo.ts               Keyboard shortcuts: Ctrl/Cmd+Z/Shift+Z
├── store/
│   ├── use-project-store.ts           Zustand + zundo temporal wrapper
│   ├── store-types.ts                 ProjectStore interface
│   ├── bootstrap-initial-data.ts      Load from localStorage or create empty
│   ├── task-actions.ts                updateTask, addTask, deleteTask, etc.
│   ├── project-actions.ts             updateConfig, createProject, etc.
│   ├── apply-cell-value.ts            Parse & apply cell edit to task field
│   └── data-helpers.ts                getEnabledRoles, isTaskValid, etc.
├── storage/
│   ├── project-storage.ts             localStorage I/O (CRUD)
│   ├── project-json-backup.ts         Export/import JSON
│   └── storage-keys.ts                Key constants
├── styles/
│   └── (Tailwind CSS only; no custom CSS files in MVP)
├── types/
│   ├── task.ts                        Task type definition
│   ├── project.ts                     ProjectConfig, ProjectData
│   ├── schedule.ts                    ScheduleSegment, WeekColumn, GeneratedSchedule
│   └── role.ts                        Role type definition
├── utils/
│   ├── number-units.ts                daysToUnits, unitsToDays, etc.
│   ├── number-units.test.ts           Unit conversion tests
│   ├── week-calendar.ts               Week math: boundaries, labels, month offsets
│   ├── task-factory.ts                Create task with defaults
│   └── group-color.ts                 Auto-assign color to level1 groups
├── main.tsx                           React root render
└── test-setup.ts                      Vitest config
```

---

## File Count & Sizes

- **Total files:** ~85 (TypeScript, TSX, constants, tests)
- **Core logic lines:** Domain modules ~500 LOC (tight, no bloat)
- **Components:** Most <150 LOC per file (focused responsibility)
- **Tests:** ~200 LOC (domain logic, storage, import)

---

## Key Algorithms & Formulas

### Schedule Packing (`generateSegments`)
```
Sort tasks by scheduleOrder
For each task:
  remaining = task.duration (MAX of enabled role estimates)
  While remaining > 0:
    If week has room > skipThreshold:
      Allocate min(remaining, available) to week
      Create ScheduleSegment
    Else:
      Skip to next week
```

### Duration Calculation
```
duration = MAX(backend, frontend, qc, brs)
(Only enabled roles count; 0 estimates are ignored)
```

### Week Capacity
```
capacity = workingDaysPerWeek * unitPerDay
Default: 5 days * 10 units/day = 50 units/week
```

### Bar Geometry
```
leftPercent = (segment.offsetUnits / capacity) * 100
widthPercent = (segment.durationUnits / capacity) * 100
CSS: position absolute, left/width %, display in week cell
```

---

## State Shape

### ProjectStore (Zustand)
```typescript
{
  data: {
    project: ProjectConfig
    tasks: Task[]
  }
  projectList: ProjectListItem[]
  saveStatus: "idle" | "saving" | "saved"
  
  // Actions:
  updateTask(id, field, value): void
  addTask(task): void
  deleteTask(id): void
  reorderTasks(oldIndex, newIndex): void
  importTasks(tasks, mode): void
  clearAll(): void
  updateProjectConfig(config): void
  switchProject(id): void
  createProject(): void
  deleteProject(id): void
}
```

### GeneratedSchedule (Derived)
```typescript
{
  segments: ScheduleSegment[]    // Task allocations across weeks
  weeks: WeekColumn[]            // Week metadata (dates, labels, capacity)
  weekCapacityUnits: number      // Usually 50 (5 days * 10 units)
  segmentsByTask: Map<taskId, ScheduleSegment[]>  // Indexed for rendering
  groupColors: Map<level1, color>                 // Auto-assigned colors
}
```

---

## Data Model Snapshot

### Task
- `id`: UUID via nanoid
- `code`: WBS code (e.g., "2.04")
- `level1`, `level2`, `level3?`, `level4?`: Hierarchical grouping
- `title`: Display name
- `displayOrder`: Position in table
- `scheduleOrder`: Position for packing (determines week allocation)
- `estimates`: `{ "backend": 1.5, "frontend": 0.5, ... }` (in days)
- `enabled`: Include in schedule?
- `color?`, `note?`: Optional

### ProjectConfig
- `startDate`: ISO string (Monday of week 1)
- `workingDaysPerWeek`: Typically 5
- `inputMode`: "days" or "hours"
- `hoursPerDay`: Used to convert hours → days
- `skipThresholdDays`: Skip week if leftover ≤ this (default 0.5)
- `unitPerDay`: Internal scale (default 10)
- `roles`: Role[] (Backend, Frontend, QC, BrS)

### ScheduleSegment
- `taskId`: Which task
- `weekIndex`: 0-based week from startDate
- `offsetUnits`: Start position in week (0–50)
- `durationUnits`: Length in week (1–50)

---

## Reactive Patterns

### Live Regenerate (useMemo)
```typescript
const schedule = useMemo(() => generateSchedule(data), [data])
```
Recomputes only when `data` (tasks or config) changes; ignores UI state.

### Debounced Save
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    writeProject(data)
    setStatus("saved")
  }, 500)
  return () => clearTimeout(timer)
}, [data])
```

### Undo/Redo (Zundo)
```typescript
useProjectStore.temporal.undo()  // Restore previous snapshot
useProjectStore.temporal.redo()  // Restore next snapshot
```

---

## Testing Surface

### Domain (No React, Fully Testable)
- `generateSegments()`: packing logic, edge cases (zero duration, skip threshold)
- `daysToUnits()`, `unitsToDays()`: unit conversion
- `parseImport()`: TSV parsing, header detection, column mapping
- `fillDownColumns()`: group cell fill-down
- `rowsToTasks()`: row → Task conversion

### Integration (React + Store)
- Import TSV → add tasks → verify scheduleOrder assigned
- Edit estimate → verify duration updated → verify schedule regenerated
- Undo action → verify data & undo history restored

### Manual (UI/UX)
- Keyboard: arrow nav, copy/paste, fill-down, undo/redo
- Drag/drop: reorder task → verify scheduleOrder change → verify schedule update
- Responsive: no layout breaks at 360px, 768px, 1200px widths

---

## Build & Tooling

- **Vite**: Fast bundling (HMR, tree-shake)
- **React 18**: Hooks, concurrent rendering (unused in MVP but future-safe)
- **TypeScript**: Strict mode, no `any`
- **Tailwind CSS**: Atomic styling
- **Vitest**: Jest-compatible unit tests
- **@testing-library/react**: Component testing

---

## Configuration Files

- `package.json`: Dependencies, build scripts, engine constraints
- `vite.config.ts`: Entry point, alias `@`, React plugin, test config
- `tsconfig.json`: Strict mode, target ES2020, moduleResolution bundler
- `tailwind.config.js`: Extend colors, custom widths for sticky columns
- `postcss.config.js`: Tailwind, autoprefixer plugins

---

## Code Conventions

- **File naming**: kebab-case (e.g., `use-grid-navigation.ts`)
- **Component naming**: PascalCase (e.g., `EditableCell.tsx`)
- **Type suffix**: `Type` appended to exported types
- **Unit conversion**: Always explicit (e.g., `daysToUnits(1.5, config.unitPerDay)`)
- **Comments**: Pragmatic; explain "why" not "what" the code does
- **Test naming**: `*.test.ts` co-located with source

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-21
