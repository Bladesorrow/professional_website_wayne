import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createHousehold } from "./actions";

export default async function SetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: member } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (member) redirect("/");
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form action={createHousehold} className="w-full max-w-sm card space-y-4">
        <h1 className="text-2xl font-semibold">Set up your household</h1>
        <p className="muted">This creates your categories, a PTSB account and your income streams.</p>
        <label className="block text-sm">Household name
          <input name="name" className="input mt-1" defaultValue="The Wrafter family" />
        </label>
        <button className="btn w-full">Create household</button>
      </form>
    </main>
  );
}
