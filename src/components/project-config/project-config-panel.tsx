import type { ScheduleMode } from "@/types/project";
import { useProjectStore } from "@/store/use-project-store";
import { clampRatio } from "@/domain/schedule/parallel-track-jobs";
import { LabeledField, inputClass } from "@/components/ui/labeled-field";
import { RoleSettings } from "@/components/project-config/role-settings";

// Project configuration form. All edits flow through updateConfig and trigger
// live schedule regeneration + autosave.
export function ProjectConfigPanel() {
  const project = useProjectStore((s) => s.data.project);
  const updateConfig = useProjectStore((s) => s.updateConfig);

  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <LabeledField label="Project name" htmlFor="cfg-name">
          <input
            id="cfg-name"
            value={project.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            className={inputClass}
          />
        </LabeledField>

        <LabeledField label="Start date" htmlFor="cfg-start" hint="Snaps to week start">
          <input
            id="cfg-start"
            type="date"
            value={project.startDate}
            onChange={(e) => updateConfig({ startDate: e.target.value })}
            className={inputClass}
          />
        </LabeledField>

        <LabeledField label="Working days / week" htmlFor="cfg-wdpw">
          <input
            id="cfg-wdpw"
            type="number"
            min={1}
            max={7}
            value={project.workingDaysPerWeek}
            onChange={(e) => updateConfig({ workingDaysPerWeek: num(e.target.value, 5) })}
            className={inputClass}
          />
        </LabeledField>

        <LabeledField label="Input mode" htmlFor="cfg-mode">
          <select
            id="cfg-mode"
            value={project.inputMode}
            onChange={(e) => updateConfig({ inputMode: e.target.value as "days" | "hours" })}
            className={inputClass}
          >
            <option value="days">Days</option>
            <option value="hours">Hours</option>
          </select>
        </LabeledField>

        <LabeledField label="Hours / day" htmlFor="cfg-hpd" hint="Used in hours mode">
          <input
            id="cfg-hpd"
            type="number"
            min={1}
            value={project.hoursPerDay}
            onChange={(e) => updateConfig({ hoursPerDay: num(e.target.value, 8) })}
            className={inputClass}
          />
        </LabeledField>

        <LabeledField label="Skip threshold (days)" htmlFor="cfg-skip" hint="Skip if week leftover ≤ this">
          <input
            id="cfg-skip"
            type="number"
            step={0.1}
            min={0}
            value={project.skipThresholdDays}
            onChange={(e) => updateConfig({ skipThresholdDays: num(e.target.value, 0.5) })}
            className={inputClass}
          />
        </LabeledField>

        <LabeledField label="Display months" htmlFor="cfg-months">
          <input
            id="cfg-months"
            type="number"
            min={1}
            max={24}
            value={project.displayMonths}
            onChange={(e) => updateConfig({ displayMonths: num(e.target.value, 3) })}
            className={inputClass}
          />
        </LabeledField>

        <LabeledField label="Schedule mode" htmlFor="cfg-sched-mode" hint="Waterfall = max(roles); Parallel = BE/FE/QC lanes">
          <select
            id="cfg-sched-mode"
            value={project.scheduleMode}
            onChange={(e) => updateConfig({ scheduleMode: e.target.value as ScheduleMode })}
            className={inputClass}
          >
            <option value="waterfall">Waterfall (max)</option>
            <option value="parallel-track">Parallel track (BE/FE)</option>
          </select>
        </LabeledField>

        {project.scheduleMode === "parallel-track" && (
          <LabeledField label="FE UI ratio" htmlFor="cfg-fe-ratio" hint="Share of FE done before BE (rest = integration)">
            <input
              id="cfg-fe-ratio"
              type="number"
              step={0.05}
              min={0}
              max={1}
              value={project.feUiRatio}
              onChange={(e) => updateConfig({ feUiRatio: clampRatio(num(e.target.value, 0.6)) })}
              className={inputClass}
            />
          </LabeledField>
        )}
      </div>

      <RoleSettings />
    </div>
  );
}
