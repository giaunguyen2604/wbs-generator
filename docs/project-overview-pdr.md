# WBS Schedule Generator — Project Overview & PDR

## Executive Summary

**WBS Schedule Generator** is a frontend-only React SPA that automates WBS task scheduling. Users import WBS tasks from Google Sheets, define per-team estimates (Backend, Frontend, QC, BrS), and the app auto-generates a weekly schedule board. The app replaces manual color-coding in Sheets with instant, regenerative scheduling.

## Product Purpose

**Problem Solved:**
Project managers at the organization currently maintain WBS schedules manually in Google Sheets. They manually color-code cells to represent task allocations across weeks, creating tedious busywork and error-prone updates whenever estimates change. Re-scheduling requires re-coloring from scratch.

**Solution:**
A local-first web app that:
- Accepts WBS task data (levels 1–4) and per-role estimates
- Automatically computes task duration (MAX of role estimates, since teams work in parallel)
- Generates a weekly schedule board with visual bars
- Persists to browser localStorage (no backend, no account needed)
- Enables instant re-generation when tasks or estimates change
- Supports round-trip clipboard exchange with Google Sheets via TSV

## Business Goals

1. **Reduce scheduling overhead:** Eliminate manual color-coding; auto-generate schedule in <1 second.
2. **Improve estimate accuracy:** Make impact of estimate changes visible instantly.
3. **Enable fast iteration:** Support undo/redo and drag-reorder for quick plan adjustments.
4. **Maintain data portability:** No lock-in; export/import JSON; round-trip via Sheets.
5. **Zero onboarding friction:** Load sample data immediately; paste from Sheets without setup.

## Key Features (MVP Scope)

### Core Features
- **Task input:** Create/edit WBS tasks (code, levels 1–4, title, estimates per role).
- **Import from Sheets:** Paste TSV data; auto-detect header; map columns; preview; bulk replace or append.
- **Direct grid paste:** Paste TSV directly into table cells (Excel-like multi-cell fill).
- **Estimate per role:** Define Backend, Frontend, QC, BrS estimates in days or hours.
- **Auto-duration:** Duration = MAX(role estimates); computed in real time.
- **Schedule generation:** Sort tasks by `scheduleOrder`; allocate to weeks (5 days/week default); skip near-empty weeks (≤0.5 days).
- **Schedule board:** Timeline view with month/week headers, colored bars, today marker, tooltips.
- **Drag-reorder:** Reorder tasks by dragging; `scheduleOrder` updates; schedule regenerates instantly.
- **Undo/redo:** Global in-memory history (~50 snapshots); undo/redo all mutations.
- **Persistence:** Auto-save to localStorage; debounced 500ms after last change.
- **Export/import:** Export project as JSON; import from JSON; duplicate projects; clear with confirm.
- **Keyboard shortcuts:** Arrow nav, fill-down, copy/paste TSV, undo/redo (Ctrl/Cmd+Z/Shift+Z).

### Non-Features (Out of Scope MVP)
- Task dependencies, critical path, resource leveling.
- Holiday calendars, custom non-working days.
- Cloud sync, multi-user collaboration.
- Integration with Google Sheets API (copy/paste only).
- PDF/Excel export (TSV copy sufficient).

## Technical Approach

### Architecture
**One-screen SPA** with three main sections:
1. **Project Config** (collapsible): project name, start date, working days/week, role settings.
2. **Task Table** (main): inline-editable grid with keyboard navigation, drag-reorder, multi-cell paste.
3. **Schedule Board** (main): sticky left columns (code, level1/2, estimates), scrollable timeline with bars.

### Data Flow
```
Input Data (Tasks + Config)
  ↓ (Zustand store, localStorage persistence)
  ↓ (Pure domain logic: duration, calendar, packing)
  ↓ Generated Schedule (segments, weeks)
  ↓ (React hooks, memoized)
  ↓ UI Render
```

**Source of Truth:** Task data + Project config only. Generated schedule is always derived, never persisted.

### Tech Stack
- **React 18** + **Vite** for bundling.
- **TypeScript** for type safety.
- **Tailwind CSS** for styling.
- **Zustand** + **zundo** for state & undo/redo.
- **@dnd-kit** for drag-reorder.
- **localStorage** for persistence.
- **Vitest** + **@testing-library/react** for tests.

### Key Design Rules
1. **Integer units internally** (1 day = 10 units) to avoid float drift during week-splitting.
2. **Live regenerate:** Schedule auto-updates on any change (task, estimate, order, config).
3. **Non-blocking validation:** Warnings inline; only block if data cannot generate.
4. **No generated data in localStorage:** Only task data + config persisted.
5. **Undo/redo in-memory only:** ~50 snapshots, never persisted; reload resets history.
6. **One level1 group = one color:** Consistent across task chips and schedule bars.
7. **Sheets-first UX:** Keyboard grid nav, TSV paste/copy, drag reorder—muscle memory for Sheets users.

## User Personas

**Primary User:** Project Manager or Tech Lead managing WBS in Google Sheets.
- Needs: Quick schedule generation, instant re-planning, no learning curve.
- Pain point: Manual color-coding is slow and error-prone.

