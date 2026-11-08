const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const eur0 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const fmt = (cents: number) => eur.format(cents / 100);
export const fmt0 = (cents: number) => eur0.format(cents / 100);
export const toCentsFromInput = (v: string | number) => Math.round(Number(v) * 100);
