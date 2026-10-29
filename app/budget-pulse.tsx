import {analyse, money, type Budget} from '../lib/budget';

/** A compact overview of the same calculated amounts used by the detailed breakdown. */
export function BudgetPulse({b}: {b: Budget}) {
  const a = analyse(b);
  const available = Math.round((b.opening + a.income) * 100) / 100;
  const allocated = Math.round((a.expenses + a.savings + a.investments) * 100) / 100;
  const scale = Math.max(available, allocated, 1);
  const parts = [
    {label: 'Expenses', amount: a.expenses, colour: 'expense'},
    {label: 'Savings', amount: a.savings, colour: 'saving'},
    {label: 'Investments', amount: a.investments, colour: 'investment'},
    {label: 'Left over', amount: Math.max(0, a.left), colour: 'remaining'},
  ];
  const insight = a.left < 0
    ? `Your plan needs ${money(-a.left)} more. Try lowering a cost or investment contribution, or updating your income.`
    : a.shortfall
      ? `The total fits, but you run short before payday. Check your dates in the timeline.`
      : a.left === 0
        ? 'Every dollar has a job. There is no money left for an extra cost.'
        : `${money(a.left)} remains for another priority or an unexpected cost.`;
  return <aside className="budget-pulse" aria-label="Live budget overview">
    <div className="pulse-head">
      <span><small>Available this period</small><strong>{money(available)}</strong></span>
      <span className={a.left < 0 ? 'pulse-short' : ''}><small>{a.left < 0 ? 'Over budget' : 'Money left over'}</small><strong>{money(Math.abs(a.left))}</strong></span>
    </div>
    <details className="pulse-details">
      <summary>Where your money goes <span>{money(allocated)} planned</span></summary>
      <div className="allocation-bar" aria-hidden="true">{parts.map(p=><span key={p.label} className={p.colour} style={{width: `${p.amount / scale * 100}%`}}/>)}</div>
      <ul className="allocation-key">{parts.map(p=><li key={p.label}><i className={p.colour} aria-hidden="true"/>{p.label}<strong>{money(p.amount)}</strong></li>)}</ul>
      <p className="hint">Available = starting cash + income. Planned = expenses + savings + investments.{a.left < 0 && ' The bar shows your planned amounts, which exceed the money available.'}</p>
    </details>
    <p className={'pulse-insight '+(a.left<0||a.shortfall?'attention':'')} role="status" aria-live="polite" aria-atomic="true">{insight}{a.savingsLimited && ' Savings have been reduced to fit the money available.'}</p>
  </aside>;
}
