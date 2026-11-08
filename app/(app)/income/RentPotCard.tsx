"use client";
import { useMemo, useState } from "react";
import { rentPotPlan } from "@/lib/rentpot";
import { fmt, fmt0 } from "@/lib/money";

interface Props {
  lastPayDate: string | null;     // latest salary credit in the bank data
  defaultNextPay: string | null;  // second Thursday of the month after that
  weeklyRentCents: number;
  estimatedBalanceCents: number;  // money in to the pot minus money back, since the bank file starts
}

export default function RentPotCard({ lastPayDate, defaultNextPay, weeklyRentCents, estimatedBalanceCents }: Props) {
  const [payDate, setPayDate] = useState(lastPayDate ?? "");
  const [nextPay, setNextPay] = useState(defaultNextPay ?? "");
  const [balance, setBalance] = useState(String(Math.max(0, estimatedBalanceCents) / 100));
  const [rent, setRent] = useState(String(weeklyRentCents / 100));

  const plan = useMemo(() => {
    if (!payDate || !nextPay || nextPay <= payDate) return null;
    return rentPotPlan(payDate, nextPay, Math.round(Number(rent) * 100) || 0, Math.round(Number(balance) * 100) || 0);
  }, [payDate, nextPay, rent, balance]);

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="font-semibold">Rent pot (account 5770)</h2>
        <p className="muted text-sm">Move a pay period of rent across on pay day. The weekly rent then comes back to this account each Wednesday for the Thursday payment.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-sm">Last pay day<input type="date" className="input mt-1" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></label>
        <label className="text-sm">Next pay day<input type="date" className="input mt-1" value={nextPay} onChange={(e) => setNextPay(e.target.value)} /></label>
        <label className="text-sm">Weekly rent (€)<input type="number" min={0} step="0.01" className="input mt-1" value={rent} onChange={(e) => setRent(e.target.value)} /></label>
        <label className="text-sm">Left in the pot (€)<input type="number" min={0} step="0.01" className="input mt-1" value={balance} onChange={(e) => setBalance(e.target.value)} /></label>
      </div>
      {plan ? (
        <div>
          <p className="text-3xl font-semibold">{fmt(plan.moveCents)}<span className="text-base muted"> to move into 5770</span></p>
          <p className="muted text-sm">
            {plan.returns} weekly returns × {fmt0(Math.round(Number(rent) * 100) || 0)} = {fmt(plan.neededCents)}, less {fmt(Math.round(Number(balance) * 100) || 0)} already there.
            {plan.moveCents === 0 && " The pot already covers it."}
          </p>
        </div>
      ) : (
        <p className="muted text-sm">Enter a last pay day and a later next pay day to see the amount.</p>
      )}
      <p className="muted text-xs">Next pay day starts as the second Thursday after your latest salary. Change it if pay lands on a different date. The pot balance is estimated from your transfers, assuming it was empty when the bank file starts.</p>
    </div>
  );
}
