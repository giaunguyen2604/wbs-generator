# Phase 02 — Types, Constants, Utils & Sample Data

## Context Links
- Requirements §6 (config), §7 (data model), §8 (unit conversion), §16 (validation), §3.1 (sample data).
- Plan overview: ./plan.md

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Define all TS types, default config/roles constants, number/date utils, color assignment, and loadable sample dataset.

## Key Insights
- Estimates stored in **days** in model (§7.2); convert to internal **units** (1 day = unitPerDay units, default 10) only during compute/display (§8) to avoid float drift.
- ScheduleSegment is derived, never persisted (§7.4, §15.1).

## Requirements
- Types: `Role`, `Task`, `ProjectData`, `ProjectConfig`, `ScheduleSegment`, `ColumnKey`, validation/warning types.
- Defaults: roles (backend/frontend/qc/brs), config defaults (§6 table), unitPerDay=10, skipThresholdDays=0.5, workingDaysPerWeek=5.
- Utils: day↔unit conversion, safe number parse, round display; date helpers (week start/end from startDate, format `YYYY/MM`, week range labels); deterministic group→color.

## Architecture
Pure modules, no React. Color palette fixed; level1 name hashed → palette index (override stored on task.color / role).

## Related Code Files
**Create:**
- `src/types/role.ts`, `src/types/task.ts`, `src/types/project.ts`, `src/types/schedule.ts`, `src/types/import.ts`
- `src/utils/number.ts` (daysToUnits, unitsToDays, parseNumberSafe, roundDisplay)
- `src/utils/date.ts` (addWeeks, weekStart, weekRangeLabel, monthLabel, isCurrentWeek)
- `src/utils/group-color.ts` (palette + assignGroupColor)
- `src/utils/id.ts` (nanoid wrapper)
- `src/constants/default-project.ts` (defaultRoles, defaultConfig, columnAliases)
- `src/constants/sample-project-data.ts` (demo ProjectData from §11 example rows)

## Implementation Steps
1. Transcribe types exactly from §7 (keep `version: 1`).
2. Add `ProjectConfig` type matching §6 fields.
3. Implement number utils; `daysToUnits = round(days * unitPerDay)`.
4. Implement date utils: compute week index date ranges from `startDate` + `workingDaysPerWeek`.
5. Implement `assignGroupColor(level1)` deterministic; expose palette for chips & bars (consistency rule §12.6.8).
6. Define `columnAliases` per §11.2 and default roles/config per §6/§7.1.
7. Build sample dataset (Setup, Consumer Frontsite tasks) usable immediately (§3.1).

## Todo List
- [ ] All type files per §7 + import types
- [ ] number.ts unit conversion + safe parse
- [ ] date.ts week/month helpers with real ranges
- [ ] group-color.ts deterministic palette
- [ ] default-project constants + columnAliases
- [ ] sample-project-data dataset

## Success Criteria
- Types compile; unit conversion round-trips (1.5d→15u→1.5d); sample data validates with no blocking errors.

## Risk Assessment
- Float estimates (0.6d) → always go via units; never compare floats directly.

## Security Considerations
- None (pure data).

## Next Steps
- Phases 03, 04, 05 all build on these types.
