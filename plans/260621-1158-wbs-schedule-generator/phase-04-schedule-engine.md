# Phase 04 — Schedule Generation Engine

## Context Links
- Requirements §8 (units), §9 (duration), §10 (generate, pseudo-code §10.6), §12.5 (bar math), §17 (memoize), §21.2/21.3.
- Plan overview: ./plan.md

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Pure deterministic engine: task duration (max role estimate), unit conversion, multi-week split with skip threshold, week calendar with real date ranges, and a memoized derive hook.

## Key Insights
- Duration = **max** role estimate, not sum (§9.1).
- Implement §10.6 pseudo-code faithfully; units integer to avoid float drift.
- Generated output never persisted; recomputed on `[tasks, project]` change, memoized (§17).

## Requirements
- `getTaskDurationUnits(task, unitPerDay)` = max(estimates)*unitPerDay (filter falsy, ignore disabled in caller).
- `generateSchedule(tasks, config)` → `ScheduleSegment[]` per §10.6: sort by scheduleOrder, filter enabled, weekCapacity = workingDaysPerWeek*unitPerDay, skipThreshold = skipThresholdDays*unitPerDay, split across weeks.
- Skip task if duration 0 (§16, §21.2).
- Calendar: from startDate compute per-week date ranges + month grouping for headers (§12.4); today/current-week detection (§12.4 today marker).
- Bar geometry: left% = offset/cap*100, width% = duration/cap*100 (§12.5).
- Capacity usage per week (for capacity hint §12.4).

## Architecture
All pure functions in `domain/schedule/`. React hook `use-schedule` memoizes via `useMemo` over store selectors.

## Related Code Files
**Create:**
- `src/domain/schedule/duration.ts` (getTaskDurationDays/Units)
- `src/domain/schedule/generate-schedule.ts` (§10.6 algorithm)
- `src/domain/schedule/calendar.ts` (weeks, months, date ranges, current-week index)
- `src/domain/schedule/bar-geometry.ts` (left/width %)
- `src/domain/schedule/week-capacity.ts` (used units per week → density)
- `src/hooks/use-schedule.ts` (memoized derive from store)

## Implementation Steps
1. Implement duration helpers (days + units variants).
2. Port §10.6 into `generate-schedule.ts`; return segments with weekIndex/offsetUnits/durationUnits.
3. Build calendar: number of weeks needed = max(maxSegmentWeek+1, displayMonths span); produce week headers with `Wn (MM/DD–MM/DD)` and month groupings.
4. Compute per-week used units → capacity ratio for hints.
5. `use-schedule` hook: derive segments + calendar memoized on `[tasks, project]`.
6. Add bar-geometry helpers used by board.

## Todo List
- [ ] duration.ts (max-estimate rule)
- [ ] generate-schedule.ts faithful to §10.6
- [ ] calendar.ts week/month real date ranges + current week
- [ ] week-capacity density
- [ ] bar-geometry left/width %
- [ ] use-schedule memoized hook

## Success Criteria
- Matches §10.5 worked example (5d task into a week with 2d left → 2d then 3d next week); 0-duration tasks excluded; sorted by scheduleOrder; recompute only on source change.

## Risk Assessment
- Skip threshold edge (available <= threshold) → follow pseudo-code exactly incl. the post-take week advance.
- Infinite loop if remaining never decreases → guarded by `take = min(remaining, available)` and available>threshold.

## Security Considerations
- None (pure compute).

## Next Steps
- Phase 08 renders segments; Phase 11 unit-tests this engine first.
