import { TAX_YEARS } from "./config";

/**
 * Working Family Payment, weekly. Paid at 60% of the gap between net weekly family income and the
 * income limit for the family size, subject to a minimum payment. Net income is after tax, USC and PRSI.
 * Child Benefit is not counted as income.
 */
export function wfpWeekly(netWeeklyIncome: number, children: number, year = 2026): number {
  const cfg = TAX_YEARS[year].wfp;
  if (children < 1) return 0;
  const limit = cfg.limits[Math.min(children, 4) as 1 | 2 | 3 | 4];
  const payment = (limit - netWeeklyIncome) * cfg.rate;
  return payment >= cfg.minWeekly ? Math.round(payment * 100) / 100 : 0;
}
