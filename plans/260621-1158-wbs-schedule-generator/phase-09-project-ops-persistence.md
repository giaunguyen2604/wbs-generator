# Phase 09 — Project Operations & Persistence UX

## Context Links
- Requirements §15.4 (backup ops), §3.1 (clear/reset + confirm + undo), §12.6.7 (autosave/safety), §21.5.
- Plan overview: ./plan.md

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Export/import project JSON, duplicate project, clear/reset (confirm + undoable), load sample data, and the save-status indicator — surfaced via header menu.

## Key Insights
- Storage + actions already exist (Phase 03). This phase is UI wiring + JSON file I/O + safety confirms.
- Import JSON must validate/version-guard before loading into store.

## Requirements
- Export JSON: download `ProjectData` as `.json` (Blob + anchor).
- Import JSON: file input → parse → version/shape validate → store.loadProjectData (confirm if replacing).
- Duplicate project: clone with new id/name → add to project list.
- Clear/reset: confirm dialog, undoable (zundo) (§3.1, §21.6).
- Load sample data: store.loadSample (Phase 02 dataset).
- Save-status indicator: idle/saving/saved from use-autosave (§12.6.7).

## Architecture
`project-ops` UI in header menu; file I/O helpers in storage layer (no backend). Reuse confirm-dialog (Phase 06).

## Related Code Files
**Create:**
- `src/components/project-ops/project-ops-menu.tsx`
- `src/components/project-ops/export-import-buttons.tsx`
- `src/storage/json-export-import.ts` (download blob, read file, validate shape/version)
- `src/storage/validate-project-data.ts` (version guard + shape check)
**Modify:**
- `src/components/app-header/app-header.tsx` (mount menu + save status)

## Implementation Steps
1. `json-export-import`: serialize + trigger download; file read + JSON.parse with try/catch.
2. `validate-project-data`: check `version`, required fields, arrays; reject gracefully with message.
3. Menu actions: export, import (confirm replace), duplicate, clear (confirm+undo), load sample.
4. Wire save-status indicator into header.

## Todo List
- [ ] json-export-import (download + read)
- [ ] validate-project-data version/shape guard
- [ ] project-ops menu (export/import/duplicate/clear/sample)
- [ ] confirm + undo on destructive ops
- [ ] save-status indicator in header

## Success Criteria
- §21.5: project persists across reload; export then import restores identical data; generated schedule never in localStorage; clear is confirmed + undoable.

## Risk Assessment
- Malformed JSON import → validate + user-facing error, no store corruption.
- localStorage quota → caught warning (Phase 03).

## Security Considerations
- Treat imported JSON as untrusted; strict shape validation before load.

## Next Steps
- Phase 10 polish; Phase 11 storage tests.
