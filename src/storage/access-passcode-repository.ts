import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-app";

// Site-access passcode lives in a single well-known document: meta/access.
// Only the SHA-256 hash is stored (field `passcodeHash`) — never the plaintext.
// Seeded out-of-band by scripts/seed-passcode.mjs.
const META = "meta";
const ACCESS_DOC = "access";

const accessDoc = () => doc(db, META, ACCESS_DOC);

// Fetch the configured passcode hash, or null if no passcode has been set
// (in which case the gate stays open so the app remains usable).
export async function fetchPasscodeHash(): Promise<string | null> {
  const snap = await getDoc(accessDoc());
  if (!snap.exists()) return null;
  const hash = (snap.data() as { passcodeHash?: unknown }).passcodeHash;
  return typeof hash === "string" && hash.length > 0 ? hash : null;
}
