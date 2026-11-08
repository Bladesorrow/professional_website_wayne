import type { SupabaseClient } from "@supabase/supabase-js";
import type { Kind, Tx } from "@/lib/analytics";

interface Row {
  id: string; date: string; amount_cents: number; merchant: string | null; description: string; category_id: string | null;
  categories: { name: string; kind: Kind } | null;
}

export interface TxRow extends Tx { id: string; category_id: string | null }

/** Loads all of a household's transactions (paged past the 1000-row API default). */
export async function loadTransactions(supabase: SupabaseClient, householdId: string): Promise<TxRow[]> {
  const out: TxRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,date,amount_cents,merchant,description,category_id,categories(name,kind)")
      .eq("household_id", householdId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: true })
      .range(from, from + 999)
      .returns<Row[]>();
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      out.push({
        id: r.id, date: r.date, amount_cents: Number(r.amount_cents), merchant: r.merchant, description: r.description,
        category_id: r.category_id, category: r.categories?.name ?? null, kind: r.categories?.kind ?? null,
      });
    }
    if (!data || data.length < 1000) break;
  }
  return out;
}
