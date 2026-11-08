"use server";
import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/context";
import { addDays } from "@/lib/analytics";

export async function confirmReceipt(fd: FormData) {
  const { supabase, householdId } = await getContext();
  const id = String(fd.get("id"));
  const merchant = String(fd.get("merchant") || "").trim().slice(0, 120) || "Receipt";
  const date = String(fd.get("date") || "");
  const total = Math.round(Number(fd.get("total")) * 100);
  const categoryId = String(fd.get("category_id") || "") || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(total > 0)) return;

  const { data: receipt } = await supabase.from("receipts").select("id,status").eq("id", id).eq("household_id", householdId).single();
  if (!receipt || receipt.status !== "pending") return;

  // If the card payment is already in the bank import, attach the receipt to it rather than counting it twice.
  const { data: candidates } = await supabase.from("transactions").select("id,category_id")
    .eq("household_id", householdId).eq("amount_cents", -total).is("receipt_id", null)
    .gte("date", addDays(date, -7)).lte("date", addDays(date, 7)).limit(1);
  const match = candidates?.[0];

  if (match) {
    await supabase.from("transactions").update({ receipt_id: id, category_id: categoryId ?? match.category_id }).eq("id", match.id);
  } else {
    const { data: account } = await supabase.from("accounts").select("id").eq("household_id", householdId).order("created_at").limit(1).single();
    if (!account) return;
    await supabase.from("transactions").insert({
      household_id: householdId, account_id: account.id, category_id: categoryId, receipt_id: id, date,
      description: `Receipt: ${merchant}`, merchant, payment_type: "receipt", amount_cents: -total, source: "receipt",
    });
  }
  await supabase.from("receipts").update({ status: "confirmed" }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function rejectReceipt(fd: FormData) {
  const { supabase, householdId } = await getContext();
  await supabase.from("receipts").update({ status: "rejected" }).eq("id", String(fd.get("id"))).eq("household_id", householdId);
  revalidatePath("/receipts");
}
