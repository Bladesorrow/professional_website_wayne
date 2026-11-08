import { getContext } from "@/lib/context";
import { fmt0 } from "@/lib/money";
import { addGoal, deleteGoal, updateSaved } from "./actions";

export default async function GoalsPage() {
  const { supabase, householdId } = await getContext();
  const { data: goals } = await supabase.from("savings_goals").select("*").eq("household_id", householdId).order("created_at");
  const today = Date.now();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Savings goals</h1>
      <form action={addGoal} className="card grid gap-3 sm:grid-cols-5 items-end">
        <label className="text-sm sm:col-span-2">Goal<input name="name" className="input mt-1" placeholder="Family holiday 2027" required /></label>
        <label className="text-sm">Target (€)<input name="target" type="number" step="0.01" min="1" className="input mt-1" required /></label>
        <label className="text-sm">Saved so far (€)<input name="saved" type="number" step="0.01" min="0" className="input mt-1" defaultValue="0" /></label>
        <label className="text-sm">Deadline<input name="deadline" type="date" className="input mt-1" /></label>
        <button className="btn sm:col-span-5 sm:w-fit">Add goal</button>
      </form>
      <div className="space-y-3">
        {(goals ?? []).map((g) => {
          const target = Number(g.target_cents), saved = Number(g.saved_cents);
          const pct = Math.min(100, Math.round((saved / target) * 100));
          const weeks = g.deadline ? Math.max(1, Math.round((Date.parse(g.deadline) - today) / (7 * 86400000))) : null;
          return (
            <div key={g.id} className="card space-y-2">
              <div className="flex gap-3 items-baseline"><h2 className="font-semibold">{g.name}</h2><span className="muted text-sm ml-auto">{fmt0(saved)} of {fmt0(target)} ({pct}%)</span></div>
              <div className="h-2 rounded bg-black/10"><div className="h-2 rounded" style={{ width: `${pct}%`, background: "var(--accent)" }} /></div>
              {weeks && saved < target && <p className="text-sm muted">{g.deadline}: about <b>{fmt0(Math.round((target - saved) / weeks))}</b> a week for {weeks} weeks.</p>}
              <div className="flex gap-2 flex-wrap">
                <form action={updateSaved} className="flex gap-2 items-center"><input type="hidden" name="id" value={g.id} />
                  <input name="saved" type="number" step="0.01" min="0" defaultValue={saved / 100} className="input !w-32" /><button className="btn-ghost text-sm">Update saved</button></form>
                <form action={deleteGoal}><input type="hidden" name="id" value={g.id} /><button className="btn-ghost text-sm">Delete</button></form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
