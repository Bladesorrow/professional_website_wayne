import { describe, expect, it } from "vitest";
import { nextPayDate, rentPotPlan, returnsNeeded, secondThursday } from "../lib/rentpot";

describe("rent pot", () => {
  it("finds the second Thursday of a month", () => {
    expect(secondThursday(2026, 9)).toBe("2026-09-10");
    expect(secondThursday(2026, 10)).toBe("2026-10-08");
    expect(secondThursday(2026, 11)).toBe("2026-11-12");
    expect(secondThursday(2026, 12)).toBe("2026-12-10");
    expect(secondThursday(2027, 1)).toBe("2027-01-14");
  });
  it("picks the next pay day from the latest salary, even when it landed early", () => {
    expect(nextPayDate("2026-10-08")).toBe("2026-11-12");
    expect(nextPayDate("2026-11-05")).toBe("2026-12-10");
    expect(nextPayDate("2026-12-10")).toBe("2027-01-14");
  });
  it("reproduces the transfers Wayne actually made", () => {
    expect(returnsNeeded("2026-09-10", "2026-10-08") * 14000).toBe(56000); // 10 Sep transfer
    expect(returnsNeeded("2026-10-08", "2026-11-12") * 14000).toBe(70000); // 9 Oct transfer
  });
  it("subtracts what is already in the pot and never goes below zero", () => {
    expect(rentPotPlan("2026-11-05", "2026-12-10", 14000, 14000)).toEqual({ returns: 5, neededCents: 70000, moveCents: 56000 });
    expect(rentPotPlan("2026-11-05", "2026-12-10", 14000, 90000).moveCents).toBe(0);
  });
});
