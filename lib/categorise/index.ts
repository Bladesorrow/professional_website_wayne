// Rules-based categoriser. User-learned rules (merchant_rules table) win over these defaults.
import type { PtsbPaymentType } from "@/lib/import/ptsb";

export interface Rule { pattern: string; category: string }

const to = (category: string, patterns: string[]): Rule[] => patterns.map((pattern) => ({ pattern, category }));

/** Starter rules for common Irish merchants. Matched as case-insensitive substrings of the cleaned merchant. */
export const DEFAULT_RULES: Rule[] = [
  ...to("Salary", ["GRAFTON DIGITA"]),
  ...to("Social welfare", ["DEPT OF SOCIAL"]),
  ...to("Rent", ["GALWAY CO CO"]),
  // Account 5770 is the rent pot: a month of rent goes in, and €140 comes back each week. Neutral both ways.
  ...to("Rent pot (5770)", ["FR 5770", "TO 5770"]),
  // Account 7440 only ever sends money in. Shown separately so spending that is being covered by transfers stays visible.
  ...to("Top-ups from 7440", ["FR 7440"]),
  ...to("Holidays", ["THE HENDRICK"]),
  ...to("Energy & utilities", ["ENERGIA", "BORD GAIS", "ELECTRIC IRELAND", "FLOGAS"]),
  ...to("Insurance", ["ALLIANZ"]),
  ...to("Groceries", ["TESCO", "SUPERVALU", "ALDI", "LIDL", "DUNNES"]),
  ...to("Coffee & snacks", [
    "CENTRA", "SPAR ", "LONDIS", "XL EYRE", "XL CORRIB", "CIRCLE K", "GALA ", "MEEHANS", "MANNION", "HENCHYS",
    "RAYMOND O BR", "CAMPBELL CAT", "EVERGREEN", "FRESH THE GO", "FRESH GOOD", "COCA COLA", "NYA*BDS", "INFINITY CAF",
    "ESQUIRES", "AMERICANO", "BRAZCO", "INSOMNIA", "KRISPY", "SP TANIAMIRE", "TOM STANLEYS", "THE LUNCH BA",
  ]),
  ...to("Eating out & takeaways", [
    "MCDONALDS", "MAD YOLKS", "SUBWAY", "EDDIE ROCKET", "SUPERMACS", "DELIVEROO", "DROPCHEF", "TAKE AWAY",
    "MILANO", "THE OSLO BAR", "WETHERSPO", "THE CELLAR", "GOLDEN DISC", "ROOTS", "TST-",
  ]),
  ...to("Subscriptions & TV", ["SKYSUBSCRIBE", "DISNEY PLUS", "APPLE.COM/BI", "AN POST TV", "NETFLIX", "SPOTIFY"]),
  ...to("Transport", ["IRISH RAIL", "LEAP CARD", "MAXOL", "TAXI"]),
  ...to("Kids & school", ["STATE EXAMIN", "CTYI COURSES", "KILCOLGAN EDUC", "BUSY BEES"]),
  ...to("Kids' activities & days out", ["DUBLIN ZOO", "FUNHUB", "TICKETMA", "GALWAYBAYSAI", "NYX*EYRESQUA", "NYA*BROOKFIE"]),
  ...to("Clothes & shopping", [
    "PENNEYS", "NEXT ONLINE", "TKMAXX", "MARKS & SPEN", "SKECHERS", "PEPCO", "DEALZ", "SOESTRENE", "AMAZON",
    "AMZN", "SMYTHS", "VERY", "B & Q", "HOME STORE", "DISNEY STORE", "EASON", "DUBRAY", "RITUALS", "NORMAL GALWA",
    "WATERSTONES", "MR PRICE", "HUMMGROUP", "EXERTIS",
  ]),
  ...to("Health & pharmacy", ["PHARM", "BOOTS", "HOLLAND", "SPECSAVERS", "MYMEDICAL", "GALWAY CLINI", "HEALTH S", "IMC ORANMORE"]),
  // Credit-card payments are movements of money, not spending
  ...to("Transfers", ["PTSB VISA"]),
];

export interface CategoriseInput {
  merchant: string;
  type: PtsbPaymentType | string | null;
  amountCents: number;
}

/** Returns a category name, or null when nothing matches. */
export function categorise(tx: CategoriseInput, userRules: Rule[] = []): string | null {
  const m = tx.merchant.toUpperCase();
  for (const r of [...userRules, ...DEFAULT_RULES]) {
    if (m.includes(r.pattern.toUpperCase())) return r.category;
  }
  switch (tx.type) {
    case "savings": return "Savings";
    case "atm": return "Cash";
    case "fee": return "Bank fees & interest";
    case "transfer_in_out":
    case "zapp":
    case "revolut": return "Transfers";
    default: return null;
  }
}
