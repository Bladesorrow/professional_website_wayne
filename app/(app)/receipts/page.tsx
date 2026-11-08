import { getContext } from "@/lib/context";
import { fmt } from "@/lib/money";
import type { ExtractedReceipt } from "@/lib/receipts/parse";
import UploadReceipt from "./UploadReceipt";
import { confirmReceipt, rejectReceipt } from "./actions";

export default async function ReceiptsPage() {
  const { supabase, householdId } = await getContext();
  const [{ data: receipts }, { data: cats }] = await Promise.all([
    supabase.from("receipts").select("id,status,extracted,created_at").eq("household_id", householdId).order("created_at", { ascending: false }).limit(30),
    supabase.from("categories").select("id,name").eq("household_id", householdId).eq("kind", "expense").order("name"),
  ]);
  const pending = (receipts ?? []).filter((r) => r.status === "pending");
  const done = (receipts ?? []).filter((r) => r.status !== "pending");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Receipts</h1>
      <UploadReceipt householdId={householdId} />
      {pending.map((r) => {
        const x = r.extracted as ExtractedReceipt | null;
        const suggested = (cats ?? []).find((c) => c.name === x?.suggestedCategory)?.id ?? "";
        return (
          <form key={r.id} action={confirmReceipt} className="card grid gap-3 sm:grid-cols-4 items-end">
            <input type="hidden" name="id" value={r.id} />
            {!x && <p className="sm:col-span-4 text-sm muted">Not read yet. Enter the details by hand, or check that receipt reading is set up.</p>}
            <label className="text-sm">Shop<input name="merchant" className="input mt-1" defaultValue={x?.merchant ?? ""} /></label>
            <label className="text-sm">Date<input name="date" type="date" className="input mt-1" defaultValue={x?.date ?? ""} required /></label>
            <label className="text-sm">Total (€)<input name="total" type="number" step="0.01" min="0.01" className="input mt-1" defaultValue={x?.totalCents ? x.totalCents / 100 : ""} required /></label>
            <label className="text-sm">Category
              <select name="category_id" className="input mt-1" defaultValue={suggested}>
                <option value="">Keep existing / none</option>
                {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            {x && x.items.length > 0 && (
              <details className="sm:col-span-4 text-sm"><summary className="cursor-pointer muted">{x.items.length} line items{x.vatCents ? ` · VAT ${fmt(x.vatCents)}` : ""}</summary>
                <ul className="mt-1">{x.items.map((i, n) => <li key={n} className="flex justify-between"><span>{i.name}</span><span>{fmt(i.cents)}</span></li>)}</ul></details>
            )}
            <div className="sm:col-span-4 flex gap-2">
              <button className="btn">Confirm</button>
              <button formAction={rejectReceipt} formNoValidate className="btn-ghost">Discard</button>
            </div>
          </form>
        );
      })}
      {done.length > 0 && <p className="muted text-sm">{done.filter((d) => d.status === "confirmed").length} confirmed, {done.filter((d) => d.status === "rejected").length} discarded.</p>}
      <p className="muted text-xs">If a matching card payment is already in your bank import (same amount within a week), the receipt is attached to it, so nothing is counted twice.</p>
    </div>
  );
}
