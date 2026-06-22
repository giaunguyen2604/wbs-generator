# WBS Schedule Generator — Code Standards & Conventions

## File Organization

### Naming Conventions

**Kebab-case for all files** with self-documenting, descriptive names:
```
use-grid-navigation.ts      (not nav.ts or grid.ts)
apply-cell-value.ts         (not applyValue.ts)
fill-down-groups.ts         (not fillDown.ts)
board-timeline-header.tsx   (not timelineHeader.tsx)
```

**PascalCase for React components:**
```
EditableCell.tsx
TaskTable.tsx
ScheduleBoard.tsx
```

**Type suffix convention** (exported types):
```
export type ProjectConfig = { ... }  // not IProjectConfig or ProjectConfigType
export type ScheduleSegment = { ... }
```

### File Size Targets

- **Modules:** Keep under 200 LOC per file for optimal context management
- **Exceptions:** Large test files or configuration files are OK
- **Modular approach:** If a file exceeds 200 LOC, split into smaller focused modules

Examples of proper modularization:
- `use-grid-navigation.ts` (keyboard logic only) + `editable-cell.tsx` (render only)
- `generate-segments.ts` (packing) + `task-duration.ts` (duration calc) + `build-week-columns.ts` (week metadata)

---

## Code Style & Patterns

### TypeScript

**Strict mode enabled.** No `any` types without explicit justification.

```typescript
// ✓ Good
function getTaskDuration(task: Task, config: ProjectConfig): number {
  return Math.max(...Object.values(task.estimates).filter(Boolean));
}

// ✗ Bad
function getTaskDuration(task: any): any {
  return Math.max(...task.estimates);
}
```

**Explicit return types** on exported functions:
```typescript
export function parseImport(text: string): ParsedImport {
  // ...
}

// Not strictly required for internal helpers, but preferred:
function computeCapacity(days: number, units: number): number {
  return days * units;
}
```

**Use `Record<>` for maps** keyed by strings (e.g., role estimates):
```typescript
estimates: Record<string, number>  // ✓ Good (not object or Map)
```

### React Components

**Functional components only** (no class components).

```typescript
export function TaskTable() {
  const [importOpen, setImportOpen] = useState(false);
  return <div>...</div>;
}
```

**Custom hooks for reusable logic:**
```typescript
// ✓ Extract keyboard nav into a hook
export function useGridNavigation(tableRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { ... };
    // ...
  }, []);
}

// Not inline in component render
```

**Avoid prop drilling.** Use Zustand store for global state:
```typescript
// ✓ Good
const data = useProjectStore((s) => s.data);

// ✗ Avoid deep prop chains
function App(props: { config: ProjectConfig; tasks: Task[]; ... }) {
  return <TaskTable config={props.config} tasks={props.tasks} ... />;
}
```

### Integer Units

**All week-related math uses integer units** (1 day = 10 units by default).

```typescript
// ✓ Good
const weekCapacityUnits = config.workingDaysPerWeek * config.unitPerDay;  // 5 * 10 = 50
const allocated = Math.min(remaining, available);  // Both are integers
segments.push({ taskId, weekIndex, offsetUnits, durationUnits });  // All integers

// ✗ Bad (avoid floats in packing algorithm)
const weekCapacity = 5.0;  // Float arithmetic can drift
const allocated = remaining * 0.95;  // Precision loss
```

**Explicit conversion at boundaries** (user input ↔ internal):
```typescript
// Input from user
const days = parseNumberCell(rawCell);  // e.g., "1.5" → 1.5

// Convert to units for packing
const units = daysToUnits(days, config.unitPerDay);  // 1.5 * 10 = 15

// Use units in algorithm
// ...

// Display back to user
const displayDays = unitsToDays(units, config.unitPerDay);  // 15 / 10 = 1.5
```

### Pure Domain Functions

**No mutations.** Return new objects:

```typescript
// ✓ Good
export function generateSegments(tasks: Task[], config: ProjectConfig): ScheduleSegment[] {
  const segments: ScheduleSegment[] = [];
  // ... build and return new array
  return segments;
}

// ✗ Bad (mutation)
export function generateSegments(tasks: Task[], config: ProjectConfig): void {
  tasks.forEach(task => task.segments = []);  // Don't mutate input
}
```

**No side effects** (except I/O at storage/component boundaries):

