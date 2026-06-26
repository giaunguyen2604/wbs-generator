import type { Role } from "@/types/role";
import type { ScheduleSegment, ScheduleTrack } from "@/types/schedule";
import { BE_KEY, FE_KEY, QC_KEY } from "@/domain/schedule/parallel-track-jobs";

// Row height per mode. Parallel mode stacks up to 3 thin lanes in one row.
export const ROW_HEIGHT = { waterfall: 28, parallel: 42 } as const;

// Fixed vertical slot per track so BE/FE/QC stay aligned across all rows.
const LANE_SLOT: Record<ScheduleTrack, { top: number; height: number }> = {
  be: { top: 4, height: 9 },
  fe: { top: 16, height: 9 },
  qc: { top: 28, height: 9 },
};

// Vertical geometry for a segment. Waterfall (no track) is one tall bar.
export function laneGeometry(track: ScheduleTrack | undefined): { top: number; height: number } {
  if (!track) return { top: 4, height: 20 };
  return LANE_SLOT[track];
}

export type TrackColors = { be: string; feUi: string; feInt: string; qc: string };

// Resolve lane colors from role config, with sensible fallbacks.
export function buildTrackColors(roles: Role[]): TrackColors {
  const byKey = new Map(roles.map((r) => [r.key, r.color] as const));
  const fe = byKey.get(FE_KEY) ?? "#7c3aed";
  return {
    be: byKey.get(BE_KEY) ?? "#2563eb",
    feUi: fe,
    feInt: fe, // integration uses the same hue, distinguished by lower opacity
    qc: byKey.get(QC_KEY) ?? "#059669",
  };
}

// Color + opacity for a parallel-track segment. UI is the FE hue at reduced
// opacity; integration is full opacity so a task's UI vs API-integration phases
// read as one family.
export function segmentStyle(seg: ScheduleSegment, colors: TrackColors): { color: string; opacity: number } {
  if (seg.track === "be") return { color: colors.be, opacity: 1 };
  if (seg.track === "qc") return { color: colors.qc, opacity: 1 };
  if (seg.track === "fe")
    return seg.phase === "integration"
      ? { color: colors.feInt, opacity: 1 }
      : { color: colors.feUi, opacity: 0.5 };
  return { color: colors.be, opacity: 1 };
}

// Human label for tooltips.
export function trackLabel(seg: ScheduleSegment): string {
  if (seg.track === "be") return "Backend";
  if (seg.track === "qc") return "QC";
  if (seg.track === "fe") return seg.phase === "integration" ? "Frontend (integration)" : "Frontend (UI)";
  return "";
}
