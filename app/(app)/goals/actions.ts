"use server";
import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/context";
import { toCentsFromInput } from "@/lib/money";

export async function addGoal(fd: FormData) {
  const { supabase, householdId } = await getContext();
  const target = toCentsFromInput(String(fd.get("target")));
  if (!(target > 0)) return;
  await supabase.from("savings_goals").insert({
    household_id: householdId, name: String(fd.get("name") || "Goal").slice(0, 100), target_cents: target,
    saved_cents: toCentsFromInput(String(fd.get("saved") || 0)) || 0, deadline: String(fd.get("deadline") || "") || null,
  });
  revalidatePath("/", "layout");
}

export async function updateSaved(fd: FormData) {
  const { supabase, householdId } = await getContext();
  await supabase.from("savings_goals").update({ saved_cents: toCentsFromInput(String(fd.get("saved") || 0)) || 0 })
    .eq("id", String(fd.get("id"))).eq("household_id", householdId);
  revalidatePath("/", "layout");
}

export async function deleteGoal(fd: FormData) {
  const { supabase, householdId } = await getContext();
  await supabase.from("savings_goals").delete().eq("id", String(fd.get("id"))).eq("household_id", householdId);
  revalidatePath("/", "layout");
}
