import { describe, expect, it } from "vitest";
import { cleanMerchant, decodePtsb, paymentType, parsePtsb, toCents, parseDate } from "../lib/import/ptsb";

const sample = [
  "Date,Description,Money in (€),Money out (€),Balance (€)",
  "09 Nov 2026,TKN TESCO STORES 05/11 1,,-45.39,\"2,872.04\"",
  "05 Nov 2026,ICT GRAFTON DIGITA 05/11,\"3,802.78\",,\"3,007.74\"",
  "05 Nov 2026,SAVINGS,,-20.00,-516.07",
  "29 Oct 2026,TKN COCA COLA 27/10 12:0,,-2.90,-356.21",
  "29 Oct 2026,TKN COCA COLA 27/10 12:0,,-2.90,-353.31",
].join("\n");

describe("PTSB parser", () => {
  it("parses dates, thousands separators and signs", () => {
    const [a, b] = parsePtsb(sample);
    expect(a.date).toBe("2026-11-09");
    expect(a.amountCents).toBe(-4539);
    expect(a.balanceCents).toBe(287204);
    expect(b.amountCents).toBe(380278);
  });
  it("gives identical-looking rows different dedupe keys via balance", () => {
    const rows = parsePtsb(sample);
    expect(new Set(rows.map((r) => r.dedupeKey)).size).toBe(rows.length);
  });
  it("cleans merchants and detects payment types", () => {
    expect(cleanMerchant("TKN TESCO STORES 05/11 1")).toBe("TESCO STORES");
    expect(cleanMerchant("DD GALWAY CO CO")).toBe("GALWAY CO CO");
    expect(paymentType("DD Energia")).toBe("direct_debit");
    expect(paymentType("ICT Fr 5770 04/11")).toBe("transfer_in_out");
    expect(paymentType("VPP Revo Revolut**9509*")).toBe("revolut");
    expect(paymentType("Sep Quarterly Interest")).toBe("fee");
  });
  it("decodes Windows-1252 headers with the euro sign", () => {
    const bytes = Uint8Array.from([0x44, 0x61, 0x74, 0x65, 0x2c, 0x80]);
    expect(decodePtsb(bytes)).toBe("Date,€");
  });
  it("rejects other formats and bad values", () => {
    expect(() => parsePtsb("a,b,c\n1,2,3")).toThrow(/PTSB/);
    expect(() => parseDate("2026-11-09")).toThrow();
    expect(toCents("")).toBe(0);
  });
});
