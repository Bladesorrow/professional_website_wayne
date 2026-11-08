// Pure aggregation helpers for the dashboard and tips engine. Amounts are cents, outflows negative.

export type Kind = "expense" | "income" | "transfer" | "savings";

export interface Tx {
  date: string; // yyyy-mm-dd
  amount_cents: number;
  merchant: string | null;
  description: string;
  category: string | null;
  kind: Kind | null;
}

export const UNCATEGORISED = "Uncategorised";

/**
 * Account 7440 is Wayne's wife's savings account. Money arriving from it is not income, but it funds spending,
 * so it is shown separately. Account 5770 (the rent pot) is not counted: the rent goes in monthly and comes back
 * weekly, so it nets out.
 */
export const RENT_POT = "Rent pot (5770)";
export const SAVINGS_7440 = "Savings moved in (7440)";
export const isSavingsIn = (t: Tx) => t.amount_cents > 0 && t.category === SAVINGS_7440;

/** Spending = expense categories, plus uncategorised outflows. Transfers and savings are not spending. */
export const isSpending = (t: Tx) => t.kind === "expense" || (t.kind === null && t.amount_cents < 0);
export const isIncome = (t: Tx) => t.kind === "income";
export const monthOf = (date: string) => date.slice(0, 7);
export const catName = (t: Tx) => t.category ?? UNCATEGORISED;

export function availableMonths(txs: Tx[]): string[] {
  return [...new Set(txs.map((t) => monthOf(t.date)))].sort().reverse();
}

export function monthTotals(txs: Tx[], month: string) {
  let spend = 0, income = 0, saved = 0, savingsIn = 0;
  for (const t of txs) {
    if (monthOf(t.date) !== month) continue;
    if (isSavingsIn(t)) savingsIn += t.amount_cents;
    if (isSpending(t)) spend += -t.amount_cents;
    else if (isIncome(t)) income += t.amount_cents;
    else if (t.kind === "savings") saved += -t.amount_cents;
  }
  return { spend, income, saved, savingsIn, net: income - spend };
}

export function byCategory(txs: Tx[], month?: string) {
  const m = new Map<string, number>();
  for (const t of txs) {
    if (!isSpending(t) || (month && monthOf(t.date) !== month)) continue;
    m.set(catName(t), (m.get(catName(t)) ?? 0) + -t.amount_cents);
  }
  return [...m.entries()].map(([name, cents]) => ({ name, cents })).filter((c) => c.cents > 0).sort((a, b) => b.cents - a.cents);
}

export function topMerchants(txs: Tx[], month: string | undefined, n = 8) {
  const m = new Map<string, { cents: number; count: number }>();
  for (const t of txs) {
    if (!isSpending(t) || (month && monthOf(t.date) !== month)) continue;
    const key = (t.merchant ?? t.description).trim() || t.description;
    const cur = m.get(key) ?? { cents: 0, count: 0 };
    cur.cents += -t.amount_cents; cur.count++;
    m.set(key, cur);
  }
  return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.cents - a.cents).slice(0, n);
}

/** Monday of the week containing the given ISO date. */
export function weekStart(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}

/** Spending per week for weeks that fall wholly inside the data (partial first and last weeks are dropped). */
export function weeklySpend(txs: Tx[], maxWeeks = 12) {
  if (!txs.length) return [];
  const dates = txs.map((t) => t.date).sort();
  const first = dates[0], last = dates[dates.length - 1];
  const firstFull = weekStart(first) === first ? first : addDays(weekStart(first), 7);
  const lastFullEnd = addDays(weekStart(last), -1); // Sunday before last week
  const m = new Map<string, number>();
  for (const t of txs) {
    if (!isSpending(t)) continue;
    const w = weekStart(t.date);
    if (w < firstFull || addDays(w, 6) > lastFullEnd) continue;
    m.set(w, (m.get(w) ?? 0) + -t.amount_cents);
  }
  return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).slice(-maxWeeks).map(([week, cents]) => ({ week, cents }));
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export interface Recurring { merchant: string; typicalCents: number; frequency: "weekly" | "monthly"; occurrences: number; perMonthCents: number }

/** Merchants charged at regular intervals with a stable amount (subscriptions, direct debits, standing payments). */
export function detectRecurring(txs: Tx[]): Recurring[] {
  const groups = new Map<string, Tx[]>();
  for (const t of txs) {
    if (!isSpending(t)) continue;
    const key = (t.merchant ?? t.description).trim();
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  const out: Recurring[] = [];
  for (const [merchant, list] of groups) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
    const amounts = sorted.map((t) => -t.amount_cents).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const stable = amounts.filter((a) => Math.abs(a - median) <= median * 0.2).length / amounts.length >= 0.7;
    if (!stable) continue;
    const gaps = sorted.slice(1).map((t, i) => daysBetween(sorted[i].date, t.date)).filter((g) => g > 0).sort((a, b) => a - b);
    if (gaps.length < 2) continue;
    const gap = gaps[Math.floor(gaps.length / 2)];
    const frequency = gap >= 6 && gap <= 8 ? "weekly" : gap >= 26 && gap <= 35 ? "monthly" : null;
    if (!frequency) continue;
    out.push({ merchant, typicalCents: median, frequency, occurrences: sorted.length, perMonthCents: frequency === "weekly" ? Math.round((median * 52) / 12) : median });
  }
  return out.sort((a, b) => b.perMonthCents - a.perMonthCents);
}

/** Average monthly spend per category across months fully covered by the data (excludes first and last month if partial). */
export function averageMonthlyByCategory(txs: Tx[], fullMonths: string[]) {
  const set = new Set(fullMonths);
  const m = new Map<string, number>();
  for (const t of txs) if (isSpending(t) && set.has(monthOf(t.date))) m.set(catName(t), (m.get(catName(t)) ?? 0) + -t.amount_cents);
  const n = Math.max(fullMonths.length, 1);
  return new Map([...m.entries()].map(([k, v]) => [k, Math.round(v / n)]));
}

/** Months wholly covered by the data: not the first or last month in the range unless it starts on day 1 / ends at month end. */
export function fullMonths(txs: Tx[]): string[] {
  if (!txs.length) return [];
  const dates = txs.map((t) => t.date).sort();
  const first = dates[0], last = dates[dates.length - 1];
  const months = [...new Set(dates.map(monthOf))].sort();
  return months.filter((mo) => {
    const startOk = mo > monthOf(first) || first.slice(8) <= "03"; // allow small gap at the start (weekend, bank delay)
    const endOk = mo < monthOf(last) || isMonthEnd(last);
    return startOk && endOk;
  });
}

function isMonthEnd(date: string) {
  const d = new Date(date + "T00:00:00Z");
  const next = new Date(d); next.setUTCDate(d.getUTCDate() + 3);
  return next.getUTCMonth() !== d.getUTCMonth();
}
