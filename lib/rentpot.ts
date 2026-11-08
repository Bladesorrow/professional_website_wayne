// Rent pot (account 5770): on pay day, move across enough to cover the weekly rent until the next pay day.
// Rent is taken from the main account on Thursdays, and the €140 comes back from the pot on the Wednesday before.
import { addDays } from "@/lib/analytics";

const WEDNESDAY = 3;

const weekday = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay(); // 0 = Sunday

/** The second Thursday of a month, as an ISO date. `month` is 1 to 12. */
export function secondThursday(year: number, month: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const toThursday = (4 - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month - 1, 1 + toThursday + 7)).toISOString().slice(0, 10);
}

/** Default next pay day: the second Thursday of the month after the latest salary credit. */
export function nextPayDate(lastSalaryDate: string): string {
  const [y, m] = lastSalaryDate.split("-").map(Number);
  return m === 12 ? secondThursday(y + 1, 1) : secondThursday(y, m + 1);
}

/** Weekly returns from the pot needed after `payDate` and before `nextPay` (Wednesdays strictly in between). */
export function returnsNeeded(payDate: string, nextPay: string): number {
  let count = 0;
  for (let d = addDays(payDate, 1); d < nextPay; d = addDays(d, 1)) if (weekday(d) === WEDNESDAY) count++;
  return count;
}

export interface RentPotPlan { returns: number; neededCents: number; moveCents: number }

/** How much to move into the pot: weekly rent for each return, less what is already left in the pot. */
export function rentPotPlan(payDate: string, nextPay: string, weeklyRentCents: number, balanceCents: number): RentPotPlan {
  const returns = returnsNeeded(payDate, nextPay);
  const neededCents = returns * weeklyRentCents;
  return { returns, neededCents, moveCents: Math.max(0, neededCents - balanceCents) };
}
