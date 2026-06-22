import { describe, it, expect } from "vitest";
import { daysToUnits, unitsToDays, hoursToDays, parseNumberCell, formatDays } from "@/utils/number-units";

describe("number-units", () => {
  it("converts days <-> units at 10 units/day without float drift", () => {
    expect(daysToUnits(1.5, 10)).toBe(15);
    expect(daysToUnits(0.1, 10)).toBe(1);
    expect(unitsToDays(50, 10)).toBe(5);
  });

  it("treats non-positive/invalid days as 0 units", () => {
    expect(daysToUnits(-2, 10)).toBe(0);
    expect(daysToUnits(NaN, 10)).toBe(0);
  });

  it("converts hours to days", () => {
    expect(hoursToDays(8, 8)).toBe(1);
    expect(hoursToDays(4, 8)).toBe(0.5);
  });

  it("parses loose cells (comma decimals, blanks)", () => {
    expect(parseNumberCell("1,5")).toBe(1.5);
    expect(parseNumberCell("")).toBe(0);
    expect(parseNumberCell("abc")).toBeNull();
  });

  it("formats days compactly", () => {
    expect(formatDays(1.0)).toBe("1");
    expect(formatDays(1.5)).toBe("1.5");
    expect(formatDays(undefined)).toBe("");
  });
});
