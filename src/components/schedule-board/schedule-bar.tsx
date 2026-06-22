import type { ScheduleSegment } from "@/types/schedule";
import { barGeometry } from "@/domain/schedule/bar-geometry";

type Props = {
  segment: ScheduleSegment;
  weekCapacityUnits: number;
  color: string;
  tooltip: string;
};

// A single schedule bar positioned within a week cell by unit ratio.
export function ScheduleBar({ segment, weekCapacityUnits, color, tooltip }: Props) {
  const { leftPercent, widthPercent } = barGeometry(segment, weekCapacityUnits);
  return (
    <div
      title={tooltip}
      className="absolute top-1 h-5 rounded"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        background: color,
      }}
    />
  );
}
