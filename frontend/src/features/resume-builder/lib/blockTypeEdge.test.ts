import { describe, expect, it } from "vitest";
import { getEdgeColor, getEdgeStripeBackground, isDashedEdge } from "./blockTypeEdge";

describe("isDashedEdge", () => {
  it("is true only for custom blocks", () => {
    expect(isDashedEdge("custom")).toBe(true);
    expect(isDashedEdge("work_experience")).toBe(false);
  });
});

describe("getEdgeColor", () => {
  it("maps known block types to their CSS variable", () => {
    expect(getEdgeColor("work_experience")).toBe("var(--edge-work_experience)");
  });

  it("falls back to the hairline color for unmapped types", () => {
    expect(getEdgeColor("custom")).toBe("var(--hairline)");
  });
});

describe("getEdgeStripeBackground", () => {
  it("caps the stripe count at 3 regardless of higher usage", () => {
    const atCap = getEdgeStripeBackground("work_experience", 3);
    const overCap = getEdgeStripeBackground("work_experience", 12);
    expect(overCap).toBe(atCap);
  });

  it("treats zero or negative usage as a single stripe", () => {
    expect(getEdgeStripeBackground("project", 0)).toBe(getEdgeStripeBackground("project", 1));
  });

  it("renders more gradient stops as usage count increases", () => {
    const one = getEdgeStripeBackground("skills", 1);
    const two = getEdgeStripeBackground("skills", 2);
    const three = getEdgeStripeBackground("skills", 3);
    expect(one.split(",").length).toBeLessThan(two.split(",").length);
    expect(two.split(",").length).toBeLessThan(three.split(",").length);
  });
});
