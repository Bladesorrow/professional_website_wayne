import Link from "next/link";
import { getContext } from "@/lib/context";
import { loadTransactions } from "@/lib/data";
import { fmt } from "@/lib/money";
import { setCategory } from "./actions";

const PAGE = 100;

export default async function Transactions({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; p?: string }> }) {
  const { q = "", cat = "", p = "1" } = await searchParams;
  const { supabase, householdId } = await getContext();
  const [txs, { data: cats }] = await Promise.all([
    loadTransactions(supabase, householdId),
    supabase.from("categories").select("id,name").eq("household_id", householdId).order("name"),
  ]);

  const needle = q.trim().toLowerCase();
  const filtered = txs.filter((t) =>
    (!needle || `${t.merchant ?? ""} ${t.description}`.toLowerCase().includes(needle)) &&
    (!cat || (cat === "none" ? !t.category_id : t.category_id === cat)));
  const page = Math.max(1, Number(p) || 1);
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const qs = (n: number) => `?${new URLSearchParams({ q, cat, p: String(n) })}`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <form className="card flex flex-wrap gap-2 items-end">
        <label className="text-sm">Search<input name="q" defaultValue={q} className="input mt-1" placeholder="Tesco, Energia…" /></label>
        <label className="text-sm">Category
          <select name="cat" defaultValue={cat} className="input mt-1">
            <option value="">All</option><option value="none">Uncategorised</option>
            {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button className="btn">Filter</button>
        <span className="muted text-sm ml-auto">{filtered.length} transactions</span>
      </form>
      <div className="card overflow-x-auto">
        <table className="t">
          <thead><tr><th>Date</th><th>Description</th><th className="text-right">Amount</th><th>Category</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap">{t.date}</td>
                <td>{t.merchant ?? t.description}</td>
                <td className={`text-right whitespace-nowrap ${t.amount_cents < 0 ? "neg" : "pos"}`}>{fmt(t.amount_cents)}</td>
                <td>
                  <form action={setCategory} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <select name="category_id" defaultValue={t.category_id ?? ""} className="input !py-1 !w-auto">
                      <option value="">Uncategorised</option>
                      {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <label className="text-xs muted whitespace-nowrap"><input type="checkbox" name="all" /> all from this shop</label>
                    <button className="btn-ghost text-xs">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 text-sm">
        {page > 1 && <Link className="underline" href={qs(page - 1)}>Previous</Link>}
        <span className="muted">Page {page} of {pages}</span>
        {page < pages && <Link className="underline" href={qs(page + 1)}>Next</Link>}
      </div>
    </div>
  );
}
