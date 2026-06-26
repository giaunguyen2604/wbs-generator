// Seed the site-access passcode into Firestore (meta/access).
//
// Generates a random passcode, prints it ONCE to the console (this is the only
// time you will see it — store it safely), and writes only its SHA-256 hash to
// Firestore. The app reads that hash to gate access; the plaintext is never
// persisted.
//
// Usage:  node scripts/seed-passcode.mjs
// Reads Firebase web config from .env (VITE_FIREBASE_* keys).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "..", ".env");

// Minimal .env parser (KEY=VALUE per line) — avoids adding a dotenv dependency.
function loadEnv(path) {
  const out = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

// Readable random passcode: 16 chars from an unambiguous base-32 alphabet
// (no 0/O/1/I/L), grouped as XXXX-XXXX-XXXX-XXXX for easy sharing.
function generatePasscode() {
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  let s = "";
  for (let i = 0; i < 16; i++) {
    s += ALPHABET[bytes[i] % ALPHABET.length];
    if (i % 4 === 3 && i !== 15) s += "-";
  }
  return s;
}

const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");

async function main() {
  const env = loadEnv(ENV_PATH);
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Missing Firebase config in .env (VITE_FIREBASE_* keys).");
  }

  const passcode = generatePasscode();
  const passcodeHash = sha256Hex(passcode);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  await setDoc(doc(db, "meta", "access"), {
    passcodeHash,
    updatedAt: new Date().toISOString(),
  });

  console.log("\n  Site passcode seeded to Firestore (meta/access).");
  console.log("  Only the SHA-256 hash was stored — keep this passcode safe:\n");
  console.log("    ┌────────────────────────────────────┐");
  console.log(`    │   ${passcode}   │`);
  console.log("    └────────────────────────────────────┘\n");
  console.log("  Re-run this script to rotate the passcode (invalidates old sessions).\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed passcode:", err);
  process.exit(1);
});
