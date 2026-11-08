import { describe, expect, it } from "vitest";
import { buildTips } from "../lib/tips";
import type { Tx } from "../lib/analytics";

const t = (date: string, cents: number, merchant: string, category: string, kind: Tx["kind"] = "expense"): Tx =>
  ({ date, amount_cents: cents, merchant, description: merchant, category, kind });

describe("buildTips", () => {
  const txs: Tx[] = [];
  for (const mo of ["2026-09", "2026-10"]) {
    for (let d = 1; d <= 28; d += 3) txs.push(t(`${mo}-${String(d).padStart(2, "0")}`, -2500, "MCDONALDS 70", "Eating out & takeaways"));
    txs.push(t(`${mo}-05`, -5000, "SKYSUBSCRIBE", "Subscriptions & TV"), t(`${mo}-20`, -5050, "SKYSUBSCRIBE", "Subscriptions & TV"));
    txs.push(t(`${mo}-28`, -2000, "SAVINGS", "Savings", "savings"));
  }
  txs.push(t("2026-10-31", -100, "X", "Other"));
  it("flags takeaways and a doubled subscription, ranked by saving", () => {
    const tips = buildTips(txs, { today: "2026-11-01" });
    const ids = tips.map((x) => x.id);
    expect(ids).toContain("eating-out");
    expect(ids).toContain("double-SKYSUBSCRIBE");
    expect(tips[0].savingPerMonthCents).toBeGreaterThanOrEqual(tips[tips.length - 1].savingPerMonthCents);
  });
  it("works out a weekly amount for a goal and skips met goals", () => {
    const tips = buildTips(txs, { today: "2026-11-01", goals: [
      { name: "Holiday", target_cents: 300000, saved_cents: 0, deadline: "2027-05-01" },
      { name: "Done", target_cents: 1000, saved_cents: 1000, deadline: "2027-05-01" } ] });
    expect(tips.find((x) => x.id === "goal-Holiday")).toBeTruthy();
    expect(tips.find((x) => x.id === "goal-Done")).toBeUndefined();
  });
});
