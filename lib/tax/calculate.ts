import { TAX_YEARS, type TaxYearConfig } from "./config";

export interface TaxInput {
  grossAnnual: number;          // euro
  pensionPct?: number;          // employee pension contribution as a fraction of gross, e.g. 0.05
  pensionAnnual?: number;       // or a fixed employee contribution in euro per year (takes priority over pensionPct)
  homeCarerCredit?: boolean;    // spouse is a home carer and income conditions are met
  year?: number;
}

export interface TaxResult {
  gross: number; pension: number; incomeTax: number; usc: number; prsi: number; netAnnual: number;
  taxBeforeCredits: number; credits: number;
  effectiveRate: number; marginalRate: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function uscFor(gross: number, cfg: TaxYearConfig): number {
  if (gross <= cfg.usc.exemptBelow) return 0;
  let tax = 0, prev = 0;
  for (const b of cfg.usc.bands) {
    const top = b.upTo ?? Infinity;
    if (gross > prev) tax += (Math.min(gross, top) - prev) * b.rate;
    prev = top;
  }
  return tax;
}

/** Employee PRSI (Class A): nothing at or below the weekly threshold, a tapered credit just above it, then the flat rate. */
export function prsiFor(gross: number, cfg: TaxYearConfig): number {
  const weekly = gross / 52;
  const { exemptWeekly, creditMax, creditCeilingWeekly } = cfg.prsiLowEarner;
  if (weekly <= exemptWeekly) return 0;
  let credit = 0;
  if (weekly <= creditCeilingWeekly) credit = Math.max(0, creditMax - (weekly - (exemptWeekly + 0.01)) / 6);
  return Math.max(0, (weekly * cfg.prsiRate - credit) * 52);
}

/** Employee pension contribution for a given gross pay: a fixed yearly amount if given, otherwise a share of gross. */
export function pensionFor(gross: number, input: Pick<TaxInput, "pensionPct" | "pensionAnnual">): number {
  return input.pensionAnnual !== undefined ? Math.min(Math.max(0, input.pensionAnnual), gross) : gross * (input.pensionPct ?? 0);
}

export function calculateTax(input: TaxInput): TaxResult {
  const cfg = TAX_YEARS[input.year ?? 2026];
  if (!cfg) throw new Error(`No tax configuration for ${input.year}`);
  const gross = Math.max(0, input.grossAnnual);
  const pension = pensionFor(gross, input);
  const taxable = gross - pension; // pension relief applies to income tax only, not USC or PRSI

  const standardPart = Math.min(taxable, cfg.standardRateCutOff);
  const higherPart = Math.max(0, taxable - cfg.standardRateCutOff);
  const taxBeforeCredits = standardPart * cfg.standardRate + higherPart * cfg.higherRate;
  const credits = cfg.credits.personalMarried + cfg.credits.paye + (input.homeCarerCredit ? cfg.credits.homeCarer : 0);
  const incomeTax = Math.max(0, taxBeforeCredits - credits);
  const usc = uscFor(gross, cfg);
  const prsi = prsiFor(gross, cfg);
  const netAnnual = gross - pension - incomeTax - usc - prsi;

  // Marginal rate: share of the next euro of gross pay lost to tax, USC and PRSI (pension contributions are not "lost").
  const step = 100;
  const netGain = calculateTaxNoRecurse(gross + step, input, cfg).netAnnual - netAnnual;
  const pensionShare = input.pensionAnnual !== undefined ? 0 : (input.pensionPct ?? 0);
  const marginal = 1 - (netGain + step * pensionShare) / step;

  return {
    gross: round2(gross), pension: round2(pension), incomeTax: round2(incomeTax), usc: round2(usc), prsi: round2(prsi),
    netAnnual: round2(netAnnual), taxBeforeCredits: round2(taxBeforeCredits), credits,
    effectiveRate: gross ? round2(((incomeTax + usc + prsi) / gross) * 100) / 100 : 0,
    marginalRate: Math.round(marginal * 1000) / 1000,
  };
}

function calculateTaxNoRecurse(gross: number, input: TaxInput, cfg: TaxYearConfig) {
  const pension = pensionFor(gross, input);
  const taxable = gross - pension;
  const tbc = Math.min(taxable, cfg.standardRateCutOff) * cfg.standardRate + Math.max(0, taxable - cfg.standardRateCutOff) * cfg.higherRate;
  const credits = cfg.credits.personalMarried + cfg.credits.paye + (input.homeCarerCredit ? cfg.credits.homeCarer : 0);
  const incomeTax = Math.max(0, tbc - credits);
  return { netAnnual: gross - pension - incomeTax - uscFor(gross, cfg) - prsiFor(gross, cfg) };
}

/** Working out gross pay from the take-home pay seen in the bank (inverse of calculateTax), by bisection. */
export function grossFromNet(netAnnual: number, opts: Omit<TaxInput, "grossAnnual"> = {}): number {
  let lo = 0, hi = 500000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (calculateTax({ ...opts, grossAnnual: mid }).netAnnual < netAnnual) lo = mid; else hi = mid;
  }
  return Math.round((lo + hi) / 2);
}

export const periodsPerYear = { weekly: 52, fourWeekly: 13, monthly: 12 } as const;
