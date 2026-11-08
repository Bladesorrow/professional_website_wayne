"use server";
import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/context";

export async function setCategory(formData: FormData) {
  const id = String(formData.get("id"));
  const categoryId = String(formData.get("category_id") || "");
  const applyAll = formData.get("all") === "on";
  const { supabase, householdId } = await getContext();
  const catId = categoryId || null;

  const { data: tx } = await supabase.from("transactions").select("merchant").eq("id", id).eq("household_id", householdId).single();
  if (!tx) return;
  await supabase.from("transactions").update({ category_id: catId }).eq("id", id).eq("household_id", householdId);

  if (applyAll && tx.merchant && catId) {
    await supabase.from("transactions").update({ category_id: catId }).eq("household_id", householdId).eq("merchant", tx.merchant);
    await supabase.from("merchant_rules").upsert(
      { household_id: householdId, pattern: tx.merchant.toUpperCase(), category_id: catId },
      { onConflict: "household_id,pattern" },
    );
  }
  revalidatePath("/", "layout");
}
