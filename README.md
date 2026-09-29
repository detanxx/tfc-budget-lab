# TFC Budget Lab

A client-only React + TypeScript budgeting app. One budgeting period, Canadian dollars, no login, API, database, browser storage, analytics, or saved personal budgets. Refreshing or closing loses the session; download Excel first.

## Start locally

Requires Node.js 22.13+ and npm.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Stop with Ctrl+C.

```sh
npm test          # calculations and Excel round-trip
npm run build    # TypeScript check and production build
npm start        # serve the production build locally
```

## Using the app

1. Edit the café-job example, choose allowance, or start with your own numbers. Set the period, starting cash, dated income, and category subexpenses.
2. Set a savings goal and check cash flow. The example deliberately has an early shortfall despite a positive ending balance.
3. Opening What if? or My changes captures the original plan once. Changes after this update only the revised budget.
4. Try spending using the buffer, reduced savings, or cuts to another category. Draw and apply surprise events. Return to My budget to adjust any entries.
5. Compare totals, write the reflection, and download the Excel workbook before leaving.

## Calculation rules

- Money calculations sum integer cents. Dates use local calendar YYYY-MM-DD strings.
- Only dated entries inside the selected period count; excluded entries remain editable and are flagged.
- Starting cash is separate from previously saved goal money.
- Each unique date with positive income is one payday. Savings are transferred on paydays on/before the target, capped at the remaining goal.
- Suggested savings divide the remaining goal by entered eligible paydays, rounded up to a cent. No unentered future income is assumed.
- Same-day ordering is income, expenses, then savings. This assumes payday funds are available before payments on that date.
- A spending choice reduces selected category items in listed order, or reduces savings per payday equally. Any uncovered cost comes from the buffer.
- The Excel file is a snapshot of both plans, not a recalculating spreadsheet. It contains full entries (including excluded dates), category totals, goals, cash-flow schedules, applied events, trade-offs, and reflection. Text is exported as literal strings, not formulas.

The supplied logo is copied unchanged to public/tfc-logo.png and displayed with its original aspect ratio.

## Return another day

The start screen offers allowance, part-time job, and blank plans using the current calendar month. Save my plan downloads a TFC-My-Plan.json file containing both budgets, surprises, trade-offs, and reflection. Open a plan restores that file locally. Nothing is uploaded or saved to browser storage. Excel is a separate review snapshot and cannot be reopened as a plan.

The public site contains only app code, branding, and examples. Personal plan files remain on the user's device. Keep a copy somewhere you can find it next time.
