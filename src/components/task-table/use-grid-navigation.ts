import { useCallback, useState } from "react";

export type CellPos = { row: number; col: number };

// Manages the active grid cell + arrow/Tab/Enter movement within bounds.
export function useGridNavigation(rowCount: number, colCount: number) {
  const [active, setActive] = useState<CellPos | null>(null);

  const clamp = useCallback(
    (pos: CellPos): CellPos => ({
      row: Math.max(0, Math.min(rowCount - 1, pos.row)),
      col: Math.max(0, Math.min(colCount - 1, pos.col)),
    }),
    [rowCount, colCount]
  );

  const move = useCallback(
    (dr: number, dc: number) => {
      setActive((cur) => clamp(cur ? { row: cur.row + dr, col: cur.col + dc } : { row: 0, col: 0 }));
    },
    [clamp]
  );

  // Returns true if the key was handled as navigation (caller should stop edit).
  const handleNavKey = useCallback(
    (e: React.KeyboardEvent): boolean => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          move(-1, 0);
          return true;
        case "ArrowDown":
        case "Enter":
          e.preventDefault();
          move(1, 0);
          return true;
        case "ArrowLeft":
          if ((e.target as HTMLInputElement).selectionStart === 0) {
            e.preventDefault();
            move(0, -1);
            return true;
          }
          return false;
        case "ArrowRight": {
          const el = e.target as HTMLInputElement;
          if (el.selectionStart === el.value.length) {
            e.preventDefault();
            move(0, 1);
            return true;
          }
          return false;
        }
        case "Tab":
          e.preventDefault();
          move(0, e.shiftKey ? -1 : 1);
          return true;
        default:
          return false;
      }
    },
    [move]
  );

  return { active, setActive, move, handleNavKey };
}
