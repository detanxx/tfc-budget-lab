export type Item = { id: string; name: string; amount: number; date: string };
export const cadences = ['once','weekly','biweekly','twice-monthly','monthly'] as const;
export type Income = Item & {cadence?: typeof cadences[number]};
export type Category = { id: string; name: string; items: Item[] };
export const investmentAccounts = ['TFSA', 'RRSP', 'Other Investments'] as const;
export type Investment = { id: string; account: typeof investmentAccounts[number]; amount: number; date: string };
export type Budget = { start: string; end: string; opening: number; investments?: Investment[]; income: Income[]; categories: Category[]; goal: { name: string; amount: number; saved: number; target: string; perPayday: number } };
export type Log = { name: string; amount: number; date: string; detail: string };
export const money = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);
export const cents = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100);
export const uid = () => Math.random().toString(36).slice(2, 10);
export const inPeriod = (b: Budget, date: string) => date >= b.start && date <= b.end;
export const sum = (items: {amount:number}[]) => items.reduce((n,i)=>n+cents(i.amount),0)/100;
export function incomeDates(b:Budget,i:Income):string[]{
 const start=new Date(i.date+'T00:00:00Z'),end=new Date(b.end+'T00:00:00Z');
 if(!Number.isFinite(start.valueOf())||!Number.isFinite(end.valueOf()))return [];
 if(!i.cadence||i.cadence==='once')return inPeriod(b,i.date)?[i.date]:[];
 const from=new Date(b.start+'T00:00:00Z');if(!Number.isFinite(from.valueOf())||from>end)return [];
 const result:string[]=[],add=(d:Date)=>{const date=d.toISOString().slice(0,10);if(d>=start&&inPeriod(b,date))result.push(date)};
 if(i.cadence==='weekly'||i.cadence==='biweekly'){
  const step=(i.cadence==='weekly'?7:14)*86400000;
  for(let n=Math.max(0,Math.ceil((from.valueOf()-start.valueOf())/step)),t=start.valueOf()+n*step;t<=end.valueOf();t+=step)add(new Date(t));
 }else{
  const first=new Date(Math.max(start.valueOf(),from.valueOf()));
  for(let y=first.getUTCFullYear(),m=first.getUTCMonth();Date.UTC(y,m,1)<=end.valueOf();m++){
   const last=new Date(Date.UTC(y,m+1,0)).getUTCDate();
   for(const day of i.cadence==='twice-monthly'?[1,16]:[Math.min(start.getUTCDate(),last)])add(new Date(Date.UTC(y,m,day)));
  }
 }
 return result;
}
export const scheduledIncome=(b:Budget)=>b.income.flatMap(i=>incomeDates(b,i).map(date=>({...i,date})));
export function analyse(b: Budget) {
 const income = scheduledIncome(b);
 const expenses = b.categories.flatMap(c=>c.items.map(i=>({...i,category:c.name}))).filter(i=>inPeriod(b,i.date));
 const contributions = (b.investments||[]).filter(i=>inPeriod(b,i.date));
 const investments = sum(contributions);
 const investmentTotals = Object.fromEntries(investmentAccounts.map(account=>[account,sum(contributions.filter(i=>i.account===account))])) as Record<typeof investmentAccounts[number],number>;
 const paydays = [...new Set(income.filter(i=>i.amount>0).map(i=>i.date))].sort();
 const eligible = paydays.filter(d=>d<=b.goal.target);
 const remaining = Math.max(0,cents(b.goal.amount)-cents(b.goal.saved));
 const required = eligible.length ? Math.ceil(remaining/eligible.length)/100 : 0;
 let toSave = remaining;
 const deposits = eligible.map(date=>{const amount=Math.min(toSave,cents(b.goal.perPayday));toSave-=amount;return {date,amount:amount/100,name:'Set aside for '+b.goal.name,type:'Savings'};});
 const transactions = [...income.map(i=>({...i,type:'Payday'})),...expenses.map(i=>({...i,type:'Expense'})),...deposits,...contributions.map(i=>({...i,name:i.account+' contribution',type:'Investment'}))].sort((a,b)=>a.date.localeCompare(b.date)||({Payday:0,Expense:1,Savings:2,Investment:3}[a.type as 'Payday'])-({Payday:0,Expense:1,Savings:2,Investment:3}[b.type as 'Payday']));
 let balance = cents(b.opening);
 const timeline=transactions.map(t=>{balance+=cents(t.amount)*(t.type==='Payday'?1:-1);return {...t,balance:balance/100,nextPayday:paydays.find(d=>d>t.date)};});
 const savings=sum(deposits), totalIncome=sum(income), totalExpenses=sum(expenses);
 return {income:totalIncome,expenses:totalExpenses,savings,investments,investmentTotals,left:balance/100,required,paydays,eligible,timeline,shortfall:timeline.find(t=>t.balance<0),lowest:Math.min(b.opening,...timeline.map(t=>t.balance)),goalGap:toSave/100,excluded:(b.investments||[]).length-contributions.length+b.income.filter(i=>!incomeDates(b,i).length).length+b.categories.flatMap(c=>c.items).length-expenses.length};
}
export function example(kind='job',today?:Date): Budget {
 const item=(name:string,amount:number,day:string)=>({id:uid(),name,amount,date:'2026-10-'+day});
 const result:Budget={start:'2026-10-01',end:'2026-10-31',opening:kind==='blank'?0:60,income:kind==='blank'?[]:kind==='allowance'?[item('Allowance',100,'02'),item('Allowance',100,'16')]:[item('Café shift pay',320,'09'),item('Café shift pay',320,'23')],categories:kind==='blank'?[]:[{id:uid(),name:'Everyday essentials',items:[item('Transit pass',80,'01'),item('Phone plan',35,'12')]},{id:uid(),name:'Food & friends',items:[item('Lunches',65,'10'),item('Weekend hangout',40,'17')]},{id:uid(),name:'A little for me',items:[item('Clothes',55,'24'),item('Music subscription',11,'05')]}],goal:{name:'A new pair of headphones',amount:kind==='allowance'?50:200,saved:0,target:'2026-10-31',perPayday:kind==='blank'?0:kind==='allowance'?25:100}};
 if(kind==='allowance'){result.categories=[{id:uid(),name:'Food & friends',items:[item('Snacks after school',25,'04'),item('A day out',35,'18')]},{id:uid(),name:'A little for me',items:[item('Game or hobby',30,'20'),item('Music subscription',11,'05')]}];}
 if(today){const prefix=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;const end=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();result.start=prefix+'-01';result.end=prefix+'-'+end;result.goal.target=result.end;for(const i of [...result.income,...result.categories.flatMap(c=>c.items)])i.date=prefix+i.date.slice(7);}
 if(result.income.length)result.income=[{...result.income[0],cadence:'biweekly'}];
 return result;
}
export const surprises=[{name:'Phone screen repair',amount:-75,detail:'One drop. A repair bill. Can your buffer cover it?'},{name:'An extra shift',amount:65,detail:'You picked up a shift. Give those extra dollars a job.'},{name:'Birthday money',amount:40,detail:'A little unexpected cash from family.'},{name:'Lost transit card',amount:-25,detail:'You need a replacement to get around.'},{name:'Bike tune-up',amount:-45,detail:'Your ride needs some attention.'},{name:'Sold an old game',amount:30,detail:'Something you no longer use becomes extra income.'}];
