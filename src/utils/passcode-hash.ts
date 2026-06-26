// Hash a passcode with SHA-256 and return a lowercase hex string.
// Uses the Web Crypto API (available in browsers and modern Node). We only ever
// store / compare the hash — the plaintext passcode never touches Firestore.
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
