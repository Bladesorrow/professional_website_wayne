import { describe, expect, it } from "vitest";
import { calculateTax, grossFromNet, uscFor } from "../lib/tax/calculate";
import { TAX_YEARS } from "../lib/tax/config";
import { wfpWeekly } from "../lib/tax/wfp";

const cfg = TAX_YEARS[2026];

describe("USC", () => {
  it("is zero at or below the exemption and tiered above it", () => {
    expect(uscFor(13000, cfg)).toBe(0);
    // 12,012 * 0.5% + (28,700-12,012) * 2% + (45,000-28,700) * 3%
    expect(uscFor(45000, cfg)).toBeCloseTo(60.06 + 333.76 + 489, 2);
  });
});

describe("calculateTax (married, one income)", () => {
  it("applies 20% to the cut-off and 40% above, less credits", () => {
    const r = calculateTax({ grossAnnual: 60000 });
    expect(r.taxBeforeCredits).toBeCloseTo(53000 * 0.2 + 7000 * 0.4, 2);
    expect(r.incomeTax).toBeCloseTo(r.taxBeforeCredits - 6000, 2);
    expect(r.netAnnual).toBeCloseTo(60000 - r.incomeTax - r.usc - r.prsi, 2);
  });
  it("never produces negative tax and handles zero", () => {
    expect(calculateTax({ grossAnnual: 10000 }).incomeTax).toBe(0);
    expect(calculateTax({ grossAnnual: 0 }).netAnnual).toBe(0);
  });
  it("pension reduces income tax only, and home carer credit reduces tax", () => {
    const a = calculateTax({ grossAnnual: 60000 });
    const b = calculateTax({ grossAnnual: 60000, pensionPct: 0.05 });
    expect(b.usc).toBe(a.usc);
    expect(b.prsi).toBe(a.prsi);
    expect(b.incomeTax).toBeLessThan(a.incomeTax);
    expect(calculateTax({ grossAnnual: 60000, homeCarerCredit: true }).incomeTax).toBeCloseTo(a.incomeTax - cfg.credits.homeCarer, 2);
  });
  it("inverts net to gross", () => {
    const net = calculateTax({ grossAnnual: 45000 }).netAnnual;
    expect(Math.abs(grossFromNet(net) - 45000)).toBeLessThanOrEqual(1);
  });
  it("marginal rate jumps above the cut-off", () => {
    expect(calculateTax({ grossAnnual: 50000 }).marginalRate).toBeLessThan(calculateTax({ grossAnnual: 60000 }).marginalRate);
  });
});

describe("Working Family Payment", () => {
  it("pays 60% of the gap below the limit for four children", () => {
    expect(wfpWeekly(780, 4)).toBeCloseTo((1058 - 780) * 0.6, 2);
  });
  it("pays nothing above the limit or with no children", () => {
    expect(wfpWeekly(1100, 4)).toBe(0);
    expect(wfpWeekly(500, 0)).toBe(0);
  });
});
