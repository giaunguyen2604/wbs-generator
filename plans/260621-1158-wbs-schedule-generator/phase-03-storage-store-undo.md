# Phase 03 — Storage, Zustand Store & Undo/Redo

## Context Links
- Requirements §13 (undo/redo), §15 (localStorage), §17 (perf), §23 (source-of-truth principle).
- Plan overview: ./plan.md

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** localStorage read/write layer, central Zustand store of ProjectData, zundo temporal middleware for global undo/redo (in-memory ~50 snapshots, NOT persisted), debounced autosave.

## Key Insights
- Store holds **only source data** (project + tasks). Schedule derived in Phase 04, never in store.
- Undo/redo history is in-memory only; reload resets history, data persists (§15.1).
- Autosave debounced ~500ms (§15.3).

## Requirements
- `projectStorage`: get/set project by id, project list, JSON serialize/parse with version guard.
- Store actions: updateProject, addTask, updateTask, deleteTasks (bulk), reorderTasks (scheduleOrder), duplicateTask, setRoles, replaceAllTasks/appendTasks (import), clearTasks, loadSample, loadProjectData.
- Temporal: limit 50, group rapid edits (partialize to exclude transient UI flags).
- Autosave: subscribe to store → debounced persist; expose "saved/saving" status.

## Architecture
`create(temporal(immer-style updater))`. localStorage keys per §15.2: `schedule-app:project-list`, `schedule-app:project:{id}`. Persist via store subscription, not zustand/persist (so we control debounce + exclude history).

## Related Code Files
**Create:**
- `src/storage/project-storage.ts` (key builders, get/set/list/remove, JSON export/import parse)
- `src/storage/storage-keys.ts`
- `src/store/project-store.ts` (state + actions, < 200 lines)
- `src/store/temporal-config.ts` (zundo limit/partialize/equality)
- `src/store/use-autosave.ts` (hook: debounced persist + save status)
- `src/store/selectors.ts` (memo-friendly selectors)

## Implementation Steps
1. Implement storage-keys + project-storage with try/catch around JSON + quota errors.
2. Build store with all mutation actions; keep them pure/small, split helpers if > 200 lines.
3. Wrap store in zundo `temporal`; configure `limit: 50`, partialize to `{project, tasks}` only.
4. Implement `use-autosave`: debounce 500ms, set status idle→saving→saved.
5. On app init: load project from storage or seed empty project (Phase 06 wires UI).
6. Expose `undo/redo/clear` from `store.temporal.getState()`.

## Todo List
- [ ] storage-keys + project-storage (get/set/list/export/import/quota guard)
- [ ] project-store with all mutation actions
- [ ] zundo temporal: limit 50, partialize source only
- [ ] use-autosave debounced + status
- [ ] selectors for tasks/config/roles
- [ ] init load-or-seed logic

## Success Criteria
- Mutations update store; undo/redo reverts/replays; reload restores data but history empty; autosave writes after 500ms idle; no schedule data in localStorage.

## Risk Assessment
- History bloat → enforce limit 50 + partialize.
- Quota exceeded → catch, surface non-blocking warning, keep in-memory state.

## Security Considerations
- Validate/normalize JSON on import (Phase 09) before loading into store.

## Next Steps
- Phase 04 derives schedule from store; Phase 06 wires UI.
