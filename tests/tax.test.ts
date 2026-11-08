import { describe, expect, it } from "vitest";
import { calculateTax, grossFromNet, prsiFor, uscFor } from "../lib/tax/calculate";
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
  it("takes a fixed yearly pension amount: relief on income tax only", () => {
    const none = calculateTax({ grossAnnual: 48000, homeCarerCredit: true });
    const fixed = calculateTax({ grossAnnual: 48000, homeCarerCredit: true, pensionAnnual: 650 });
    expect(fixed.pension).toBe(650);
    expect(fixed.usc).toBe(none.usc);
    expect(fixed.prsi).toBe(none.prsi);
    expect(fixed.incomeTax).toBeCloseTo(none.incomeTax - 650 * 0.2, 2);
    expect(fixed.netAnnual).toBeCloseTo(none.netAnnual - 650 + 650 * 0.2, 2);
    expect(fixed.marginalRate).toBeCloseTo(none.marginalRate, 3);
  });
  it("finds the gross behind a take-home that already has pension taken off", () => {
    const net = calculateTax({ grossAnnual: 48000, homeCarerCredit: true, pensionAnnual: 650 }).netAnnual;
    expect(Math.abs(grossFromNet(net, { homeCarerCredit: true, pensionAnnual: 650 }) - 48000)).toBeLessThanOrEqual(1);
  });
  it("inverts net to gross", () => {
    const net = calculateTax({ grossAnnual: 45000 }).netAnnual;
    expect(Math.abs(grossFromNet(net) - 45000)).toBeLessThanOrEqual(1);
  });
  it("marginal rate jumps above the cut-off", () => {
    expect(calculateTax({ grossAnnual: 50000 }).marginalRate).toBeLessThan(calculateTax({ grossAnnual: 60000 }).marginalRate);
  });
});

describe("PRSI", () => {
  it("is nil at or below €352 a week, tapers above it, and is flat above €424 a week", () => {
    expect(prsiFor(352 * 52, cfg)).toBe(0);
    const justAbove = prsiFor(352.01 * 52, cfg);
    expect(justAbove).toBeLessThan(352.01 * 52 * cfg.prsiRate - 11.9 * 52);
    expect(prsiFor(424 * 52, cfg)).toBeCloseTo(424 * 52 * cfg.prsiRate - (12 - (424 - 352.01) / 6) * 52, 2);
    expect(prsiFor(45000, cfg)).toBeCloseTo(45000 * cfg.prsiRate, 2);
  });
});

describe("Working Family Payment", () => {
  it("pays 60% of the gap below the limit for four children", () => {
    expect(wfpWeekly(780, 4)).toBeCloseTo((1058 - 780) * 0.6, 2);
  });
  it("applies the €20 minimum weekly payment", () => {
    expect(wfpWeekly(1058 - 40, 4)).toBeCloseTo(24, 2);  // 60% of 40
    expect(wfpWeekly(1058 - 30, 4)).toBe(0);              // 60% of 30 = 18, below the minimum
  });
  it("pays nothing above the limit or with no children", () => {
    expect(wfpWeekly(1100, 4)).toBe(0);
    expect(wfpWeekly(500, 0)).toBe(0);
  });
});
