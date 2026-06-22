# Phase 05 — Import Pipeline (TSV parse, mapping, fill-down, validate)

## Context Links
- Requirements §11 (import, §11.2 aliases, §11.3 fill-down, §11.4 validate), §16 (validation), §21.1.
- Plan overview: ./plan.md

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Pure functions to parse clipboard TSV, auto-detect header, map columns via aliases, fill-down empty group cells, and validate — shared by Import screen (Phase 06/07 UI) and direct grid paste (Phase 07).

## Key Insights
- Same parse/map/fill-down logic feeds both the Import screen AND grid paste (DRY).
- Validation non-blocking: warnings don't block import; only truly ungeneratable data blocks (§11.4, §12.6.6).

## Requirements
- `parseTsv(text)` → string[][] (split lines by \n, cells by \t; trim trailing CR; tolerate ragged rows).
- `detectHeader(rows)` → boolean (first row non-numeric & matches aliases).
- `mapColumns(headerRow)` → `Record<ColumnKey, columnIndex>` using §11.2 aliases (case-insensitive, normalized); allow manual override for Import screen.
- `fillDownGroups(rows, level1Idx, level2Idx)` → carry last non-empty level1/level2 (§11.3).
- `rowsToTasks(rows, mapping, config)` → Task[] (parse estimates by role keys, displayOrder/scheduleOrder from order col or sequential).
- `validateImport(tasks)` → warnings[] + errors[] per §11.4/§16 (missing level1/2, non-number/negative estimate, duplicate order, no positive estimate).

## Architecture
Pure modules in `domain/import/`. Returns plain data; UI renders preview + mapping + replace/append (Phase 06/07).

## Related Code Files
**Create:**
- `src/domain/import/parse-tsv.ts`
- `src/domain/import/detect-header.ts`
- `src/domain/import/map-columns.ts` (uses constants columnAliases)
- `src/domain/import/fill-down-groups.ts`
- `src/domain/import/rows-to-tasks.ts`
- `src/domain/import/validate-import.ts`
- `src/types/import.ts` already from Phase 02 (ColumnKey, ImportResult, Warning)

## Implementation Steps
1. `parse-tsv`: robust split, handle empty trailing lines, normalize CRLF.
2. `detect-header`: score first row against aliases + numeric heuristic.
3. `map-columns`: normalize alias strings (lowercase, strip `(d)`, spaces); return index map + unmapped list.
4. `fill-down-groups`: forward-fill level1 then level2.
5. `rows-to-tasks`: build Task objects with ids, estimates per enabled role key, default enabled true.
6. `validate-import`: produce categorized warnings/errors; never throw.

## Todo List
- [ ] parse-tsv robust splitter
- [ ] detect-header heuristic
- [ ] map-columns alias resolver + override hook
- [ ] fill-down-groups level1/level2
- [ ] rows-to-tasks builder
- [ ] validate-import warnings/errors per §11.4/§16

## Success Criteria
- §11 example parses; §11.3 fill-down yields expected pairs; aliases like "Backend (D)" → backend; preview shows mapped data; warnings surface but don't block.

## Risk Assessment
- Mixed locale numbers (comma decimals) → parse via parseNumberSafe (Phase 02), warn on NaN.
- Paste includes leading totals row → header detection + manual override mitigates.

## Security Considerations
- Treat pasted text as untrusted: no eval, escape on render (React default).

## Next Steps
- Phase 06 Import screen UI; Phase 07 grid paste reuse.
