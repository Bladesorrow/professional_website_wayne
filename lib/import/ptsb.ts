// Parser for the Permanent TSB "Transaction list" CSV export.
// Format: Date,Description,Money in (€),Money out (€),Balance (€)
// - Windows-1252 encoded, newest row first
// - Dates look like "09 Nov 2026"; money out is negative; thousands use commas
// - No transaction id, so duplicates are detected with date+description+amount+balance

export type PtsbPaymentType =
  | "card" | "pos" | "contactless" | "direct_debit" | "transfer_in_out"
  | "revolut" | "zapp" | "atm" | "credit_transfer" | "savings" | "fee" | "other";

export interface PtsbTransaction {
  date: string;          // ISO yyyy-mm-dd
  description: string;   // raw bank text
  merchant: string;      // cleaned name
  type: PtsbPaymentType;
  amountCents: number;   // negative = money out
  balanceCents: number;
  dedupeKey: string;
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

export function decodePtsb(bytes: Uint8Array): string {
  return new TextDecoder("windows-1252").decode(bytes);
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f.trim() !== "")) rows.push(row); }
  return rows;
}

export function parseDate(s: string): string {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(s.trim());
  if (!m || !MONTHS[m[2].toLowerCase()]) throw new Error(`Unrecognised PTSB date: "${s}"`);
  return `${m[3]}-${MONTHS[m[2].toLowerCase()]}-${m[1].padStart(2, "0")}`;
}

export function toCents(s: string): number {
  const t = s.trim().replace(/,/g, "");
  if (t === "") return 0;
  const n = Number(t);
  if (!Number.isFinite(n)) throw new Error(`Unrecognised amount: "${s}"`);
  return Math.round(n * 100);
}

export function paymentType(desc: string): PtsbPaymentType {
  const d = desc.trim();
  if (/^TKN\s/i.test(d)) return "card";
  if (/^POS\s/i.test(d)) return "pos";
  if (/^CNC\s/i.test(d)) return "contactless";
  if (/^DD\s/i.test(d)) return "direct_debit";
  if (/^ICT\s+(to|Fr)\s/i.test(d)) return "transfer_in_out";
  if (/^ICT\s/i.test(d)) return "credit_transfer";
  if (/^VPP\s+Revo/i.test(d)) return "revolut";
  if (/^ZPY\s/i.test(d)) return "zapp";
  if (/^ATM\s/i.test(d)) return "atm";
  if (/^CT\s/i.test(d)) return "credit_transfer";
  if (/^SAVINGS$/i.test(d)) return "savings";
  if (/charge|interest/i.test(d)) return "fee";
  return "other";
}

export function cleanMerchant(desc: string): string {
  return desc
    .trim()
    .replace(/^(TKN|POS|CNC|DD|ICT|ZPY|VPP|CT|ATM)\s+/i, "")
    .replace(/\s+\d{2}\/\d{2}(\s.*)?$/, "") // card swipe date and trailing refs
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePtsb(text: string): PtsbTransaction[] {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  if (!header[0].startsWith("date") || !header[1].startsWith("description") ||
      !header[2].startsWith("money in") || !header[3].startsWith("money out") ||
      !header[4]?.startsWith("balance")) {
    throw new Error("This doesn't look like a PTSB transaction list (unexpected columns).");
  }
  return rows.slice(1).map((r) => {
    const date = parseDate(r[0]);
    const description = r[1].trim();
    const amountCents = toCents(r[2]) + toCents(r[3]);
    const balanceCents = toCents(r[4]);
    return {
      date, description,
      merchant: cleanMerchant(description),
      type: paymentType(description),
      amountCents, balanceCents,
      dedupeKey: `${date}|${description}|${amountCents}|${balanceCents}`,
    };
  });
}
