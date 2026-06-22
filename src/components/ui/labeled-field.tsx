import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
};

// Consistent label + control wrapper for config forms (accessibility §18).
export function LabeledField({ label, htmlFor, hint, children }: Props) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// Shared input style for text/number/date controls.
export const inputClass =
  "rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400";
