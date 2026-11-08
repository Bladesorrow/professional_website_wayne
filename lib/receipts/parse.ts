export interface ExtractedReceipt {
  merchant: string | null;
  date: string | null;      // yyyy-mm-dd
  totalCents: number | null;
  vatCents: number | null;
  suggestedCategory: string | null;
  items: { name: string; cents: number }[];
}

/** Pulls the JSON object out of a model reply and normalises it. Throws if it can't be read. */
export function parseExtraction(text: string): ExtractedReceipt {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON in model reply");
  const raw = JSON.parse(text.slice(start, end + 1));
  const euros = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) : null);
  const date = typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null;
  const items = Array.isArray(raw.items)
    ? raw.items.flatMap((i: { name?: unknown; amount?: unknown }) =>
        typeof i?.name === "string" && euros(i.amount) !== null ? [{ name: i.name.slice(0, 120), cents: euros(i.amount)! }] : [])
    : [];
  return {
    merchant: typeof raw.merchant === "string" ? raw.merchant.slice(0, 120) : null,
    date, totalCents: euros(raw.total), vatCents: euros(raw.vat),
    suggestedCategory: typeof raw.category === "string" ? raw.category : null, items,
  };
}
