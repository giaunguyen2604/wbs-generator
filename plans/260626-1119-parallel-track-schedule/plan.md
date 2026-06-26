# Parallel-Track Schedule Mode

Add a second scheduling strategy alongside the existing MAX-based waterfall. Toggle per project.

## Problem
Waterfall mode (`task-duration.ts` MAX + sequential pack) charges every task its `max(BE,FE,QC)`,
so the lighter discipline idles each task. Total = `Σ max(task)`.

## Idea (verified)
Model BE / FE / QC as 3 parallel resource tracks with cross deps:
- BE_i: sequential on BE track.
- FE_UI_i = r·FE (r=0.6): independent, runs early.
- FE_int_i = (1-r)·FE: needs BE_i done AND FE_UI_i done.
- QC_i = QC: only if FE>0; needs FE_done_i (int if exists else ui).
- If BE=0 → FE is single UI phase (no integration). If FE=0 → no QC.

FE priority when free: ready FE_int (earliest ready) > FE_UI (scheduleOrder). No preempt.
Idle on FE = unavoidable wait (rendered as gap). Mid-week start blocks all lanes at week 0.

Verified: never worse than `Σ max` except a small integration tail; clearly better on
opposite-leaning workloads (A:BE4/FE1 + B:BE1/FE4 → 6.6 vs 8).

## Decisions (confirmed with user)
- UI: one row per task, multi-lane (BE / FE / QC stacked, bars offset by real time).
- QC = dependent track after FE done; no FE ⇒ no QC.
- Split ratio: project-wide config `feUiRatio`, default 0.6.

## Changes
**Domain (new)**
- `parallel-track-jobs.ts` — build jobs from tasks (split + gating rules).
- `simulate-parallel-tracks.ts` — event-driven 3-track sim → job intervals (units).
- `generate-segments-parallel.ts` — slice intervals into per-week segments.

**Domain (modify)**
- `generate-schedule.ts` — route by `project.scheduleMode`.
- `bar-geometry.ts` — index segments as `Map<taskId, Map<week, Segment[]>>` (lanes).

**Types/config**
- `schedule.ts` — `ScheduleSegment.track?`, `.phase?`.
- `project.ts` + `default-project-config.ts` — `scheduleMode: 'waterfall'|'parallel-track'`, `feUiRatio: 0.6`.

**UI**
- `project-config-panel.tsx` — schedule mode select + FE UI ratio input (parallel only).
- `schedule-bar.tsx` — accept lane geometry (top/height) + phase styling.
- `board-task-row.tsx` — render segment array as lanes; trackColors in parallel mode.
- `schedule-board.tsx` — pass mode + trackColors.

**Tests**
- `generate-segments-parallel.test.ts` — user A/B example (6.4u-equiv), opposite-lean case, no-BE, no-FE.

## Status: done
- All files implemented; `tsc --noEmit` clean; 22/22 vitest pass (5 new).
- Browser-verified: parallel mode renders 3 stacked lanes (BE/FE-UI/FE-int/QC) staggered
  by real time + legend; waterfall mode unchanged (single full-height bars).
- Old projects backfilled via `withConfigDefaults` (Firestore + JSON import).
