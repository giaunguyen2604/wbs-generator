import { useCallback, useEffect, useState } from "react";
import { fetchPasscodeHash } from "@/storage/access-passcode-repository";
import { sha256Hex } from "@/utils/passcode-hash";

// localStorage remembers WHICH hash the user unlocked with (not just a flag),
// so rotating the passcode (new hash) automatically invalidates old sessions.
const STORAGE_KEY = "wbs:passcode-unlocked-hash";

type GateStatus = "loading" | "locked" | "unlocked";

type Gate = {
  status: GateStatus;
  error: boolean;
  // Verify an entered passcode; on success persist + unlock. Returns success.
  submit: (passcode: string) => Promise<boolean>;
};

// Drives the site passcode overlay. On mount it loads the configured hash:
// - no hash configured  → unlocked (app stays usable)
// - localStorage hash matches the configured hash → unlocked (remembered)
// - otherwise → locked until the correct passcode is entered.
export function usePasscodeGate(): Gate {
  const [status, setStatus] = useState<GateStatus>("loading");
  const [error, setError] = useState(false);
  const [requiredHash, setRequiredHash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPasscodeHash()
      .then((hash) => {
        if (cancelled) return;
        setRequiredHash(hash);
        if (!hash) {
          setStatus("unlocked");
          return;
        }
        const remembered = localStorage.getItem(STORAGE_KEY);
        setStatus(remembered === hash ? "unlocked" : "locked");
      })
      .catch(() => {
        // On read failure, fail OPEN so a backend hiccup can't lock everyone out.
        if (!cancelled) setStatus("unlocked");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(
    async (passcode: string): Promise<boolean> => {
      if (!requiredHash) return true;
      const entered = await sha256Hex(passcode.trim());
      if (entered !== requiredHash) {
        setError(true);
        return false;
      }
      localStorage.setItem(STORAGE_KEY, requiredHash);
      setError(false);
      setStatus("unlocked");
      return true;
    },
    [requiredHash]
  );

  return { status, error, submit };
}
