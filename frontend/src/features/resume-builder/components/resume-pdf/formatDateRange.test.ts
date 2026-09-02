import { describe, expect, it } from "vitest";
import { formatDateRange } from "./formatDateRange";

describe("formatDateRange", () => {
  it("joins a start and end date with an en dash", () => {
    expect(formatDateRange("2021", "2024", false)).toBe("2021 – 2024");
  });

  it("uses 'Present' when the entry is current, ignoring the end date", () => {
    expect(formatDateRange("2021", "2023", true)).toBe("2021 – Present");
  });

  it("drops a missing start date", () => {
    expect(formatDateRange("", "2024", false)).toBe("2024");
  });

  it("drops a missing end date when not current", () => {
    expect(formatDateRange("2021", "", false)).toBe("2021");
  });

  it("returns an empty string when both dates are missing", () => {
    expect(formatDateRange("", "", false)).toBe("");
  });
});
