# Phase 10 — Responsive, Accessibility & Performance Polish

## Context Links
- Requirements §13 (responsive ≥360px, h-scroll, NO card view), §14 (text/ellipsis/i18n), §17 (perf/memoize), §18 (a11y).
- Plan overview: ./plan.md

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Make table + board usable from 360px via horizontal scroll (no mobile card view in MVP), handle long text with ellipsis+tooltip, collapsible left panel, wrapping/menu toolbars, and apply memoization/render-minimization.

## Key Insights
- MVP explicitly NO card view (§13.3) — horizontal scroll only.
- Performance: schedule already memoized (Phase 04); focus on avoiding full table re-render.

## Requirements
- Responsive (§13): desktop full; tablet/mobile h-scroll without layout break; sticky headers + left cols hold; collapse left panel; toolbar wraps/menu; board left cols compact on mobile (Code+Level2+Duration §13.3).
- Text (§14): `.truncate` ellipsis on width-limited cells; tooltip/title shows full text; support VI/EN/JP chars.
- A11y (§18): labels on buttons/inputs; table headers; basic keyboard operability; color never sole info (tooltips present); sufficient contrast.
- Perf (§17): memoize rows/cells (React.memo + stable callbacks); debounced autosave (done); avoid re-render of whole table on single-cell edit.

## Architecture
Cross-cutting pass over Phases 06–08. Shared `truncate` util class + tooltip. Memo wrappers on row/cell/bar components.

## Related Code Files
**Create:**
- `src/components/common/text-ellipsis.tsx` (truncate + title)
- `src/styles/responsive.css` (sticky/scroll helpers if needed beyond Tailwind)
**Modify:**
- task-table rows/cells, schedule-board left cols, toolbars, app shell (collapse).

## Implementation Steps
1. Wrap table + board in horizontal scroll containers; verify sticky offsets.
2. Apply ellipsis + tooltip to long text cells/labels.
3. Collapse left panel + toolbar wrap/menu at small widths.
4. Mobile board: reduce left cols to Code+Level2+Duration.
5. Add React.memo + stable callbacks to row/cell/bar; verify single-cell edit doesn't re-render all rows.
6. A11y sweep: labels, aria on icon buttons, focus styles, contrast check.

## Todo List
- [ ] h-scroll containers + sticky verified ≥360px
- [ ] ellipsis + tooltip for long text (VI/EN/JP)
- [ ] collapsible left panel + toolbar wrap/menu
- [ ] mobile compact board left cols
- [ ] memoize rows/cells/bars; verify minimal re-render
- [ ] a11y labels/aria/contrast sweep

## Success Criteria
- No UI break from 360px (§21.4); long names don't break layout; keyboard-operable; single-cell edits don't re-render entire table.

## Risk Assessment
- Sticky + transform conflicts on mobile → test on real narrow viewport.

## Security Considerations
- None new.

## Next Steps
- Phase 11 tests confirm behavior.
