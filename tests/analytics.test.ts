import { describe, expect, it } from "vitest";
import { byCategory, detectRecurring, fullMonths, monthTotals, weekStart, weeklySpend, type Tx } from "../lib/analytics";

const t = (date: string, cents: number, merchant: string, category: string | null, kind: Tx["kind"] = "expense"): Tx =>
  ({ date, amount_cents: cents, merchant, description: merchant, category, kind });

describe("analytics", () => {
  const txs: Tx[] = [
    t("2026-10-02", -5000, "TESCO", "Groceries"),
    t("2026-10-09", -3000, "TESCO", "Groceries"),
    t("2026-10-10", 300000, "GRAFTON", "Salary", "income"),
    t("2026-10-11", -2000, "SAVINGS", "Savings", "savings"),
    t("2026-10-12", -70000, "PTSB VISA", "Transfers", "transfer"),
  ];
  it("excludes transfers and savings from spending", () => {
    expect(monthTotals(txs, "2026-10")).toEqual({ spend: 8000, income: 300000, saved: 2000, topUps: 0, net: 292000 });
    expect(byCategory(txs, "2026-10")).toEqual([{ name: "Groceries", cents: 8000 }]);
  });
  it("counts money from the funding accounts as top-ups, not income", () => {
    const withTopUps = [...txs, t("2026-10-14", 50000, "Fr 7440", "Top-ups from 7440", "transfer"), t("2026-10-15", 14000, "Fr 5770", "Rent funding (from 5770)", "transfer"), t("2026-10-16", -9000, "to 5770", "Transfers", "transfer")];
    const m = monthTotals(withTopUps, "2026-10");
    expect(m.topUps).toBe(64000);
    expect(m.income).toBe(300000);
  });
  it("finds the Monday of a week", () => {
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // Sunday
    expect(weekStart("2026-11-09")).toBe("2026-11-09"); // Monday
  });
  it("detects weekly and monthly recurring payments", () => {
    const rec = detectRecurring([
      ...["2026-09-03", "2026-09-10", "2026-09-17", "2026-09-24"].map((d) => t(d, -14000, "GALWAY CO CO", "Housing")),
      ...["2026-08-04", "2026-09-04", "2026-10-04"].map((d) => t(d, -1333, "AN POST TV", "Subscriptions & TV")),
      t("2026-09-05", -1999, "RANDOM SHOP", "Other"),
    ]);
    expect(rec.map((r) => [r.merchant, r.frequency])).toEqual([["GALWAY CO CO", "weekly"], ["AN POST TV", "monthly"]]);
    expect(rec[0].perMonthCents).toBe(Math.round((14000 * 52) / 12));
  });
  it("drops partial weeks and months", () => {
    const data = [t("2026-08-10", -100, "A", "Other"), t("2026-09-15", -100, "A", "Other"), t("2026-11-09", -100, "A", "Other")];
    expect(fullMonths(data)).toEqual(["2026-09"]);
    const wk = weeklySpend([t("2026-11-04", -100, "A", "Other"), t("2026-11-10", -200, "A", "Other"), t("2026-11-17", -300, "A", "Other"), t("2026-11-25", -300, "A", "Other")]);
    expect(wk.map((w) => w.week)).toEqual(["2026-11-09", "2026-11-16"]);
  });
});
