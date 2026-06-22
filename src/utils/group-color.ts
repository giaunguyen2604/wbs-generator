// Deterministic color assignment per level1 group so the same group keeps the
// same color across table chips and schedule bars within a session/render.

// Distinct, mid-saturation hues that read well on a light background.
const GROUP_PALETTE = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#0891b2", // cyan
  "#db2777", // pink
  "#65a30d", // lime
  "#4f46e5", // indigo
  "#ea580c", // orange
];

// Build a stable group -> color map from the ordered list of level1 names.
export function buildGroupColorMap(level1Names: string[]): Map<string, string> {
  const map = new Map<string, string>();
  let i = 0;
  for (const name of level1Names) {
    const key = name.trim();
    if (!key || map.has(key)) continue;
    map.set(key, GROUP_PALETTE[i % GROUP_PALETTE.length]);
    i += 1;
  }
  return map;
}

export function colorForGroup(
  map: Map<string, string>,
  level1: string | undefined
): string {
  return (level1 && map.get(level1.trim())) || "#64748b"; // slate fallback
}