```typescript
// ✓ Good (pure)
function getTaskDuration(task: Task): number {
  return Math.max(...Object.values(task.estimates).filter(Boolean));
}

// ✗ Bad (side effect)
function getTaskDuration(task: Task): number {
  console.log("Computing duration");  // OK in debug, not in production logic
  localStorage.setItem("lastTask", task.id);  // Never from domain logic
  return Math.max(...Object.values(task.estimates).filter(Boolean));
}
```

**Single responsibility.** Each function does one thing:

```typescript
// ✓ Good (separated concerns)
function parseImport(text: string): ParsedImport { ... }
function buildTasksFromImport(rows, mapping, opts): Task[] { ... }

// ✗ Bad (doing both)
function importAndSchedule(text: string): GeneratedSchedule {
  const parsed = parseImport(text);
  const tasks = buildTasks(parsed);
  const schedule = generateSchedule(tasks);
  return schedule;
}
```

---

## Storage & Persistence

### Source of Truth Principle

**Only task data + ProjectConfig are persisted to localStorage.**

```typescript
// ✓ What gets saved
const projectData: ProjectData = {
  version: 1,
  project: { /* config */ },
  tasks: [ /* task array */ ],
  updatedAt: string,
};

// ✗ Never save these
const generatedSchedule: GeneratedSchedule;  // Derived, never persisted
const undoHistory: StateSnapshot[];          // In-memory only
const uiState: { importDialogOpen: boolean }; // UI state, not persisted
```

### Undo/Redo Scope

**Zustand with zundo temporal middleware:**
- Partialize: only `data` is tracked, not saveStatus or UI state
- Limit: 50 snapshots (prevents unbounded growth)
- Scope: reload clears history (not persisted to localStorage)

```typescript
export const useProjectStore = create<ProjectStore>()(
  temporal(
    (set, get) => ({ /* ... */ }),
    {
      limit: 50,
      partialize: (state) => ({ data: state.data }),  // Only track data changes
    }
  )
);
```

---

## Import Pipeline

### Expected Format (TSV from Google Sheets)

```
Level 1     Level 2             #      Backend (D)  Frontend (D)  QC    BrS   Order
Consumer    Authentication      2.02   1.5          0.5           0.6   0     2
Consumer    Pickup              2.03   0.5          0.2           0.3   0     3
```

### Processing Steps (In Order)

1. **Parse TSV:** Split by tabs/newlines → 2D string grid
2. **Detect header:** Heuristic check (e.g., contains "Level 1", "Backend")
3. **Auto-map columns:** Match column names to field keys using aliases
4. **Fill-down groups:** Blank `level1` cells inherit value from above
5. **Convert to Tasks:** Rows → Task objects with IDs, default orders
6. **Validate:** Check required fields, numeric estimates, no empty tasks

### Column Aliases (Support Variations)

```typescript
const columnAliases = {
  level1: ["Level 1", "L1", "Group", "Module"],
  level2: ["Level 2", "L2", "Feature", "Task"],
  code: ["#", "Code", "WBS", "No."],
  backend: ["Backend", "Backend (D)", "BE"],
  frontend: ["Frontend", "FrontEnd (D)", "FE"],
  qc: ["QC", "QA", "Tester"],
  brs: ["BrS", "BRS", "Business"],
  order: ["Order", "Priority", "Sort", "Schedule Order"],
};
```

### Error Handling (Non-blocking)

- **Missing level1/level2:** Warning (validation flag) but allow import
- **Invalid estimate (non-numeric):** Parse as 0 with warning
- **Negative estimate:** Parse as-is, show warning (let user fix)
- **Duplicate scheduleOrder:** Warning (will cause reordering issues)
- **Task with zero duration:** Excluded from schedule; not an error

---

## Keyboard Navigation & Shortcuts

### Grid Navigation (Task Table)

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move up/down rows |
| `←` / `→` | Move left/right columns |
| `Enter` | Commit cell edit, move down |
| `Tab` | Commit cell edit, move right |
| `Shift+Tab` | Commit cell edit, move left |
| `Escape` | Cancel edit, keep value |

### Editing

| Key | Action |
|-----|--------|
| `Ctrl/Cmd+C` | Copy selected range as TSV |
| `Ctrl/Cmd+V` | Paste TSV into grid (multi-cell fill, auto-expand) |
| `Ctrl/Cmd+D` | Fill down (copy active cell to rows below) |

