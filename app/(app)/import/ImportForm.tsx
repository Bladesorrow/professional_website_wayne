"use client";
import { useState } from "react";
import Link from "next/link";
import { decodePtsb, parsePtsb, type PtsbTransaction } from "@/lib/import/ptsb";
import { fmt } from "@/lib/money";
import { importTransactions } from "./actions";

export default function ImportForm() {
  const [rows, setRows] = useState<PtsbTransaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | undefined) {
    setError(null); setResult(null); setRows(null);
    if (!f) return;
    try {
      const parsed = parsePtsb(decodePtsb(new Uint8Array(await f.arrayBuffer())));
      if (!parsed.length) throw new Error("No transactions found in that file.");
      setRows(parsed);
    } catch (e) { setError((e as Error).message); }
  }

  async function run() {
    if (!rows) return;
    setBusy(true); setError(null);
    try { setResult(await importTransactions(rows)); setRows(null); }
    catch (e) { setError((e as Error).message); }
    setBusy(false);
  }

  const stats = rows && {
    from: rows.reduce((a, r) => (r.date < a ? r.date : a), rows[0].date),
    to: rows.reduce((a, r) => (r.date > a ? r.date : a), rows[0].date),
    inn: rows.filter((r) => r.amountCents > 0).reduce((a, r) => a + r.amountCents, 0),
    out: rows.filter((r) => r.amountCents < 0).reduce((a, r) => a + r.amountCents, 0),
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="font-semibold">Upload a PTSB transaction list</h2>
        <p className="muted text-sm">In PTSB online banking, download your transactions as CSV. Uploading the same period twice is safe: duplicates are skipped.</p>
        <input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; onFile(f); }} />
      </div>
      {error && <p className="card text-sm text-red-700">{error}</p>}
      {rows && stats && (
        <div className="card space-y-3">
          <p><b>{rows.length}</b> transactions from {stats.from} to {stats.to}</p>
          <p className="muted text-sm">Money in {fmt(stats.inn)} · Money out {fmt(-stats.out)}</p>
          <button className="btn" onClick={run} disabled={busy}>{busy ? "Importing…" : "Import"}</button>
        </div>
      )}
      {result && (
        <div className="card">
          <p><b>{result.inserted}</b> imported, {result.skipped} skipped as duplicates.</p>
          <Link className="underline text-sm" href="/">View dashboard</Link>
        </div>
      )}
    </div>
  );
}
