// Irish tax parameters, keyed by tax year. All figures are in euro (not cents).
//
// Checked on 2026-11-08 against revenue.ie (tax rate bands, credits, USC thresholds and exemption) and the
// gov.ie Working Family Payment page (income limits, 60% rule, net-income definition).
// Still to confirm: the employee PRSI rate and the WFP minimum payment. Set `verified: true` once they are.

export interface TaxYearConfig {
  year: number;
  verified: boolean;
  verifiedOn: string;
  verifiedItems: string[];
  unverifiedItems: string[];
  /** Standard-rate cut-off point for a married couple with one income. */
  standardRateCutOff: number;
  standardRate: number;
  higherRate: number;
  credits: { personalMarried: number; paye: number; homeCarer: number };
  usc: { exemptBelow: number; bands: { upTo: number | null; rate: number }[] };
  /** Employee PRSI Class A. 2026 blends the rate rise on 1 October (9 months old rate, 3 months new rate). */
  prsiRate: number;
  prsiNote: string;
  /** Working Family Payment weekly net-income limit by number of children (4 = four or more) and payment rate. */
  wfp: { limits: Record<1 | 2 | 3 | 4, number>; rate: number; minWeekly: number };
  /** Employee pay periods per year for 4-weekly pay. */
  fourWeeklyPeriods: number;
}

export const TAX_YEARS: Record<number, TaxYearConfig> = {
  2026: {
    year: 2026,
    verified: false,
    verifiedOn: "8 Nov 2026",
    verifiedItems: [
      "income tax rates and the €53,000 cut-off for a married couple with one income (Revenue.ie)",
      "personal, PAYE and home carer tax credits (Revenue.ie)",
      "USC bands and the €13,000 exemption (Revenue.ie)",
      "Working Family Payment limits, 60% rule and net-income definition (gov.ie)",
    ],
    unverifiedItems: ["employee PRSI rate", "Working Family Payment minimum weekly payment"],
    standardRateCutOff: 53000,
    standardRate: 0.2,
    higherRate: 0.4,
    credits: { personalMarried: 4000, paye: 2000, homeCarer: 1950 },
    usc: {
      exemptBelow: 13000,
      bands: [
        { upTo: 12012, rate: 0.005 },
        { upTo: 28700, rate: 0.02 },
        { upTo: 70044, rate: 0.03 },
        { upTo: null, rate: 0.08 },
      ],
    },
    prsiRate: 0.042375,
    prsiNote: "4.2% to 30 Sep 2026 and 4.35% from 1 Oct 2026, blended over the year",
    wfp: { limits: { 1: 765, 2: 866, 3: 967, 4: 1058 }, rate: 0.6, minWeekly: 30 },
    fourWeeklyPeriods: 13,
  },
};

export const CURRENT_TAX_YEAR = 2026;
