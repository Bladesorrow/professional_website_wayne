"use client";
import { useMemo, useState } from "react";
import { calculateTax, grossFromNet } from "@/lib/tax/calculate";
import { wfpWeekly } from "@/lib/tax/wfp";
import { fmt0, fmt } from "@/lib/money";

const e = (n: number) => fmt(Math.round(n * 100));
const e0 = (n: number) => fmt0(Math.round(n * 100));

export default function TaxCalculator({ observedNetFourWeekly, observedWfpWeekly }: { observedNetFourWeekly: number | null; observedWfpWeekly: number | null }) {
  const suggested = useMemo(() => (observedNetFourWeekly ? grossFromNet(observedNetFourWeekly * 13, { homeCarerCredit: true }) : 45000), [observedNetFourWeekly]);
  const [gross, setGross] = useState(suggested);
  const [pension, setPension] = useState(0);
  const [carer, setCarer] = useState(true);
  const [children, setChildren] = useState(4);
  const [extra, setExtra] = useState(5000);

  const base = useMemo(() => calculateTax({ grossAnnual: gross, pensionPct: pension / 100, homeCarerCredit: carer }), [gross, pension, carer]);
  const wfp = wfpWeekly(base.netAnnual / 52, children);
  const more = useMemo(() => calculateTax({ grossAnnual: gross + extra, pensionPct: pension / 100, homeCarerCredit: carer }), [gross, extra, pension, carer]);
  const wfpMore = wfpWeekly(more.netAnnual / 52, children);
  const extraNet = more.netAnnual - base.netAnnual;
  const extraWfpLoss = (wfp - wfpMore) * 52;
  const kept = extra ? (extraNet - extraWfpLoss) : 0;

  const rows: [string, number][] = [
    ["Gross pay", base.gross], ["Pension", -base.pension], ["Income tax", -base.incomeTax], ["USC", -base.usc], ["PRSI", -base.prsi],
  ];

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 sm:grid-cols-4 items-end">
        <label className="text-sm">Gross pay per year (€)
          <input type="number" min={0} step={100} className="input mt-1" value={gross} onChange={(ev) => setGross(Number(ev.target.value) || 0)} />
        </label>
        <label className="text-sm">Pension (% of gross)
          <input type="number" min={0} max={40} step={0.5} className="input mt-1" value={pension} onChange={(ev) => setPension(Number(ev.target.value) || 0)} />
        </label>
        <label className="text-sm">Children
          <input type="number" min={0} max={12} className="input mt-1" value={children} onChange={(ev) => setChildren(Number(ev.target.value) || 0)} />
        </label>
        <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={carer} onChange={(ev) => setCarer(ev.target.checked)} /> Home carer credit</label>
        {observedNetFourWeekly && (
          <p className="sm:col-span-4 text-xs muted">
            Your bank shows about {fmt0(Math.round(observedNetFourWeekly * 100))} take-home every 4 weeks, which works out to roughly {e0(suggested)} gross (starting value above).
            Adjust it if you know your exact salary.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold mb-2">Pay breakdown</h2>
          <table className="t"><tbody>
            {rows.map(([k, v]) => <tr key={k}><td>{k}</td><td className={`text-right ${v < 0 ? "neg" : ""}`}>{e(v)}</td></tr>)}
            <tr className="font-semibold"><td>Take-home per year</td><td className="text-right">{e(base.netAnnual)}</td></tr>
            <tr><td>Per 4 weeks</td><td className="text-right">{e(base.netAnnual / 13)}</td></tr>
            <tr><td>Per month</td><td className="text-right">{e(base.netAnnual / 12)}</td></tr>
            <tr><td>Per week</td><td className="text-right">{e(base.netAnnual / 52)}</td></tr>
          </tbody></table>
          <p className="muted text-xs mt-2">Credits applied: {e0(base.credits)}. Effective tax rate {(base.effectiveRate * 100).toFixed(1)}%. Marginal rate {(base.marginalRate * 100).toFixed(0)}%.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">Working Family Payment</h2>
          <p className="text-3xl font-semibold">{e(wfp)}<span className="text-base muted"> / week</span></p>
          <p className="muted text-sm">About {e(wfp * 52)} a year, not taxed. Estimated from net pay of {e(base.netAnnual / 52)} a week against the limit for {children} children.</p>
          {observedWfpWeekly !== null && (
            <p className="text-sm mt-3">Your bank shows {fmt(Math.round(observedWfpWeekly * 100))} a week from Social Protection, which includes the €38 Fuel Allowance in season. The estimate is just the WFP part, so compare it against about {fmt(Math.round((observedWfpWeekly - 38) * 100))}.</p>
          )}
          <h3 className="font-semibold mt-4">Total yearly income (before Child Benefit)</h3>
          <p className="text-2xl font-semibold">{e(base.netAnnual + wfp * 52)}</p>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">What if I earn more?</h2>
        <label className="text-sm block">Extra gross pay per year (€)
          <input type="range" min={0} max={30000} step={500} value={extra} onChange={(ev) => setExtra(Number(ev.target.value))} className="w-full" />
          <span className="font-medium">{e0(extra)}</span>
        </label>
        <table className="t"><tbody>
          <tr><td>Extra take-home pay after tax, USC and PRSI</td><td className="text-right">{e(extraNet)}</td></tr>
          <tr><td>Working Family Payment lost</td><td className="text-right neg">{e(-extraWfpLoss)}</td></tr>
          <tr className="font-semibold"><td>What you actually keep</td><td className="text-right">{e(kept)}</td></tr>
          <tr><td>Kept per €100 of extra pay</td><td className="text-right">{extra ? e((kept / extra) * 100) : "-"}</td></tr>
        </tbody></table>
        <p className="muted text-xs">Working Family Payment falls as pay rises, so overtime or a raise can be worth much less than it looks. This uses estimates only.</p>
      </div>
    </div>
  );
}
