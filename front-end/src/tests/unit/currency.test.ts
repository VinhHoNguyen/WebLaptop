import { describe, expect, it } from "vitest";
import { formatVnd } from "../../utils/currency";

describe("formatVnd", () => {
  it("formats number to VND string", () => {
    expect(formatVnd(1500000)).toContain("1.500.000");
  });

  it("accepts numeric string", () => {
    expect(formatVnd("200000")).toContain("200.000");
  });

  it("returns zero string for invalid input", () => {
    expect(formatVnd("abc")).toBe("0 đ");
    expect(formatVnd(undefined)).toBe("0 đ");
  });
});
