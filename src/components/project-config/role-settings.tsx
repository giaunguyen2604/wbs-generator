import type { Role } from "@/types/role";
import { useProjectStore } from "@/store/use-project-store";
import { inputClass } from "@/components/ui/labeled-field";

// Manage role enable/name/color. Estimates are keyed by role.key, so we keep
// keys stable and only edit name/color/enabled here (MVP — no add/remove role).
export function RoleSettings() {
  const roles = useProjectStore((s) => s.data.project.roles);
  const updateRoles = useProjectStore((s) => s.updateRoles);

  const patch = (id: string, change: Partial<Role>) =>
    updateRoles(roles.map((r) => (r.id === id ? { ...r, ...change } : r)));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Roles / Teams
      </span>
      <div className="flex flex-wrap gap-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5"
          >
            <input
              type="checkbox"
              checked={role.enabled}
              onChange={(e) => patch(role.id, { enabled: e.target.checked })}
              aria-label={`Enable ${role.name}`}
            />
            <input
              type="color"
              value={role.color ?? "#64748b"}
              onChange={(e) => patch(role.id, { color: e.target.value })}
              aria-label={`${role.name} color`}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <input
              value={role.name}
              onChange={(e) => patch(role.id, { name: e.target.value })}
              aria-label={`${role.name} label`}
              className={`${inputClass} w-24`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
