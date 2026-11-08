# My Finance: reset the repo and plan the family finance tracker

## Context
`professional_website_wayne` currently holds a Next.js portfolio site (`app/`, `content/`, config files) and a Unity game (`unity-game/`). None of it is wanted. The repo becomes **My Finance**, a private web app for a family of 6 (two parents, one income, four children aged 18, 10, 7 and 5; Child Benefit goes to the wife). It should show where the money goes, take in receipts and bank data, calculate Irish take-home pay, and give practical tips to cut weekly and monthly spending so the family can save for holidays and other big goals.

Decisions made: **Next.js + Supabase**, **AI receipt extraction plus bank CSV import**, **tax calculator for a one-income couple with 4 children and Child Benefit**.

## Phase 0: Reset and rename (first thing on approval)
1. On branch `claude/ecstatic-wozniak-4j2b61`, `git rm -r` everything tracked: `app/`, `content/`, `unity-game/`, `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`, `README.md`, `.gitignore`. Git history keeps the old files, so nothing is lost for good.
2. Add a fresh `README.md` titled "My Finance", a new `.gitignore`, and a new `package.json` with `"name": "my-finance"`.
3. Commit and push to the designated branch. No PR unless asked.
4. **Repo rename:** my tools can't rename a GitHub repository. Wayne does this in GitHub, under Settings, General, Repository name, then `my-finance`. GitHub redirects the old URL. Renaming may break this session's access to the repo, so do it after the work is pushed.

## Architecture
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind, installable on phones as a PWA. Charts via Recharts.
- **Backend:** Supabase Postgres with row-level security, Supabase Auth (one household, parents as members) and Storage for receipt images.
- **Receipt AI:** a server route (`/api/receipts/extract`) sends the image or PDF to the Claude API and returns structured JSON. The API key stays server-side only.
- **Private by default:** every table is scoped to a `household_id` through RLS, and the receipts bucket is private (signed URLs only).

## Data model (Supabase)
`households`, `members`, `accounts` (current, savings, credit card, cash), `categories` (nested, with a monthly budget), `transactions` (date, amount, merchant, category, account, source: manual / receipt / csv, `receipt_id`, `is_recurring`), `receipts` (file path, extracted JSON, status: pending / confirmed), `merchant_rules` (merchant to category, learned from corrections), `budgets`, `savings_goals` (target, deadline, saved to date), `tax_profiles` (tax year, gross pay, pension %, credits), `tax_config` (rates, bands and credits per tax year), `tips` (generated insights, dismissed flag).

## Features and build order
1. **Foundation:** auth, household setup, accounts, categories pre-seeded for an Irish family (groceries, childcare/school, utilities, energy, mortgage/rent, transport, health, kids' activities, subscriptions, takeaways, holidays, savings).
2. **Transactions:** manual add/edit, list with filters, split transactions.
3. **Bank CSV import:** column-mapping step with saved presets (AIB, Bank of Ireland, Revolut, PTSB), duplicate detection, auto-categorise via `merchant_rules`.
4. **Receipt upload:** camera or file upload, then Claude extracts merchant, date, total, VAT and line items, then a review screen to confirm, then it creates the transaction and learns the merchant rule. Tesco or Dunnes receipts can be split by line item (e.g. groceries vs household).
5. **Dashboard:**
   - this month's spending vs budget
   - spending by category (donut and trend)
   - weekly spending bars
   - income vs spending (net cash flow)
   - upcoming and recurring bills
   - savings goal progress (holiday fund)
   - top merchants
   - latest tips
6. **Tax and income calculator** (see below).
7. **Savings tips engine:** rule-based insights, optionally written up in plain language by Claude.
8. **Goals:** holiday fund and other targets, with "save X per week to reach it by [date]".
9. **Polish:** PWA install, CSV/PDF export, backups.

## Tax and income calculator (Irish, one earner)
- **Inputs:** gross annual salary, pay frequency, pension contribution %, bonus/overtime, tax year. Marital status is married, one income. Dependants: 4 children. Wife is the home carer.
- **Outputs:** gross, income tax (standard-rate band, then higher rate), tax credits (personal, PAYE, home carer where eligible), USC, employee PRSI, take-home per year, month, week. Also the effective tax rate, the marginal rate, and a what-if (pay rise, overtime, extra pension).
- **Child Benefit:** a separate monthly income line for the wife. It is not taxable and is entered as a per-child amount. The 18-year-old counts only while in full-time education (up to age 19), so the app should ask for the child's end date and drop the payment automatically.
- **Config, not code:** all rates, bands and credits live in the `tax_config` table, keyed by tax year. Seed them from the Revenue.ie and gov.ie figures for 2026, and **verify them against the official source before release**; do not rely on memory. A new tax year means adding a row, not changing code.
- Unit tests cover known worked examples (Revenue's published examples) and edge cases (band boundaries, PRSI thresholds).
- The calculator is an estimate, not tax advice. The UI says so, and links to Revenue.

## Tips engine (how it finds savings)
Rule-based checks over the last 3 months, ranked by estimated €/month saved:
- Groceries over budget or trending up, with a suggestion to switch to a weekly shop plan or own-brand items and to review the Aldi/Lidl split.
- Subscriptions: detect recurring charges, flag overlaps (several streaming services) and unused ones.
- Energy and bills: a reminder to compare providers yearly (electricity, gas, broadband, mobile, insurance), and flag price rises.
- Takeaways and eating out above a set share of the food budget.
- Kids' costs: back-to-school, activities, and Child Benefit as a share of income.
- Bank fees, interest and late fees.
- Holiday fund: "you are €X short of your target; cutting Y by €Z a week closes the gap."
Optional step: send the monthly category summary (no raw bank details) to Claude for friendly, family-specific advice.

## Critical files (planned layout)
- `app/(dashboard)/page.tsx`, `app/transactions`, `app/receipts`, `app/tax`, `app/goals`, `app/tips`
- `app/api/receipts/extract/route.ts`, `app/api/import/csv/route.ts`
- `lib/tax/calculate.ts` and `lib/tax/config.ts` (pure functions, unit tested)
- `lib/tips/rules.ts`, `lib/import/presets.ts`, `lib/supabase/{client,server}.ts`
- `supabase/migrations/*.sql` (schema, RLS policies, seed categories and tax config)

## Verification
- `npm run build` and `npm run lint` pass; Vitest unit tests for tax calculation, CSV parsing and the tips rules.
- Run the app and drive it with Playwright: sign up, import a sample CSV, upload a sample receipt, check that the dashboard totals match the imported data.
- Check RLS with two test households: one must not see the other's rows or receipts.
- Tax calculator output is checked against Revenue's published examples.

## Open items to confirm during build
- Which bank(s) the family uses, so the right CSV presets are built first.
- Anthropic API key needed for receipt extraction (set as a server environment variable, never committed).
- Hosting (Vercel is connected and would suit this) and a Supabase project (new or existing).
