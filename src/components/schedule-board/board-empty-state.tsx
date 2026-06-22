// Shown when no enabled task has a positive duration to render.
export function BoardEmptyState() {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
      Nothing to schedule yet. Enable tasks and add estimates (max role estimate
      becomes the bar length).
    </div>
  );
}
