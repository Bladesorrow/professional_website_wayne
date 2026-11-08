// Rule-based savings tips. Savings figures are estimates, labelled as such in the UI.
import { averageMonthlyByCategory, fullMonths, isSpending, monthOf, monthTotals, type Tx } from "@/lib/analytics";
import { fmt0 } from "@/lib/money";

export interface Tip { id: string; title: string; detail: string; savingPerMonthCents: number }
export interface Goal { id?: string; name: string; target_cents: number | string; saved_cents: number | string; deadline: string | null }

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function buildTips(txs: Tx[], opts: { goals?: Goal[]; today?: string } = {}): Tip[] {
  if (!txs.length) return [];
  const tips: Tip[] = [];
  const dates = txs.map((t) => t.date).sort();
  const spanDays = Math.max(1, (Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / 86400000 + 1);
  const full = fullMonths(txs);
  // Per-month averages: use whole months where possible, otherwise scale the whole span to 30.4 days.
  const avg = full.length ? averageMonthlyByCategory(txs, full) : scaled(txs, spanDays);
  const perMonth = (name: string) => avg.get(name) ?? 0;
  const monthsCovered = Math.max(spanDays / 30.4, 1);

  const eatOut = perMonth("Eating out & takeaways");
  if (eatOut >= 8000) {
    const s = Math.round(eatOut * 0.3);
    tips.push({ id: "eating-out", title: "Cut takeaways and eating out by about a third",
      detail: `You spend about ${fmt0(eatOut)} a month on takeaways and eating out. Cooking two more meals at home each week, or a monthly "treat" budget, could free up around ${fmt0(s)}.`, savingPerMonthCents: s });
  }

  const snacks = perMonth("Coffee & snacks");
  const snackCount = txs.filter((t) => t.category === "Coffee & snacks" && isSpending(t)).length / monthsCovered;
  if (snacks >= 8000) {
    const s = Math.round(snacks * 0.35);
    tips.push({ id: "snacks", title: "Small shop and cafe stops add up",
      detail: `About ${Math.round(snackCount)} small purchases a month (Centra, Spar, cafes, vending) come to roughly ${fmt0(snacks)}. Packing snacks and drinks for the kids' days out and taking a flask could save about ${fmt0(s)}.`, savingPerMonthCents: s });
  }

  const groceries = perMonth("Groceries");
  if (groceries >= 30000) {
    const premium = txs.filter((t) => t.category === "Groceries" && isSpending(t) && /TESCO|SUPERVALU|DUNNES/i.test(t.merchant ?? ""));
    const disc = txs.filter((t) => t.category === "Groceries" && isSpending(t) && /ALDI|LIDL/i.test(t.merchant ?? ""));
    const premTotal = sum(premium.map((t) => -t.amount_cents)), discTotal = sum(disc.map((t) => -t.amount_cents));
    const share = premTotal + discTotal ? Math.round((discTotal / (premTotal + discTotal)) * 100) : 0;
    const s = Math.round(groceries * 0.1);
    tips.push({ id: "groceries", title: "Trim the grocery bill with a weekly plan",
      detail: `Groceries average about ${fmt0(groceries)} a month, with only ${share}% spent at Aldi or Lidl. A weekly meal plan with one bigger shop (instead of many small Tesco and SuperValu trips), own-brand staples and shopping more at the discounters could save around ${fmt0(s)}.`, savingPerMonthCents: s });
  }

  // Same subscription charged more than once in a month
  const byMerchantMonth = new Map<string, Tx[]>();
  for (const t of txs) {
    if (t.category !== "Subscriptions & TV" || !isSpending(t)) continue;
    const key = `${(t.merchant ?? t.description)}|${monthOf(t.date)}`;
    byMerchantMonth.set(key, [...(byMerchantMonth.get(key) ?? []), t]);
  }
  const doubled = new Map<string, number[]>();
  for (const [key, list] of byMerchantMonth) {
    if (list.length >= 2) {
      const name = key.split("|")[0];
      const amounts = list.map((t) => -t.amount_cents).sort((a, b) => a - b);
      doubled.set(name, [...(doubled.get(name) ?? []), amounts[0]]);
    }
  }
  for (const [name, mins] of doubled) {
    if (mins.length >= 2 && Math.max(...mins) >= 1500) {
      const s = Math.round(sum(mins) / mins.length);
      tips.push({ id: `double-${name}`, title: `${name} is charged twice a month`,
        detail: `${name} shows two payments in ${mins.length} different months, each around ${fmt0(s)}. If that is two accounts or packages, check whether you need both. Cancelling one could save about ${fmt0(s)} a month.`, savingPerMonthCents: s });
    }
  }

  const subs = perMonth("Subscriptions & TV");
  if (subs >= 5000) {
    const s = Math.round(subs * 0.2);
    tips.push({ id: "subscriptions", title: "Review TV, streaming and app subscriptions",
      detail: `Subscriptions and TV cost about ${fmt0(subs)} a month (Sky, Disney+, Apple, TV licence). Rotate streaming services month by month and ask Sky for a retention deal. That could be worth around ${fmt0(s)}.`, savingPerMonthCents: s });
  }

  const energy = perMonth("Energy & utilities");
  if (energy >= 8000) {
    const s = Math.round(energy * 0.1);
    tips.push({ id: "energy", title: "Compare electricity and gas providers",
      detail: `You pay about ${fmt0(energy)} a month for energy. Switching supplier once a year to the best new-customer deal often saves 10% or more, about ${fmt0(s)} a month. Check your smart meter day and night usage too.`, savingPerMonthCents: s });
  }

  const shopping = perMonth("Clothes & shopping");
  if (shopping >= 15000) {
    const s = Math.round(shopping * 0.2);
    tips.push({ id: "shopping", title: "Put a monthly cap on shopping",
      detail: `Clothes, online orders and shops average about ${fmt0(shopping)} a month. A monthly cap, a 48-hour rule on non-essentials and checking Next and Amazon returns could save about ${fmt0(s)}.`, savingPerMonthCents: s });
  }

  const cash = perMonth("Cash");
  if (cash >= 10000) {
    tips.push({ id: "cash", title: "Cash withdrawals are untracked spending",
      detail: `About ${fmt0(cash)} a month goes out as cash, so you can't see where it went. Try paying by card for a month to find the leaks.`, savingPerMonthCents: Math.round(cash * 0.15) });
  }

  const fees = perMonth("Bank fees & interest");
  if (fees >= 300) {
    tips.push({ id: "fees", title: "Avoid bank fees and interest",
      detail: `Fees and interest cost about ${fmt0(fees)} a month. Staying out of overdraft (the balance dips below zero often) and avoiding emergency cash charges will remove this.`, savingPerMonthCents: fees });
  }

  // Goals: how much per week to reach each one
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const savedPerWeek = sum(txs.filter((t) => t.kind === "savings").map((t) => -t.amount_cents)) / (spanDays / 7);
  for (const g of opts.goals ?? []) {
    if (!g.deadline) continue;
    const remaining = Number(g.target_cents) - Number(g.saved_cents);
    const weeks = Math.max(1, Math.round((Date.parse(g.deadline) - Date.parse(today)) / (7 * 86400000)));
    if (remaining <= 0) continue;
    const need = Math.round(remaining / weeks);
    tips.push({ id: `goal-${g.name}`, title: `${g.name}: save ${fmt0(need)} a week`,
      detail: `You need ${fmt0(remaining)} more in ${weeks} weeks. You currently move about ${fmt0(Math.round(savedPerWeek))} a week to savings, so ${need > savedPerWeek ? `the gap is about ${fmt0(Math.round(need - savedPerWeek))} a week` : "you are on track"}.`, savingPerMonthCents: 0 });
  }
  if (!(opts.goals ?? []).length) {
    tips.push({ id: "no-goal", title: "Set a holiday goal",
      detail: "Add a savings goal with a target and date, and My Finance will work out the weekly amount. You already move money to savings each week, so the habit is there.", savingPerMonthCents: 0 });
  }
  tips.sort((a, b) => b.savingPerMonthCents - a.savingPerMonthCents);

  // Savings from account 7440 (Wayne's wife's) covering the gap is the most important thing to see, so it goes first.
  const gaps = full.map((mo) => ({ mo, ...monthTotals(txs, mo) })).filter((m) => m.spend > m.income && m.savingsIn > 0);
  if (gaps.length >= 2) {
    const avgGap = Math.round(sum(gaps.map((g) => g.spend - g.income)) / gaps.length);
    const avgSavingsIn = Math.round(sum(gaps.map((g) => g.savingsIn)) / gaps.length);
    tips.unshift({ id: "savings-drain", title: "Savings are covering the gap between spending and income",
      detail: `In ${gaps.length} of the last ${full.length} full months you spent about ${fmt0(avgGap)} a month more than came into this account from pay and social welfare. Your wife's savings (account 7440) moved about ${fmt0(avgSavingsIn)} a month in to cover it. That is savings being used up, roughly ${fmt0(avgSavingsIn * 12)} a year, instead of building towards the holiday fund. Every ${fmt0(10000)} a month cut from spending keeps ${fmt0(120000)} a year in savings.`, savingPerMonthCents: 0 });
  }
  return tips;
}

function scaled(txs: Tx[], spanDays: number) {
  const m = new Map<string, number>();
  for (const t of txs) if (isSpending(t)) { const k = t.category ?? "Uncategorised"; m.set(k, (m.get(k) ?? 0) + -t.amount_cents); }
  return new Map([...m.entries()].map(([k, v]) => [k, Math.round((v / spanDays) * 30.4)]));
}
