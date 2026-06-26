import { useState, type FormEvent, type ReactNode } from "react";
import { usePasscodeGate } from "@/hooks/use-passcode-gate";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/labeled-field";

// Full-screen passcode overlay that gates the whole app. Children render only
// once the gate is unlocked (correct passcode, or no passcode configured).
// Note: this is a soft, client-side gate for casual access control — the real
// access control is Firestore security rules, not this dialog.
export function PasscodeGate({ children }: { children: ReactNode }) {
  const { status, error, submit } = usePasscodeGate();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (status === "unlocked") return <>{children}</>;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !value.trim()) return;
    setBusy(true);
    await submit(value);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-[20rem] rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h1 className="text-base font-semibold text-slate-800">Enter passcode</h1>
        <p className="mt-1 text-xs text-slate-500">
          This site is protected. Enter the passcode to continue.
        </p>

        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Passcode"
          aria-label="Passcode"
          aria-invalid={error}
          className={`${inputClass} mt-4 w-full ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
        />

        {error && (
          <p className="mt-2 text-xs text-red-600">Incorrect passcode. Try again.</p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={busy || !value.trim()}
          className="mt-4 w-full justify-center"
        >
          {busy ? "Checking…" : "Unlock"}
        </Button>
      </form>
    </div>
  );
}
