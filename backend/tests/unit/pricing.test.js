import { describe, expect, it } from "vitest";
import { computeTotals, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "../../src/utils/pricing.js";

describe("computeTotals", () => {
  it("charges delivery below the threshold", () => {
    expect(computeTotals([{ price: 100, quantity: 2 }])).toEqual({ subtotal: 200, delivery_fee: DELIVERY_FEE, total: 249 });
  });

  it("waives delivery at the threshold", () => {
    expect(computeTotals([{ price: FREE_DELIVERY_THRESHOLD, quantity: 1 }]).delivery_fee).toBe(0);
  });

  it("charges nothing for an empty cart", () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, delivery_fee: 0, total: 0 });
  });

  it("avoids floating point drift", () => {
    expect(computeTotals([{ price: 0.1, quantity: 3 }]).subtotal).toBe(0.3);
  });
});
