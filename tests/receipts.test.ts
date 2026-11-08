import { describe, expect, it } from "vitest";
import { parseExtraction } from "../lib/receipts/parse";

describe("parseExtraction", () => {
  it("reads JSON wrapped in prose and converts euro to cents", () => {
    const r = parseExtraction('Here you go:\n{"merchant":"Tesco","date":"2026-11-05","total":46.95,"vat":2.1,"category":"Groceries","items":[{"name":"Milk","amount":1.55},{"name":"x"}]}');
    expect(r).toMatchObject({ merchant: "Tesco", date: "2026-11-05", totalCents: 4695, vatCents: 210, suggestedCategory: "Groceries" });
    expect(r.items).toEqual([{ name: "Milk", cents: 155 }]);
  });
  it("rejects replies with no JSON and drops bad dates", () => {
    expect(() => parseExtraction("sorry")).toThrow();
    expect(parseExtraction('{"date":"05/11/2026","total":"abc"}')).toMatchObject({ date: null, totalCents: null });
  });
});
