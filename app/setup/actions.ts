"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_RULES } from "@/lib/categorise";

export async function createHousehold(formData: FormData) {
  const name = String(formData.get("name") || "").trim() || "Our family";
  const supabase = await createClient();
  const { data: hid, error } = await supabase.rpc("create_household", { household_name: name });
  if (error || !hid) throw new Error(error?.message ?? "Could not create household");

  await supabase.from("accounts").insert({ household_id: hid, name: "PTSB Current", institution: "Permanent TSB", kind: "current" });

  // Income streams from the plan. Amounts are Wayne's to confirm in the Income page.
  await supabase.from("income_sources").insert([
    { household_id: hid, name: "Salary (Grafton Digital)", amount_cents: 0, frequency: "four_weekly", taxable: true },
    { household_id: hid, name: "Working Family Payment", amount_cents: 0, frequency: "weekly", taxable: false },
    { household_id: hid, name: "Fuel Allowance", amount_cents: 3800, frequency: "weekly", taxable: false,
      season_start_month: 9, season_end_month: 4 },
  ]);

  // Seed merchant rules into the household so they can be edited later.
  const { data: cats } = await supabase.from("categories").select("id,name").eq("household_id", hid);
  const byName = new Map((cats ?? []).map((c) => [c.name, c.id]));
  const rules = DEFAULT_RULES.filter((r) => byName.has(r.category))
    .map((r) => ({ household_id: hid, pattern: r.pattern, category_id: byName.get(r.category)! }));
  if (rules.length) await supabase.from("merchant_rules").upsert(rules, { onConflict: "household_id,pattern" });

  redirect("/");
}
