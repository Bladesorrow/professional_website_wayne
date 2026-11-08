import { getContext } from "@/lib/context";
import { loadTransactions } from "@/lib/data";
import { buildTips } from "@/lib/tips";
import { fmt0 } from "@/lib/money";

export default async function TipsPage() {
  const { supabase, householdId } = await getContext();
  const [txs, { data: goals }] = await Promise.all([
    loadTransactions(supabase, householdId),
    supabase.from("savings_goals").select("*").eq("household_id", householdId),
  ]);
  const tips = buildTips(txs, { goals: goals ?? [] });
  const total = tips.reduce((a, t) => a + t.savingPerMonthCents, 0);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ways to save</h1>
      <p className="muted">Based on your imported transactions. Savings are estimates of what is realistic, not guarantees.</p>
      {total > 0 && <div className="card"><p className="text-sm muted">If you acted on all of these</p><p className="text-3xl font-semibold pos">~{fmt0(total)} a month</p><p className="muted text-sm">about {fmt0(total * 12)} a year towards the holiday fund</p></div>}
      <div className="space-y-3">
        {tips.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start gap-3"><h2 className="font-semibold">{t.title}</h2>{t.savingPerMonthCents > 0 && <span className="pos ml-auto whitespace-nowrap">~{fmt0(t.savingPerMonthCents)}/mo</span>}</div>
            <p className="muted mt-1">{t.detail}</p>
          </div>
        ))}
        {!tips.length && <p className="card muted">Import your bank transactions to get tips.</p>}
      </div>
    </div>
  );
}
