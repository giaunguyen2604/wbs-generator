import type { TrackColors } from "@/components/schedule-board/board-track-lanes";

// Legend explaining the parallel-track lane colors (BE / FE UI / FE integration / QC).
export function BoardTrackLegend({ colors }: { colors: TrackColors }) {
  const items = [
    { label: "Backend", color: colors.be, opacity: 1 },
    { label: "Frontend UI", color: colors.feUi, opacity: 0.5 },
    { label: "FE integration", color: colors.feInt, opacity: 1 },
    { label: "QC", color: colors.qc, opacity: 1 },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ background: it.color, opacity: it.opacity }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