### Global

| Key | Action |
|-----|--------|
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Shift+Z` | Redo |

### Implementation Notes

- Keyboard handlers in component event listeners or `useGridNavigation` hook
- Stop propagation to prevent browser defaults (e.g., Ctrl+Z in text input)
- Test on Mac (Cmd) and Windows (Ctrl) to ensure both work

---

## Comments & Documentation

### When to Comment

**Explain the "why", not the "what":**

```typescript
// ✓ Good (explains intent)
// Skip to next week if leftover is too small to fit a typical task.
// Prevents creating many half-empty weeks.
if (weekUsed <= skipThreshold) {
  weekIndex += 1;
}

// ✗ Poor (restates code)
// Increment weekIndex
weekIndex += 1;
```

**Comment complex algorithms:**

```typescript
// ✓ Good (explains high-level approach)
// Core packing algorithm:
// 1. Sort tasks by scheduleOrder
// 2. For each task, allocate to weeks sequentially
// 3. If a task spans multiple weeks, create multiple segments
// 4. Skip to next week if remaining capacity ≤ skipThreshold
export function generateSegments(...) {
  // ...
}
```

**Mark non-obvious constraints:**

```typescript
// ✓ Good (explains constraint)
// Must use integer units to avoid float drift when splitting tasks.
// 1 day = unitPerDay units (default 10).
const units = Math.round(days * config.unitPerDay);
```

### Avoid Over-Commenting

```typescript
// ✗ Noise (obvious from code)
// Get the task
const task = tasks[i];

// ✗ Noise (too granular)
// Check if estimates exist
if (task.estimates) {
  // Get max
  const max = Math.max(...);
}
```

---

## Testing Standards

### Unit Tests (Vitest)

**Test domain logic without React:**

```typescript
// ✓ Good
describe("generateSegments", () => {
  it("allocates tasks to weeks by scheduleOrder", () => {
    const tasks = [
      { id: "1", scheduleOrder: 1, /* ... */ },
      { id: "2", scheduleOrder: 2, /* ... */ },
    ];
    const segments = generateSegments(tasks, config);
    expect(segments).toHaveLength(2);
    expect(segments[0].taskId).toBe("1");
    expect(segments[1].taskId).toBe("2");
  });

  it("splits task across weeks if duration > remaining capacity", () => {
    // ...
  });

  it("skips to next week if leftover <= skipThreshold", () => {
    // ...
  });
});
```

### Edge Cases to Test

- **Zero/empty inputs:** No tasks, zero estimates, zero working days
- **Boundary conditions:** Task exactly fills week, exactly at skip threshold
- **Splits:** Task split across 2+ weeks
- **Unit conversion:** Float → int with rounding, int → float with precision
- **Import:** Empty header, no body rows, malformed TSV

### React Component Tests (Optional for MVP)

```typescript
// ✓ If testing user interaction
it("calls updateTask when cell is edited", () => {
  const { getByRole } = render(<EditableCell ... />);
  const input = getByRole("textbox");
  fireEvent.change(input, { target: { value: "new value" } });
  expect(mockUpdateTask).toHaveBeenCalled();
});
```

---

## Performance Guidelines

### What's Memoized

1. **useGeneratedSchedule():** Recomputes only when `data` (tasks or config) changes
2. **React.memo on rows:** Prevents re-render if row props unchanged
3. **Week columns:** Built once per schedule generation

### What's Not Memoized (Acceptable for MVP)

- Cell editing (fast per-cell updates)
- UI state (collapse panels, etc.)
- Task table rows (OK to re-render on store change; cells handle inline edits)

### When to Add Memoization

- If task table >300 rows and re-render feels slow: consider virtualizing (react-window)
- If schedule generation >1 second for typical data: profile and optimize packing algorithm

### Avoid Common Pitfalls

```typescript
// ✗ Bad (new function on every render)
const MyComponent = () => {
  return <ChildComponent onClick={() => console.log("clicked")} />;
};

// ✓ Good (function reused)
const MyComponent = () => {
  const handleClick = useCallback(() => console.log("clicked"), []);
  return <ChildComponent onClick={handleClick} />;
};
```

```typescript
// ✗ Bad (new object on every render)
const deps = [config];  // Creates new array each time

