---
title: "WBS Schedule Generator (frontend-only MVP)"
description: "Local-first React app to import WBS tasks, auto-compute durations, and render a weekly schedule board."
status: pending
priority: P1
effort: ~40h
branch: main
tags: [react, vite, typescript, tailwind, zustand, localstorage, mvp]
created: 2026-06-21
---

# WBS Schedule Generator — Implementation Plan

Frontend-only React + Vite + TS + Tailwind + Zustand (zundo temporal for undo/redo). localStorage only, no backend. Source of truth = task data + project config → generated schedule → UI. Never persist generated schedule. Build strictly to requirements doc; MVP scope only (§3.2 / §22 stay out).

## Architecture (one-screen app)
`Config | Task Table | Schedule Board` on a single page. Zustand store holds `ProjectData`; pure `domain/` functions derive schedule (memoized). `storage/` debounced-persists source data to localStorage. `import/` parses TSV both via Import screen and direct grid paste.

## Phases

| # | Phase | Status | Depends on |
|---|-------|--------|-----------|
| 01 | Project setup & tooling (Vite/TS/Tailwind/deps/folders) | pending | — |
| 02 | Types, constants, utils (number/date), sample data | pending | 01 |
| 03 | Storage layer + Zustand store + zundo undo/redo + autosave | pending | 02 |
| 04 | Schedule engine (duration, calendar, generateSchedule, memo) | pending | 02 |
| 05 | Import pipeline (parseTsv, mapColumns, fill-down, validate) | pending | 02 |
| 06 | App shell, layout, Project Config + Role settings UI | pending | 03 |
| 07 | Task Table (grid nav, inline edit, paste/copy TSV, drag, fill-down, warnings) | pending | 03,04,05 |
| 08 | Schedule Board (sticky cols, timeline, bars, today marker, tooltip, density, empty state) | pending | 04 |
| 09 | Project ops (export/import JSON, duplicate, clear, sample, autosave indicator) | pending | 03 |
| 10 | Responsive, a11y, performance polish | pending | 06,07,08 |
| 11 | Tests (domain engine, import, storage; component smoke) | pending | 04,05,07,08 |

## Key dependencies
- zustand + zundo (temporal middleware) — in-memory ~50-snapshot history, NOT persisted.
- @dnd-kit/core + @dnd-kit/sortable — drag/drop row reorder.
- nanoid — task/role ids.
- vitest + @testing-library/react — tests.

## Cross-cutting rules
- Files < 200 lines, kebab-case, modularize.
- Live regenerate by default (no Generate button); memoize on `[tasks, project]`.
- One level1 group = one color across table chips and schedule bars.
- Non-blocking validation: warnings inline; block only when nothing can generate.
- Destructive actions (clear/replace/delete) → confirm + undoable.

## Detailed phase files
- phase-01-project-setup.md
- phase-02-types-utils-sample.md
- phase-03-storage-store-undo.md
- phase-04-schedule-engine.md
- phase-05-import-pipeline.md
- phase-06-app-shell-config.md
- phase-07-task-table.md
- phase-08-schedule-board.md
- phase-09-project-ops-persistence.md
- phase-10-responsive-a11y-perf.md
- phase-11-tests.md
