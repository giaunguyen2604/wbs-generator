# Phase 08 — Schedule Board (timeline)

## Context Links
- Requirements §12.4 (board UI), §12.5 (bar math), §13 (responsive), §18 (a11y), §21.4.
- Plan overview: ./plan.md

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Render generated schedule: sticky left columns + horizontally scrollable timeline with month+week headers (real date ranges), bars by ratio, group color, today marker, hover tooltip, capacity hint, density toggle, empty state, live-update feedback.

## Key Insights
- Board is read-only projection of Phase 04 output (`use-schedule`). No persisted state.
- Bars colored by level1 group (consistent with table chips §12.6.8); multi-week segments same color, visually continuous.

## Requirements
- Left sticky cols (§12.4): Code, Level1, Level2, estimate cols, Duration (compact set on mobile §13.3).
- Timeline: month header (`YYYY/MM`), week header with real range `Wn (MM/DD–MM/DD)` (§12.4).
- Bars: leftPercent/widthPercent per §12.5 within week cells.
- Today marker: vertical line on current week (§12.4).
- Hover tooltip: title, role estimates, duration, week range, % of week (§12.4).
- Capacity hint: per-week density bar under header when near/at 50 units (§12.4 from week-capacity).
- Density toggle: compact vs comfortable week-cell width (§12.4).
- Empty state when no enabled tasks (§12.4).
- Live regenerate feedback; subtle "updating…" if heavy (§12.4 / §12.6.3).

## Architecture
Grid-ish layout: sticky left table synced row-height with timeline rows. Bars positioned via inline left/width % from bar-geometry. Tooltip portal/title. Density via CSS var on week-cell width.

## Related Code Files
**Create:**
- `src/components/schedule-board/schedule-board.tsx` (root)
- `src/components/schedule-board/board-left-columns.tsx` (sticky)
- `src/components/schedule-board/board-timeline.tsx` (scroll area)
- `src/components/schedule-board/month-header-row.tsx`, `week-header-row.tsx`
- `src/components/schedule-board/week-capacity-bar.tsx`
- `src/components/schedule-board/today-marker.tsx`
- `src/components/schedule-board/schedule-bar.tsx`
- `src/components/schedule-board/bar-tooltip.tsx`
- `src/components/schedule-board/density-toggle.tsx`
- `src/components/schedule-board/board-empty-state.tsx`

## Implementation Steps
1. Consume `use-schedule` (segments + calendar + capacity).
2. Render sticky left columns; align rows with timeline (shared row height).
3. Build month + week header rows from calendar (real date ranges).
4. Render week cells; place bars via bar-geometry; color by group.
5. Today marker line over current week; week-capacity density bars.
6. Hover tooltip with full details; density toggle (CSS var width).
7. Empty state when no enabled/duration>0 tasks; "updating…" subtle indicator.

## Todo List
- [ ] board root consuming use-schedule
- [ ] sticky left columns aligned with timeline
- [ ] month + week headers with real date ranges
- [ ] bars by ratio + group color (continuous multi-week)
- [ ] today marker + week capacity hint
- [ ] hover tooltip + density toggle
- [ ] empty state + updating indicator

## Success Criteria
- §21.4: month/week headers shown; each task bar at correct ratio; horizontal scroll works; today marker + tooltip + group colors present; no UI break ≥360px.

## Risk Assessment
- Sticky col + scroll alignment drift → shared row height tokens; test across densities.
- Many weeks/rows perf → memoize rows; consider virtualization only if >300 rows (§17, defer).

## Security Considerations
- Tooltip text escaped (React default); color not sole info carrier (§18) — tooltip/title always present.

## Next Steps
- Phase 10 responsive/a11y polish; Phase 11 board smoke tests.
