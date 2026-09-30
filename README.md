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

1. **Set up:** choose a part-time job, allowance, or your own numbers; edit the period, income, starting cash, and savings goal.
2. **First plan:** enter category items and due dates. Check the savings summary and payday timeline, then lock in the first plan.
3. **Surprise:** draw an unexpected cost or extra income, or test a spending choice. Apply it to the revised plan.
4. **Revise:** adjust amounts and dates. Compare against the read-only first plan and check the updated timeline.
5. **Reflect:** view category comparison bars, write what changed and why, save a reopenable plan file, and export Excel.

The original is captured when locking the first plan or navigating to Surprise, Revise, or Reflect. Revisiting First plan shows the original snapshot. Save/open remains compatible with previously downloaded version-1 plan files.

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
