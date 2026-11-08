import { getContext } from "@/lib/context";
import { loadTransactions } from "@/lib/data";
import { fmt } from "@/lib/money";
import { TAX_YEARS, CURRENT_TAX_YEAR } from "@/lib/tax/config";
import TaxCalculator from "./TaxCalculator";
import { updateIncomeSource } from "./actions";

const FREQ: Record<string, string> = { weekly: "per week", four_weekly: "per 4 weeks", monthly: "per month", yearly: "per year" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function IncomePage() {
  const { supabase, householdId } = await getContext();
  const [txs, { data: sources }] = await Promise.all([
    loadTransactions(supabase, householdId),
    supabase.from("income_sources").select("*").eq("household_id", householdId).order("created_at"),
  ]);
  const cfg = TAX_YEARS[CURRENT_TAX_YEAR];

  const salary = txs.filter((t) => /GRAFTON/i.test(t.merchant ?? t.description) && t.amount_cents > 0).slice(0, 3);
  const observedNet = salary.length ? salary.reduce((a, t) => a + t.amount_cents, 0) / salary.length / 100 : null;
  const dsp = txs.find((t) => /DEPT OF SOCIAL/i.test(t.merchant ?? t.description) && t.amount_cents > 0);
  const suggestions: Record<string, number | undefined> = {
    "Salary (Grafton Digital)": salary[0]?.amount_cents,
    "Working Family Payment": dsp ? dsp.amount_cents - 3800 : undefined,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Income &amp; tax</h1>
      {!cfg.verified && (
        <div className="card border-amber-500 text-sm space-y-1">
          <p className="font-semibold">Tax figures checked on {cfg.verifiedOn}, with two gaps</p>
          <p className="muted">Checked against official pages: {cfg.verifiedItems.join("; ")}.</p>
          <p className="muted">Not yet confirmed: {cfg.unverifiedItems.join(" and ")}. PRSI is estimated as {cfg.prsiNote}. Results are estimates, not tax advice. Compare with your Revenue Tax Credit Certificate.</p>
        </div>
      )}
      {cfg.verified && (
        <p className="muted text-xs">Rates, credits, USC, PRSI and Working Family Payment figures for {cfg.year} were checked against Revenue.ie, gov.ie and Citizens Information on {cfg.verifiedOn}. PRSI is blended over the year ({cfg.prsiNote}). Results are estimates, not tax advice.</p>
      )}

      <div className="card">
        <h2 className="font-semibold mb-1">Income streams</h2>
        <p className="muted text-sm mb-3">Take-home amounts, not gross. Child Benefit is excluded for now.</p>
        <div className="space-y-2">
          {(sources ?? []).map((s) => {
            const season = s.season_start_month ? ` · ${MONTHS[s.season_start_month - 1]} to ${MONTHS[s.season_end_month - 1]}` : "";
            const suggested = suggestions[s.name as string];
            return (
              <form key={s.id} action={updateIncomeSource} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={s.id} />
                <span className="w-56 text-sm">{s.name}<span className="muted block text-xs">{FREQ[s.frequency as string]}{season}{s.taxable ? " · taxable" : " · tax free"}</span></span>
                <input name="amount" type="number" step="0.01" min="0" className="input !w-32" defaultValue={Number(s.amount_cents) ? Number(s.amount_cents) / 100 : suggested ? suggested / 100 : ""} />
                <label className="text-xs muted"><input type="checkbox" name="active" defaultChecked={s.active} /> active</label>
                <button className="btn-ghost text-sm">Save</button>
                {!Number(s.amount_cents) && suggested ? <span className="text-xs muted">Suggested from bank: {fmt(suggested)}</span> : null}
              </form>
            );
          })}
        </div>
      </div>

      <TaxCalculator observedNetFourWeekly={observedNet} observedWfpWeekly={dsp ? dsp.amount_cents / 100 : null} />
    </div>
  );
}