**Secondary User:** Estimation Lead entering estimates per role.
- Needs: Fast data entry (paste from Sheets, keyboard shortcuts).
- Pain point: Estimate changes require full re-scheduling.

## Success Metrics

1. **Schedule generation:** <1 second for typical project (50 tasks).
2. **Data import:** Paste from Sheets + import in <10 seconds.
3. **Undo depth:** At least 50 undo steps available.
4. **Uptime:** Always available (local SPA); no backend failures.
5. **Usability:** Sheets users should feel at home (grid nav, copy/paste, drag).

## Constraints & Dependencies

### Tech Constraints
- **Frontend-only:** No backend; all logic in browser.
- **localStorage:** ~5–10MB limit per origin (sufficient for ~1000 tasks).
- **No real-time sync:** Single browser session; no cloud backup (user must export).

### Input Constraints
- **WBS depth:** Up to 4 levels; MVP uses levels 1–2 for scheduling, 3–4 expandable later.
- **Task count:** MVP tested with ~50 tasks; should scale to ~200 with memoization.
- **Roles:** Default 4 (Backend, Frontend, QC, BrS); user can add/remove.

### User Constraints
- **Desktop-first:** Responsive from 360px mobile, but edit experience optimized for desktop.
- **Modern browser:** Chrome, Safari, Firefox (ES2020 target).
- **No export to Excel/PDF in MVP:** TSV copy to Sheets is the export path.

## Roadmap (Future Enhancements Post-MVP)

1. **Task dependencies & critical path** for advanced planning.
2. **Holiday calendar & custom non-working days** per project.
3. **Resource capacity per role** to detect over-allocation.
4. **Schedule per role** (show Backend timeline separate from Frontend).
5. **Drag schedule bar directly** on timeline to reassign weeks.
6. **Mobile card view** for task editing on phones.
7. **Cloud sync** (Firebase/Supabase) for multi-device access.
8. **Multi-project dashboard** for portfolio view.
9. **Version history & restore** for audit trail.
10. **Direct Google Sheets integration** (API, two-way sync).

## Acceptance Criteria

- [x] Import TSV from Google Sheets (paste + preview + map columns).
- [x] Direct grid paste fills multi-cell and creates rows as needed.
- [x] Task duration auto-calculated as MAX(role estimates).
- [x] Schedule generation with week skip logic (≤0.5 days → next week).
- [x] Weekly schedule board with month/week headers, colored bars, today marker.
- [x] Drag-reorder tasks changes `scheduleOrder` and regenerates schedule.
- [x] Undo/redo works for all mutations (edit, delete, reorder, import, clear).
- [x] Data persisted to localStorage and restored on reload.
- [x] Export/import JSON for backup and project duplication.
- [x] Copy table and schedule as TSV (paste into Sheets).
- [x] Empty state with "Load sample data" for zero-setup start.
- [x] All UI responsive from 360px (no horizontal scroll breakage).
- [x] Keyboard shortcuts for grid nav, fill-down, undo/redo.
- [x] Today marker on schedule board; hover tooltip showing task details.

## Phase Breakdown

| Phase | Deliverable | Estimate |
|-------|-------------|----------|
| 01 | Vite + React + TS + Tailwind setup | 2h |
| 02 | Types, utils, constants, sample data | 3h |
| 03 | Storage + Zustand + zundo + autosave | 4h |
| 04 | Schedule engine (duration, packing, calendar) | 4h |
| 05 | Import pipeline (TSV parse, map, fill-down, validate) | 4h |
| 06 | App shell, config panel, role settings | 3h |
| 07 | Task table with grid nav, paste, drag, fill-down | 6h |
| 08 | Schedule board (sticky cols, timeline, bars, markers) | 5h |
| 09 | Project ops (export/import JSON, duplicate, clear) | 3h |
| 10 | Responsive polish, a11y, performance | 3h |
| 11 | Tests (domain, import, storage, components) | 3h |
| **Total** | **MVP** | **~40h** |

## Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Floating-point drift in week-splitting | Low | Medium | Use integer units (10 units/day) internally |
| localStorage quota exceeded | Low | Medium | Catch quota error; warn user; suggest export |
| Performance with 200+ tasks | Low | Low | Memoize schedule; virtualize table if needed |
| Complex drag-reorder UX | Medium | Medium | Use @dnd-kit best practices; test extensively |
| Keyboard nav collision (Cmd+Z in input) | Low | Low | Stop propagation in grid cells; test on Mac/Windows |

## Dependencies

### Runtime Libraries
- `zustand@4.5.5` — State management.
- `zundo@2.3.0` — Temporal undo/redo middleware.
- `@dnd-kit/core@6.1.0`, `@dnd-kit/sortable@8.0.0` — Drag-drop reorder.
- `nanoid@5.0.7` — Unique IDs for tasks/roles.
- `react@18.3.1`, `react-dom@18.3.1` — UI framework.

### Dev Dependencies
- `vite@latest`, `@vitejs/plugin-react` — Build tooling.
- `tailwindcss@3.x`, `postcss`, `autoprefixer` — Styling.
- `typescript@5.x`, `strict mode` — Type checking.
- `vitest`, `@testing-library/react` — Testing.

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-21  
**Status:** MVP Specification
