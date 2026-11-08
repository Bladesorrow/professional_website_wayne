import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Signed-in user plus their household. Redirects to /login or /setup when missing. */
export async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id, households(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!member) redirect("/setup");
  return { supabase, user, householdId: member.household_id as string };
}
