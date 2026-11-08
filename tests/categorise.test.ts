import { describe, expect, it } from "vitest";
import { categorise } from "../lib/categorise";

const tx = (merchant: string, type: string | null = "card", amountCents = -1000) => ({ merchant, type, amountCents });

describe("categorise", () => {
  it("matches common Irish merchants", () => {
    expect(categorise(tx("TESCO STORES"))).toBe("Groceries");
    expect(categorise(tx("Energia", "direct_debit"))).toBe("Energy & utilities");
    expect(categorise(tx("GALWAY CO CO", "direct_debit"))).toBe("Rent");
    expect(categorise(tx("DEPT OF SOCIAL PRO", "credit_transfer", 19800))).toBe("Social welfare");
  });
  it("handles the hotel and the funding transfers", () => {
    expect(categorise(tx("THE HENDRICK"))).toBe("Holidays");
    expect(categorise(tx("Fr 5770", "transfer_in_out", 14000))).toBe("Rent pot (5770)");
    expect(categorise(tx("Fr 7440", "transfer_in_out", 50000))).toBe("Savings moved in (7440)");
    expect(categorise(tx("to 5770", "transfer_in_out", -70000))).toBe("Rent pot (5770)");
  });
  it("lets user rules override defaults", () => {
    expect(categorise(tx("TESCO STORES"), [{ pattern: "TESCO", category: "Other" }])).toBe("Other");
  });
  it("falls back on payment type", () => {
    expect(categorise(tx("H91D8KC 18/10", "atm"))).toBe("Cash");
    expect(categorise(tx("Fr 9999", "transfer_in_out", 14000))).toBe("Transfers");
    expect(categorise(tx("SOMETHING NEW"))).toBeNull();
  });
});
