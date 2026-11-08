"use server";
import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/context";
import { toCentsFromInput } from "@/lib/money";

export async function updateIncomeSource(fd: FormData) {
  const { supabase, householdId } = await getContext();
  const cents = toCentsFromInput(String(fd.get("amount") || 0));
  if (!Number.isFinite(cents) || cents < 0) return;
  await supabase.from("income_sources").update({ amount_cents: cents, active: fd.get("active") === "on" })
    .eq("id", String(fd.get("id"))).eq("household_id", householdId);
  revalidatePath("/", "layout");
}
