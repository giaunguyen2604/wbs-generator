# Code Review: WBS Schedule Generator

**Date:** 2026-06-21  
**Reviewer:** code-reviewer agent  
**Scope:** Full codebase — src/domain/schedule/, src/domain/import/, src/store/, src/hooks/, src/utils/number-units.ts, supporting components  
**Build / Tests:** Build green, tsc emits 1 error (test file), 17/17 tests pass

---

## Overall Assessment

Solid, well-structured SPA with clean separation of concerns. Domain logic is pure and testable. The schedule engine correctly implements the specified rules. Main risks are: one real TS error in test code, a coalesce-edit gap in zundo config, shallow JSON import validation, and a few missing edge-case tests.

**Score: 82 / 100**

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — TypeScript error in test helper (type safety)

**File:** `src/domain/schedule/generate-segments.test.ts:11`  
**Error:** `tsc -b --noEmit` reports:
```
Type 'Partial<Record<string, number>>' is not assignable to type 'Record<string, number>'
```
The `task()` helper accepts `est: Partial<Record<string, number>>` but `Task.estimates` is typed `Record<string, number>` (no `undefined` values). This silently passes at runtime because `?? 0` guards the consumer, but the compile error means `tsc` exits non-zero and CI lint will fail if it runs `tsc -b --noEmit` without `--noErrorTruncation` or a tsconfig exclude.

**Fix:** Change the helper signature to `est: Record<string, number>` and cast at call sites, or widen `Task.estimates` to `Record<string, number | undefined>` and update consumers to handle it. Widening the type is the more honest option given that `getTaskDurationUnits` already guards with `?? 0`.

---

### H2 — zundo `handleSet` is a no-op / rapid-edit coalescing is inactive

**File:** `src/store/use-project-store.ts:25`  
```ts
handleSet: (handleSet) => handleSet,
```
The comment says "coalesce rapid edits (typing) into the latest snapshot per tick" but the identity function does nothing — each `set()` call produces a separate history entry. For fast cell typing, this means 50 history slots (the cap) fill up quickly, degrading undo usability.

**Fix:** Use zundo's debounce helper or a throttled wrapper:
```ts
handleSet: (handleSet) =>
  (state) => {
    clearTimeout(coalesceTimer);
    coalesceTimer = setTimeout(() => handleSet(state), 200);
  },
```
Or use the built-in `equality` option with a shallow-equal on `data` to collapse identical snapshots.

---

### H3 — JSON backup import has no deep validation

**File:** `src/storage/project-json-backup.ts:10-14`  
`parseProjectBackup` only checks `parsed.project` exists and `parsed.tasks` is an array. A malformed backup (e.g., missing `project.id`, `tasks[n].estimates` not an object, wrong `version`) will load silently and may corrupt the project store or cause downstream runtime errors.

**Fix:** Add minimal field validation before `setData`:
```ts
if (!parsed.project?.id || !parsed.project?.name) throw new Error("Missing project id or name");
if (!Array.isArray(parsed.tasks)) throw new Error("tasks must be an array");
// version guard
if (parsed.version !== 1) throw new Error(`Unsupported version ${parsed.version}`);
```

---

## Medium Priority Improvements

### M1 — weekIndex never resets between tasks (intentional but undocumented)

**File:** `src/domain/schedule/generate-segments.ts:25`  
`weekIndex` is declared outside the `for (task of sorted)` loop — this is the correct sequential-packing behavior (tasks fill the same week bin). However, there is no comment explaining this is intentional. Anyone refactoring could easily move `let weekIndex = 0` inside the loop and silently break behavior. 

**Fix:** Add a one-line comment: `// weekIndex is shared across tasks — sequential packing, not per-task reset.`

---

### M2 — `detectHeader` threshold is fragile for 1-column imports

**File:** `src/domain/import/map-columns.ts:12`  
```ts
return matches >= Math.min(2, Math.ceil(first.length / 2));
```
For a 1-column TSV, the threshold is `Math.min(2, 1) = 1`. A data row that happens to contain "group" or "module" (both alias for `level1`) will be misclassified as a header and silently dropped. For single-column inputs this is edge-case, but worth a note.

**Fix:** Add a minimum row count check: if `grid.length < 2` always treat as no-header (no body rows would remain anyway).

---

### M3 — `useGeneratedSchedule` memoizes on entire `data` object

**File:** `src/hooks/use-generated-schedule.ts:12-17`  
```ts
return useMemo(() => { ... }, [data]);
```
`data` includes `updatedAt` which is stamped on every mutation (including non-schedule-affecting ones like `renameProject`). Each rename or timestamp update causes a full schedule recompute even when tasks/config are unchanged.

