// Parse clipboard text from Google Sheets / Excel into a 2D string grid.
// Sheets copies as TSV; we also tolerate CSV-ish input as a fallback.
export function parseTsv(text: string): string[][] {
  const normalized = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (normalized === "") return [];

  const lines = normalized.split("\n");
  const hasTab = normalized.includes("\t");
  const delimiter = hasTab ? "\t" : ",";

  return lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
}

// Normalize a grid so every row has the same column count.
export function padGrid(grid: string[][]): string[][] {
  const cols = grid.reduce((m, r) => Math.max(m, r.length), 0);
  return grid.map((row) => {
    const copy = row.slice();
    while (copy.length < cols) copy.push("");
    return copy;
  });
}
