# Phase 06 — App Shell, Project Config & Import Screen UI

## Context Links
- Requirements §12.1 (layout), §12.2 (config UI), §11.A (import screen), §12.6.5 (one screen), §3.1 (empty state CTA).
- Plan overview: ./plan.md

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Single-screen app shell (Config | Table | Board, collapsible board), Project Config form + Role settings, and the full Import-from-Sheets screen (textarea → preview → mapping → replace/append → confirm).

## Key Insights
- One screen, no wizard (§12.6.5). Import is a panel/modal, not a separate route.
- Empty state shows "Paste from Sheets" + "Load sample data" CTAs (§3.1, §12.6.2).

## Requirements
- App shell: header (project name, save status, project ops menu), collapsible sections.
- Project Config (§12.2): name, start date/month, workingDaysPerWeek, hoursPerDay, inputMode days/hours, skipThreshold, displayMonths — bound to store.updateProject.
- Role settings: list roles, toggle enabled, rename, color, add/remove (affects table columns + estimates keys).
- Import screen (§11.A): textarea, Parse button, preview table, column mapping selects (from map-columns), Replace/Append radio, Confirm → store.replaceAllTasks/appendTasks (undoable), validation summary.

## Architecture
Presentational components read store via selectors; mutations through store actions. Reuse Phase 05 import functions. Keep each component < 200 lines (split form fields, preview table, mapping panel).

## Related Code Files
**Create:**
- `src/app/app.tsx` (shell layout, section collapse)
- `src/components/app-header/app-header.tsx`, `save-status-indicator.tsx`
- `src/components/project-config/project-config-form.tsx`, `config-field.tsx`
- `src/components/role-settings/role-settings-panel.tsx`, `role-row.tsx`
- `src/components/import-sheet/import-sheet-panel.tsx`, `import-textarea.tsx`, `import-preview-table.tsx`, `import-column-mapping.tsx`, `import-actions.tsx`
- `src/components/common/empty-state.tsx`, `confirm-dialog.tsx`, `collapsible-section.tsx`

## Implementation Steps
1. Build app shell + collapsible sections; wire save-status from use-autosave.
2. Project Config form bound to store; validate numeric fields inline.
3. Role settings panel; ensure adding/removing role updates task.estimates keys safely.
4. Import panel: textarea → parseTsv/detectHeader/mapColumns → preview + mapping selects.
5. Replace/Append radio + Confirm → undoable store action; show validation summary (warnings non-blocking).
6. Empty state with paste + sample CTAs (sample via store.loadSample).

## Todo List
- [ ] app shell + collapsible sections + header
- [ ] save-status indicator wired
- [ ] project-config form bound to store
- [ ] role-settings panel (toggle/rename/color/add/remove)
- [ ] import panel (textarea/preview/mapping/actions)
- [ ] empty-state + confirm-dialog + collapsible-section commons

## Success Criteria
- Config edits update store + regenerate board live; import flow parses→preview→confirm populates tasks (undoable); empty state CTAs work; all files < 200 lines.

## Risk Assessment
- Role removal orphaning estimates → prune estimate keys + keep undo.

## Security Considerations
- Sanitize displayed pasted content (React default escaping); confirm before Replace-all.

## Next Steps
- Phase 07 Task Table; Phase 09 project ops in header menu.