**Fix:** Memoize on `[data.tasks, data.project]` instead of `[data]`. These are stable references produced by spread-clone on mutation.

---

### M4 — `parseIsoDate` silently accepts malformed dates

**File:** `src/utils/week-calendar.ts:7`  
```ts
const [y, m, d] = iso.split("-").map(Number);
return new Date(y, (m || 1) - 1, d || 1);
```
`(m || 1)` is falsy-fallback — it treats month `0` (which doesn't exist in ISO dates) as January, but also means an empty string produces `new Date(NaN, 0, 1)` = Invalid Date, which then propagates silently into `WeekColumn.startDate`. An invalid `startDate` will cause all week labels to render as `NaN/NaN`.

**Fix:** Validate the ISO string before parsing, or guard against `Number.isNaN(y)` and return `new Date()` as fallback.

---

### M5 — `reorderTasks` clobbers `scheduleOrder` (drag-to-reorder side effect)

**File:** `src/store/task-actions.ts:53`  
```ts
.map((t, i) => ({ ...t, displayOrder: i + 1, scheduleOrder: i + 1 }));
```
Drag-to-reorder sets `scheduleOrder = displayOrder` for all tasks, which is correct for visual order parity. However, if a user has intentionally set a custom `scheduleOrder` (different from display order), drag-reorder silently resets it. There is no warning or confirmation.

**Fix (low-effort):** Document this as an intentional "sync scheduleOrder to visual order on drag" behavior in a comment.  
**Fix (proper):** Add a warning in the UI if any task has `scheduleOrder !== displayOrder` before confirming the drag.

---

### M6 — `title` field in imported tasks set to `level2 || level1`, overwriting any `title` column

**File:** `src/domain/import/rows-to-tasks.ts:53`  
```ts
title: level2 || level1,
```
There is no `title` alias in `COLUMN_ALIASES`, so pasted data can never supply a task title directly. Any explicit `title` column in source data is silently ignored. This is probably intentional (title = derived from levels), but `title` appears in `Task.type` and is searched/displayed — the mismatch may confuse users with data that has explicit title columns.

---

### M7 — `safety` loop guard (100,000 iterations) could hide misconfiguration

**File:** `src/domain/schedule/generate-segments.ts:33`  
The runaway guard `safety++ < 100000` is prudent, but silently exits the loop without logging or returning an error. If pathological config (e.g., `skipThresholdDays >= workingDaysPerWeek`) causes the loop to never converge, the task is silently truncated with no user feedback.

**Fix:** After the while loop, check `remaining > 0` and emit a console warning:
```ts
if (remaining > 0) console.warn(`generateSegments: task ${task.id} exceeded safety limit, dropped ${remaining} units`);
```

---

## Low Priority Suggestions

### L1 — `formatDays` null-check is redundant given TypeScript signature

**File:** `src/utils/number-units.ts:29`  
```ts
if (days === undefined || days === null || Number.isNaN(days))
```
The parameter is typed `number | undefined`, so `=== null` is unreachable. Remove `=== null` check.

---

### L2 — `positionalMapColumns` is opinionated and undocumented

**File:** `src/domain/import/map-columns.ts:32`  
`POSITIONAL_DEFAULT` hardcodes role keys (`"backend"`, `"frontend"`, `"qc"`, `"brs"`) at fixed positions. New roles added by the user won't map. This is acceptable as a fallback, but should be documented as "matches the default 8-column sheet layout."

---

### L3 — `appendTasks` sets `scheduleOrder = base + i` but `startOrder` in import dialog is always 1

**File:** `src/components/import-sheet/import-sheet-dialog.tsx:22` + `task-actions.ts:64`  
When mode is `"append"`, `buildTasksFromImport` receives `startOrder: 1`, so all imported tasks start at order 1. Then `appendTasks` shifts them by `base`. If some tasks in the import have explicit `order` from the TSV, those are preserved verbatim (from `rowsToTasks`), potentially colliding with existing task orders. `validateTasks` warns on duplicates, but the append path bypasses the per-task re-ordering for TSV-supplied orders.

---

### L4 — `useAutosave` saves `saveStatus: "saving"` synchronously before debounce

**File:** `src/hooks/use-autosave.ts:19`  
`useProjectStore.setState({ saveStatus: "saving" })` fires immediately on every keystroke (before the 500ms debounce). The "saving" indicator flashes even for rapid intermediate keystrokes. This is cosmetically noisy.

**Fix:** Move `setState({ saveStatus: "saving" })` inside the `setTimeout` callback.

---

### L5 — `clipboard-tsv.ts` uses deprecated `document.execCommand("copy")`

**File:** `src/components/task-table/clipboard-tsv.ts:19`  
The fallback is fine for legacy support, but the deprecation warning may appear in browser consoles. Acceptable as a fallback but should be wrapped in `try/catch` since `execCommand` can also throw.

---

### L6 — Missing test coverage areas

- `task-duration.ts`: `getTaskDurationDays` with `enabledRoleKeys = undefined` (all estimates path)
- `fill-down-groups.ts`: behavior when the first row is empty (no "last" value initialized)
- `validate-tasks.ts`: duplicate code detection
- `week-calendar.ts`: `parseIsoDate` with malformed input, `snapToWeekStart` on Sunday boundary
- `project-json-backup.ts`: `parseProjectBackup` with missing fields

---

## Positive Observations

- **Schedule engine is correct.** `MAX` over role estimates (not sum), sequential `weekIndex` sharing across tasks, skip-threshold check before AND after packing — all match the specification precisely. Test coverage validates this well.
- **Integer-unit math is clean.** `daysToUnits` uses `Math.round`, `unitsToDays` is simple division. No float accumulation in the packer (all arithmetic is on integers). `unitPerDay = 10` gives 0.1-day precision without drift.
- **Import pipeline architecture is excellent.** Two-phase (parse → build) with a preview/remap step is user-friendly and correct. `fillDownColumns` is simple and handles the Google Sheets blank-cell pattern well.
- **Store design is clean.** `partialize` correctly excludes `projectList` and `saveStatus` from undo history. History cap at 50 prevents unbounded growth. All mutations create new object references (immutable updates).
- **No network calls anywhere.** Pure localStorage SPA — no XSS surface, no CSRF risk.
- **Security:** No eval, no innerHTML, no dangerouslySetInnerHTML found. Clipboard paste is sanitized through the TSV parser.
- **localStorage isolation is clean.** `STORAGE_KEYS` prefix prevents collisions. `safeParse` guards all reads.
- **`barGeometry` clamps output** to `[0, 100]` — prevents rendering artifacts on overflow segments.
- **`useUndoRedoShortcuts`** correctly checks modifier keys and handles both Ctrl+Y and Ctrl+Shift+Z.

---

## Recommended Actions (Prioritized)

1. **[H1]** Fix TS error in test helper — change `est: Partial<Record<string, number>>` to `Record<string, number>` in `generate-segments.test.ts`
2. **[H2]** Implement real coalescing in `handleSet` to prevent undo history flooding on rapid typing
3. **[H3]** Add `version`, `project.id`, and `project.name` checks in `parseProjectBackup`
4. **[M3]** Change `useMemo` deps from `[data]` to `[data.tasks, data.project]` in `use-generated-schedule.ts`
5. **[M4]** Guard `parseIsoDate` against malformed input with `Number.isNaN` check
6. **[M1]** Add comment clarifying shared `weekIndex` is intentional
7. **[M7]** Add `console.warn` after safety loop exit when `remaining > 0`
8. **[L4]** Move `saveStatus: "saving"` inside the debounce timeout
9. **[L6]** Extend test suite to cover `week-calendar`, `validate-tasks`, `fill-down-groups` edge cases

---

## Metrics

| Metric | Value |
|---|---|
| Files reviewed | 42 source files |
| Tests | 17/17 passing |
| tsc errors | 1 (test helper type mismatch) |
| Critical issues | 0 |
| High issues | 3 |
| Medium issues | 7 |
| Low issues | 6 |
| Est. test coverage | ~40% (domain core well covered, components/utils uncovered) |

---

## Unresolved Questions

1. **Role extensibility:** `ROLE_FIELD_KEYS` and `positionalMapColumns` hardcode `["backend", "frontend", "qc", "brs"]`. If users can add custom roles via `Role.key`, do those custom keys ever get auto-mapped in the import pipeline? Currently they do not — `autoMapColumns` uses `COLUMN_ALIASES` which has no entry for dynamic role keys.

2. **`version: 1` field:** `ProjectData.version` is a literal type but never checked at read time. Is there a planned migration strategy for future schema versions, or will old localStorage data simply fail validation silently?

3. **`workingDaysPerWeek` < 5:** `weekDateRange` always advances by 7 calendar days regardless of `workingDaysPerWeek`. For a 4-day week config, `endDate = startDate + 3` is correct for the label, but the 7-day stride means weekends still count in the calendar gap. This is likely intentional (ISO weeks) but not documented.
