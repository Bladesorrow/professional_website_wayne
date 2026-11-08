import Link from "next/link";
import { getContext } from "@/lib/context";
import { loadTransactions } from "@/lib/data";
import { availableMonths, byCategory, detectRecurring, fullMonths, monthTotals, topMerchants, weeklySpend, monthOf } from "@/lib/analytics";
import { fmt, fmt0 } from "@/lib/money";
import { buildTips } from "@/lib/tips";
import { CategoryPie, COLORS, MonthlyBars, WeeklyBars } from "@/components/Charts";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const { supabase, householdId } = await getContext();
  const [txs, { data: goals }, { data: cats }] = await Promise.all([
    loadTransactions(supabase, householdId),
    supabase.from("savings_goals").select("*").eq("household_id", householdId).order("created_at"),
    supabase.from("categories").select("name,monthly_budget_cents").eq("household_id", householdId),
  ]);

  if (!txs.length) {
    return (
      <div className="card space-y-2">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="muted">No transactions yet. Import your PTSB statement to see where the money goes.</p>
        <Link href="/import" className="btn inline-block">Import transactions</Link>
      </div>
    );
  }

  const months = availableMonths(txs);
  const month = m && months.includes(m) ? m : months[0];
  const totals = monthTotals(txs, month);
  const full = fullMonths(txs);
  const prevFull = full.filter((x) => x < month);
  const avgSpend = prevFull.length ? Math.round(prevFull.reduce((a, x) => a + monthTotals(txs, x).spend, 0) / prevFull.length) : null;
  const cat = byCategory(txs, month);
  const merchants = topMerchants(txs, month, 8);
  const weekly = weeklySpend(txs);
  const recurring = detectRecurring(txs).slice(0, 8);
  const tips = buildTips(txs, { goals: goals ?? [] }).slice(0, 3);
  const budgets = new Map((cats ?? []).filter((c) => c.monthly_budget_cents).map((c) => [c.name as string, Number(c.monthly_budget_cents)]));
  const partial = !full.includes(month);
  const monthly = [...months].reverse().map((x) => ({ label: x, ...monthTotals(txs, x) }));
  const days = (mo: string) => new Set(txs.filter((t) => monthOf(t.date) === mo).map((t) => t.date)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2 ml-auto text-sm">
          {months.slice(0, 6).map((x) => (
            <Link key={x} href={`/?m=${x}`} className={`btn-ghost ${x === month ? "font-semibold" : ""}`}>{x}</Link>
          ))}
        </div>
      </div>
      {partial && <p className="card text-sm muted">{month} is only partly covered by your imported data ({days(month)} days with transactions), so totals will look low.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Spending" value={fmt0(totals.spend)} sub={avgSpend !== null ? `Avg full month: ${fmt0(avgSpend)}` : undefined} />
        <Stat label="Income into bank" value={fmt0(totals.income)} sub="Salary and social welfare" />
        <Stat label="Left over" value={fmt0(totals.net)} tone={totals.net >= 0 ? "pos" : "neg"} sub="Income minus spending" />
        <Stat label="Moved to savings" value={fmt0(totals.saved)} sub="Weekly SAVINGS transfers" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold mb-2">Spending by category</h2>
          <CategoryPie data={cat.map((c) => ({ name: c.name, value: c.cents / 100 }))} />
          <table className="t mt-2"><tbody>
            {cat.map((c, i) => {
              const b = budgets.get(c.name);
              return (
                <tr key={c.name}>
                  <td><span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: COLORS[i % COLORS.length] }} />{c.name}</td>
                  <td className="text-right">{fmt(c.cents)}</td>
                  <td className={`text-right ${b && c.cents > b ? "neg" : "muted"}`}>{b ? `of ${fmt0(b)}` : ""}</td>
                </tr>
              );
            })}
          </tbody></table>
        </div>
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold mb-2">Spending per full week</h2>
            <WeeklyBars data={weekly.map((w) => ({ label: w.week.slice(5), value: w.cents / 100 }))} />
          </div>
          <div className="card">
            <h2 className="font-semibold mb-2">Income vs spending by month</h2>
            <MonthlyBars data={monthly.map((x) => ({ label: x.label, spend: x.spend / 100, income: x.income / 100 }))} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold mb-2">Top places you spent in {month}</h2>
          <table className="t"><tbody>
            {merchants.map((x) => <tr key={x.name}><td>{x.name}</td><td className="muted">{x.count}×</td><td className="text-right">{fmt(x.cents)}</td></tr>)}
          </tbody></table>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">Regular payments</h2>
          <table className="t"><tbody>
            {recurring.map((r) => <tr key={r.merchant}><td>{r.merchant}</td><td className="muted">{r.frequency}</td><td className="text-right">{fmt(r.typicalCents)}</td><td className="text-right muted">{fmt0(r.perMonthCents)}/mo</td></tr>)}
            {!recurring.length && <tr><td className="muted">None detected yet</td></tr>}
          </tbody></table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center"><h2 className="font-semibold">Ways to save</h2><Link href="/tips" className="ml-auto text-sm underline">All tips</Link></div>
          <ul className="mt-2 space-y-3">
            {tips.map((t) => (
              <li key={t.id}><p className="font-medium">{t.title}{t.savingPerMonthCents > 0 && <span className="pos ml-2 text-sm">~{fmt0(t.savingPerMonthCents)}/mo</span>}</p><p className="muted text-sm">{t.detail}</p></li>
            ))}
            {!tips.length && <li className="muted">Import more data to get tips.</li>}
          </ul>
        </div>
        <div className="card">
          <div className="flex items-center"><h2 className="font-semibold">Savings goals</h2><Link href="/goals" className="ml-auto text-sm underline">Manage</Link></div>
          <ul className="mt-2 space-y-3">
            {(goals ?? []).map((g) => {
              const pct = Math.min(100, Math.round((Number(g.saved_cents) / Number(g.target_cents)) * 100));
              return (
                <li key={g.id}>
                  <div className="flex justify-between text-sm"><span>{g.name}</span><span className="muted">{fmt0(Number(g.saved_cents))} of {fmt0(Number(g.target_cents))}</span></div>
                  <div className="h-2 rounded bg-black/10 mt-1"><div className="h-2 rounded" style={{ width: `${pct}%`, background: "var(--accent)" }} /></div>
                </li>
              );
            })}
            {!(goals ?? []).length && <li className="muted">No goals yet. Start a holiday fund.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "pos" | "neg" }) {
  return (
    <div className="card">
      <p className="muted text-sm">{label}</p>
      <p className={`text-2xl font-semibold ${tone ?? ""}`}>{value}</p>
      {sub && <p className="muted text-xs mt-1">{sub}</p>}
    </div>
  );
}
