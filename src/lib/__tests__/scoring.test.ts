import { describe, expect, it } from "vitest";

import { validateProduct } from "../scoring";

describe("validateProduct", () => {
  it("flags high competition for commodity products", () => {
    const result = validateProduct({ productText: "phone case" });

    expect(result.scores.competition).toBeGreaterThanOrEqual(7);
    expect(result.decision).not.toBe("green");
  });

  it("rewards niche, problem-solving products", () => {
    const result = validateProduct({
      productText: "ergonomic cable management tray",
    });

    expect(result.scores.demand).toBeGreaterThanOrEqual(6);
    expect(result.scores.brandability).toBeGreaterThanOrEqual(6);
    expect(["yellow", "green"]).toContain(result.decision);
  });

  it("raises shipping risk for fragile products", () => {
    const result = validateProduct({ productText: "glass lamp" });

    expect(result.scores.shipping).toBeGreaterThanOrEqual(7);
    expect(
      result.warnings.some((warning) =>
        warning.toLowerCase().includes("shipping"),
      ),
    ).toBe(true);
  });

  it("penalizes low-priced items on margin", () => {
    const result = validateProduct({ productText: "$9 keychain" });

    expect(result.scores.margin).toBeLessThanOrEqual(3);
    expect(result.decision).not.toBe("green");
  });

  it("warns about trend volatility for viral products", () => {
    const result = validateProduct({ productText: "viral tiktok gadget" });

    expect(
      result.warnings.some((warning) =>
        warning.toLowerCase().includes("trend"),
      ),
    ).toBe(true);
  });

  it("returns red for empty input", () => {
    const result = validateProduct({ productText: "   " });

    expect(result.decision).toBe("red");
    expect(
      result.reasons.some((reason) =>
        reason.toLowerCase().includes("insufficient"),
      ),
    ).toBe(true);
  });
});
