import { useProjectStore } from "@/store/use-project-store";

// Small "Saving…/Saved" indicator reflecting debounced autosave state.
export function SaveStatusIndicator() {
  const status = useProjectStore((s) => s.saveStatus);
  const label =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Save failed" : "";
  if (!label) return null;
  const color =
    status === "saving" ? "text-amber-500" : status === "error" ? "text-red-600" : "text-emerald-600";
  return <span className={`text-xs ${color}`}>● {label}</span>;
}
