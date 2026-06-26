import type { ScheduleSegment } from "@/types/schedule";
import { barGeometry } from "@/domain/schedule/bar-geometry";

type Props = {
  segment: ScheduleSegment;
  weekCapacityUnits: number;
  color: string;
  tooltip: string;
  top?: number; // vertical offset (px) within the row cell
  height?: number; // bar height (px)
  opacity?: number;
};

// A single schedule bar positioned within a week cell by unit ratio. The
// vertical slot (top/height) lets parallel-track mode stack BE/FE/QC lanes.
export function ScheduleBar({ segment, weekCapacityUnits, color, tooltip, top = 4, height = 20, opacity = 1 }: Props) {
  const { leftPercent, widthPercent } = barGeometry(segment, weekCapacityUnits);
  return (
    <div
      title={tooltip}
      className="absolute rounded"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top,
        height,
        background: color,
        opacity,
      }}
    />
  );
}
