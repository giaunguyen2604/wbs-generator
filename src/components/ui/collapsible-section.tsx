import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

// Card with a collapsible body; used for the four main app sections.
export function CollapsibleSection({ title, defaultOpen = true, actions, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          {title}
        </button>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </section>
  );
}