// ✓ Good
const [config] = useState(initialConfig);  // Stable reference
useEffect(() => { ... }, [config]);
```

---

## Responsive Design

### Breakpoints (Tailwind)

| Breakpoint | Width | Use |
|-----------|-------|-----|
| `sm` | 640px | Tablets |
| `md` | 768px | iPad |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

### Mobile-First (360px+)

```typescript
// ✓ Good (mobile-first, then enhance)
className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4"

// ✗ Bad (desktop-first)
className="w-1/4 lg:w-1/3 md:w-1/2 sm:w-full"
```

### Grid Overflow (Horizontal Scroll OK)

```typescript
// ✓ Good (wrapped in scroll container)
<div className="overflow-x-auto">
  <table className="w-max">  {/* wider than parent */}
    {/* ... */}
  </table>
</div>

// ✗ Bad (breaks layout)
<table className="w-full">  {/* squashed on mobile */}
  {/* ... */}
</table>
```

---

## Accessibility (a11y)

### Semantic HTML

```typescript
// ✓ Good
<table>
  <thead><tr><th>Name</th></tr></thead>
  <tbody><tr><td>John</td></tr></tbody>
</table>

// ✗ Bad
<div>
  <div>Name</div>
  <div>John</div>
</div>
```

### ARIA Labels

```typescript
// ✓ Good
<button aria-label="Delete task">
  <TrashIcon />
</button>

// ✗ Bad (icon-only with no label)
<button>
  <TrashIcon />
</button>
```

### Form Labels

```typescript
// ✓ Good
<label htmlFor="projectName">Project Name</label>
<input id="projectName" type="text" />

// ✗ Bad (no label)
<input placeholder="Project Name" />
```

---

## Error Handling

### Domain Logic (No Exceptions)

```typescript
// ✓ Good (return safe value)
export function daysToUnits(days: number, unitPerDay: number): number {
  if (!Number.isFinite(days) || days <= 0) return 0;
  return Math.round(days * unitPerDay);
}

// ✗ Bad (throw from domain)
if (!Number.isFinite(days)) throw new Error("Invalid days");
```

### UI Layer (Show Errors Gracefully)

```typescript
// ✓ Good (warn user, allow recovery)
if (!data) {
  return <div>No data loaded. Click "Load Sample" to start.</div>;
}

// ✗ Bad (crash)
const tasks = data.tasks.map(...);  // TypeError if data null
```

### Storage (Defensive Parsing)

```typescript
// ✓ Good (safeParse with fallback)
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;  // Graceful fallback
  }
}

// ✗ Bad (throw on malformed JSON)
const data = JSON.parse(localStorage.getItem("key"));
```

---

## Git & Commits

### Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body>
<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**
```
feat(schedule): implement week-skip logic for near-empty weeks
fix(import): fill-down groups correctly when header row present
docs(readme): update usage examples
refactor(domain): extract task-duration into separate module
test(schedule): add packing algorithm edge cases
```

### Keep Commits Focused

- One logical change per commit
- Don't mix refactoring + feature work
- Don't commit test-only changes with code changes

---

## Dependencies & Constraints

### Runtime Constraints

- **No backend.** All logic in browser; data persisted to localStorage only.
- **localStorage limit:** ~5–10MB per origin; supports ~1000 tasks safely.
- **No real-time sync:** Single browser session; user must export/import for backup.

### Approved Dependencies

✓ React 18  
✓ Zustand + zundo  
✓ @dnd-kit (drag-drop)  
✓ Tailwind CSS  
✓ nanoid  

❌ Large state libs (Redux, MobX)  
❌ UI kit dependencies (unless Tailwind-based)  
❌ Server frameworks (Next.js SSR, etc.)  

---

## Before You Submit Code

**Checklist:**

- [ ] File names are kebab-case, self-documenting
- [ ] No file >200 LOC (split if needed)
- [ ] TypeScript: strict mode, no `any`
- [ ] React: functional components, custom hooks for reusable logic
- [ ] Domain logic: pure, no mutations, no side effects
- [ ] Integer units: explicit conversion at boundaries
- [ ] Tests: domain logic tested, edge cases covered
- [ ] Responsive: no layout breaks at 360px+
- [ ] Accessibility: semantic HTML, ARIA labels, keyboard nav
- [ ] Comments: explain "why", not "what"
- [ ] No debugging code (console.log, debugger)
- [ ] Commit message: conventional format, focused change

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-21
