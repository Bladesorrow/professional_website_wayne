"use server";
import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/context";
import { categorise } from "@/lib/categorise";
import type { PtsbTransaction } from "@/lib/import/ptsb";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function importTransactions(rows: PtsbTransaction[]) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 20000) throw new Error("Nothing to import");
  for (const r of rows) {
    if (!ISO.test(r.date) || !Number.isInteger(r.amountCents) || !Number.isInteger(r.balanceCents) || typeof r.dedupeKey !== "string")
      throw new Error("Invalid row in file");
  }
  const { supabase, householdId } = await getContext();

  const { data: account } = await supabase.from("accounts").select("id").eq("household_id", householdId).order("created_at").limit(1).single();
  if (!account) throw new Error("No account found");

  const [{ data: cats }, { data: rules }] = await Promise.all([
    supabase.from("categories").select("id,name").eq("household_id", householdId),
    supabase.from("merchant_rules").select("pattern,category_id").eq("household_id", householdId),
  ]);
  const idByName = new Map((cats ?? []).map((c) => [c.name, c.id as string]));
  const nameById = new Map((cats ?? []).map((c) => [c.id as string, c.name as string]));
  const userRules = (rules ?? []).map((r) => ({ pattern: r.pattern as string, category: nameById.get(r.category_id as string) ?? "Other" }));

  const records = rows.map((r) => {
    const cat = categorise({ merchant: r.merchant, type: r.type, amountCents: r.amountCents }, userRules);
    return {
      household_id: householdId,
      account_id: account.id,
      category_id: cat ? idByName.get(cat) ?? null : null,
      date: r.date,
      description: r.description.slice(0, 300),
      merchant: r.merchant.slice(0, 200),
      payment_type: r.type,
      amount_cents: r.amountCents,
      balance_cents: r.balanceCents,
      source: "csv" as const,
      dedupe_key: r.dedupeKey.slice(0, 500),
    };
  });

  let inserted = 0;
  for (let i = 0; i < records.length; i += 200) {
    const { data, error } = await supabase
      .from("transactions")
      .upsert(records.slice(i, i + 200), { onConflict: "account_id,dedupe_key", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    inserted += data?.length ?? 0;
  }
  revalidatePath("/", "layout");
  return { inserted, skipped: records.length - inserted };
}
