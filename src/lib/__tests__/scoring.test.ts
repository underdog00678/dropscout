import { describe, expect, it } from "vitest";

import { validateProduct } from "../scoring";

describe("validateProduct", () => {
  const expectRange = (value: number, min: number, max: number) => {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  };

  it("scores a generic phone case as saturated", () => {
    const result = validateProduct({ productText: "phone case" });

    expect(result.decision).not.toBe("green");
    expectRange(result.scores.total, 30, 60);
    expect(result.scores.competition).toBeGreaterThanOrEqual(7);
    expect(result.scores.brandability).toBeLessThanOrEqual(5);
  });

  it("keeps water bottle in red commodity territory", () => {
    const result = validateProduct({ productText: "water bottle" });

    expect(result.decision).toBe("red");
    expectRange(result.scores.total, 15, 45);
    expect(result.scores.competition).toBeGreaterThanOrEqual(8);
  });

  it("rates a wireless car mount charger higher than a phone case", () => {
    const phoneCase = validateProduct({ productText: "phone case" });
    const result = validateProduct({
      productText: "wireless car mount charger",
    });

    expect(result.scores.total).toBeGreaterThan(phoneCase.scores.total);
    expect(["yellow", "green"]).toContain(result.decision);
  });

  it("keeps ergonomic travel pillows in yellow range", () => {
    const baseline = validateProduct({ productText: "travel pillow" });
    const result = validateProduct({
      productText: "ergonomic travel pillow for long flights",
    });

    expect(result.decision).toBe("yellow");
    expectRange(result.scores.total, 45, 75);
    expect(result.scores.brandability).toBeGreaterThan(
      baseline.scores.brandability,
    );
  });

  it("scores baby bottle drying racks as steady demand", () => {
    const result = validateProduct({ productText: "baby bottle drying rack" });

    expect(result.scores.competition).toBeLessThanOrEqual(7);
    expectRange(result.scores.total, 45, 75);
  });

  it("keeps hydrocolloid patches in a mid-range band", () => {
    const result = validateProduct({
      productText: "hydrocolloid pimple patches",
    });

    expectRange(result.scores.total, 40, 70);
  });

  it("adds return/expectation risk to skincare devices", () => {
    const result = validateProduct({ productText: "LED skincare face wand" });
    const hasReturnWarning = result.warnings.some((warning) =>
      warning.toLowerCase().includes("return"),
    );

    expectRange(result.scores.total, 35, 70);
    expect(hasReturnWarning).toBe(true);
  });

  it("penalizes large patio chairs for shipping risk", () => {
    const result = validateProduct({ productText: "large outdoor patio chair" });

    expect(result.decision).toBe("red");
    expectRange(result.scores.total, 10, 40);
    expect(
      result.warnings.some((warning) =>
        warning.toLowerCase().includes("bulky"),
      ),
    ).toBe(true);
  });

  it("penalizes glass coffee tables for shipping risk", () => {
    const result = validateProduct({ productText: "glass coffee table" });

    expect(result.decision).toBe("red");
    expectRange(result.scores.total, 5, 35);
    expect(
      result.warnings.some((warning) =>
        warning.toLowerCase().includes("fragile"),
      ),
    ).toBe(true);
  });

  it("keeps compact kitchen prep tools in a mid-range band", () => {
    const result = validateProduct({
      productText: "compact garlic chopper for meal prep",
    });

    expectRange(result.scores.total, 40, 70);
  });
});
