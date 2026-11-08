// Irish tax parameters, keyed by tax year. All figures are in euro (not cents).
//
// IMPORTANT: these values were gathered from third-party sites because Revenue.ie and gov.ie were not
// reachable when this was written. Set `verified: true` only after checking each figure against
// Revenue.ie (rates, bands, credits, USC), gov.ie PRSI rates and the gov.ie Working Family Payment page,
// or against the household's Revenue Tax Credit Certificate.

export interface TaxYearConfig {
  year: number;
  verified: boolean;
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
