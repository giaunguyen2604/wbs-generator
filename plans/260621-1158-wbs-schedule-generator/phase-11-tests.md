# Phase 11 — Tests

## Context Links
- Requirements §10.5 (worked example), §9 (duration), §11 (import), §15/§21 (acceptance), §10.6 pseudo-code.
- Plan overview: ./plan.md

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Unit-test pure domain (schedule engine, import pipeline, storage/JSON, utils) and smoke-test critical components (task table grid paste, board render). Tests verify the FINAL code; no fake passes.

## Key Insights
- Highest ROI = pure functions (engine + import). Heavy component coverage not needed for MVP; focus smoke + interaction on the two adoption-critical flows (grid paste, drag reorder).

## Requirements
- vitest + jsdom + @testing-library/react configured.
- Engine: duration = max estimate; §10.5 multi-week split; skip threshold; 0-duration excluded; sort by scheduleOrder.
- Import: parseTsv ragged/CRLF; detectHeader; mapColumns aliases incl. "Backend (D)"; fillDownGroups (§11.3); validateImport warnings/errors.
- Utils: day↔unit round-trip; date week/month range labels; group-color determinism.
- Storage: export→import round-trip; version/shape validate rejects malformed.
- Component smoke: grid paste TSV fills multi-cell + auto-creates rows; drag reorder updates scheduleOrder; board renders bars + headers; empty state.

## Architecture
Co-locate `*.test.ts(x)` next to source or under `src/**/__tests__`. CI-less local `npm test`.

## Related Code Files
**Create:**
- `src/domain/schedule/__tests__/generate-schedule.test.ts`, `duration.test.ts`, `calendar.test.ts`
- `src/domain/import/__tests__/parse-tsv.test.ts`, `map-columns.test.ts`, `fill-down-groups.test.ts`, `validate-import.test.ts`
- `src/utils/__tests__/number.test.ts`, `date.test.ts`, `group-color.test.ts`
- `src/storage/__tests__/json-export-import.test.ts`, `validate-project-data.test.ts`
- `src/components/task-table/__tests__/grid-paste.test.tsx`, `drag-reorder.test.tsx`
- `src/components/schedule-board/__tests__/schedule-board.test.tsx`
- `vitest.config.ts`, `src/test/setup.ts`

## Implementation Steps
1. Configure vitest + jsdom + RTL setup.
2. Write engine tests from §10.5/§9 examples first (TDD-friendly).
3. Import pipeline tests using §11 sample + §11.3 fill-down case.
4. Utils + storage round-trip tests.
5. Component smoke tests for grid paste + drag reorder + board render + empty state.
6. Ensure all pass; fix code, never the assertions, to pass.

## Todo List
- [ ] vitest/jsdom/RTL config + setup
- [ ] engine tests (duration, split, skip, sort, 0-dur)
- [ ] import tests (parse/detect/map/fill-down/validate)
- [ ] utils tests (units/date/color)
- [ ] storage round-trip + validate tests
- [ ] component smoke (grid paste, drag reorder, board, empty)

## Success Criteria
- `npm test` green; engine matches §10.5; import matches §11.3; export/import round-trips; no skipped/fake tests.

## Risk Assessment
- Flaky clipboard/dnd events in jsdom → drive via handler/store assertions, not raw OS clipboard.

## Security Considerations
- Include malformed-JSON import test (rejects safely).

## Next Steps
- Hand to code-reviewer; update ./docs as needed.
