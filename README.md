# My Finance

A private personal finance manager for our family of 6. It shows where the money goes, takes in receipts and bank statements, works out Irish take-home pay (PAYE, USC, PRSI), and suggests ways to cut weekly and monthly spending so we can save for bigger things like family holidays.

## Status

Planning. The full plan covers the architecture, data model, build order, the Irish tax calculator and the savings-tips engine.

## Planned stack

- Next.js (App Router) + TypeScript + Tailwind, installable as a PWA
- Supabase: Postgres with row-level security, Auth, and private Storage for receipts
- Claude API for reading receipts (server-side only)

## Planned features

1. Dashboard: spending vs budget, spending by category, weekly spending, income vs spending, recurring bills, savings goals, top merchants, tips
2. Transactions: manual entry, filters, split transactions
3. Bank CSV import with presets for common Irish banks
4. Receipt upload with AI extraction, then review and confirm
5. Tax and income calculator for a one-income family with Child Benefit
6. Savings tips engine
7. Savings goals, such as the holiday fund

## Tax disclaimer

The tax calculator gives estimates only and is not tax advice. Rates and credits are stored per tax year and must be checked against [Revenue.ie](https://www.revenue.ie) before relying on them.
