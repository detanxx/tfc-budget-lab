export type Item = { id: string; name: string; amount: number; date: string };
export const cadences = ['once','weekly','biweekly','twice-monthly','monthly'] as const;
export type Income = Item & {cadence?: typeof cadences[number]};
export type Category = { id: string; name: string; items: Item[] };
export const investmentAccounts = ['TFSA', 'FHSA', 'RRSP', 'Other Investments'] as const;
export type Schedule = {cadence?: typeof cadences[number] | 'payday'; endDate?: string};
export type SavingsGoal = {id:string;name:string;amount:number;saved:number;target:string;perPayday:number;date:string} & Schedule;
export type Investment = Schedule & { id: string; account: typeof investmentAccounts[number]; amount: number; date: string };
export type Budget = { start: string; end: string; opening: number; goals?: SavingsGoal[]; investments?: Investment[]; income: Income[]; categories: Category[]; goal: { name: string; amount: number; saved: number; target: string; perPayday: number } };
export type Log = { name: string; amount: number; date: string; detail: string };
export const money = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n === 0 ? 0 : n);
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
export const getGoals=(b:Budget):SavingsGoal[]=>b.goals??[{...b.goal,id:'legacy-goal',date:b.start,cadence:'payday'}];
export function contributionDates(b:Budget,s:Schedule & {date:string},paydays:string[]):string[]{
 const end=s.endDate&&s.endDate<b.end?s.endDate:b.end;
 if(s.cadence==='payday')return paydays.filter(d=>d>=s.date&&d<=end);
 return incomeDates({...b,end},{id:'schedule',name:'',amount:0,date:s.date,cadence:s.cadence});
}
export function analyse(b: Budget) {
 const income = scheduledIncome(b);
 const expenses = b.categories.flatMap(c=>c.items.map(i=>({...i,category:c.name}))).filter(i=>inPeriod(b,i.date));
 const incomePaydays=[...new Set(income.filter(i=>i.amount>0).map(i=>i.date))].sort();
 const contributions = (b.investments||[]).flatMap(i=>contributionDates(b,i,incomePaydays).map(date=>({...i,date})));
 const investments = sum(contributions);
 const investmentTotals = Object.fromEntries(investmentAccounts.map(account=>[account,sum(contributions.filter(i=>i.account===account))])) as Record<typeof investmentAccounts[number],number>;
 const paydays = [...new Set(income.filter(i=>i.amount>0).map(i=>i.date))].sort();
 const goalResults=getGoals(b).map(g=>{
  const dates=contributionDates(b,{...g,endDate:g.endDate&&g.endDate<g.target?g.endDate:g.target},paydays);
  const remaining=Math.max(0,cents(g.amount)-cents(g.saved));
  return {goal:g,dates,remaining,saved:0,required:dates.length?Math.ceil(remaining/dates.length)/100:0};
 });
 const savingsAvailable=Math.max(0,cents(b.opening)+cents(sum(income))-cents(sum(expenses))-cents(investments));
 let savingsRoom=savingsAvailable;
 const requests=goalResults.flatMap((r,index)=>r.dates.map(date=>({date,index}))).sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);
 const deposits=requests.map(({date,index})=>{const r=goalResults[index];const amount=Math.min(r.remaining,cents(r.goal.perPayday),savingsRoom);r.remaining-=amount;r.saved+=amount;savingsRoom-=amount;return {date,amount:amount/100,name:'Set aside for '+r.goal.name,type:'Savings'};});
 const toSave=goalResults.reduce((n,r)=>n+r.remaining,0);
 const remaining=getGoals(b).reduce((n,g)=>n+Math.max(0,cents(g.amount)-cents(g.saved)),0);
 const eligible=goalResults[0]?.dates||[],required=goalResults[0]?.required||0;
 const requested=goalResults.reduce((n,r)=>n+Math.min(Math.max(0,cents(r.goal.amount)-cents(r.goal.saved)),cents(r.goal.perPayday)*r.dates.length),0);
 const transactions = [...income.map(i=>({...i,type:'Payday'})),...expenses.map(i=>({...i,type:'Expense'})),...deposits,...contributions.map(i=>({...i,name:i.account+' contribution',type:'Investment'}))].sort((a,b)=>a.date.localeCompare(b.date)||({Payday:0,Expense:1,Savings:2,Investment:3}[a.type as 'Payday'])-({Payday:0,Expense:1,Savings:2,Investment:3}[b.type as 'Payday']));
 let balance = cents(b.opening);
 const timeline=transactions.map(t=>{balance+=cents(t.amount)*(t.type==='Payday'?1:-1);return {...t,balance:balance/100,nextPayday:paydays.find(d=>d>t.date)};});
 const savings=sum(deposits), totalIncome=sum(income), totalExpenses=sum(expenses);
 return {goalResults,contributions,income:totalIncome,expenses:totalExpenses,savings,savingsAvailable:savingsAvailable/100,savingsLimited:savings<requested/100,investments,investmentTotals,left:balance/100,required,paydays,eligible,timeline,shortfall:timeline.find(t=>t.balance<0),lowest:Math.min(b.opening,...timeline.map(t=>t.balance)),goalGap:toSave/100,excluded:(b.investments||[]).filter(i=>!contributionDates(b,i,paydays).length).length+b.income.filter(i=>!incomeDates(b,i).length).length+b.categories.flatMap(c=>c.items).length-expenses.length};
}
export function monthlyBreakdown(b:Budget){
 const a=analyse(b),months=[];let opening=b.opening;
 for(let date=b.start.slice(0,7)+'-01';date<=b.end;){
  const key=date.slice(0,7),rows=a.timeline.filter(t=>t.date.startsWith(key));
  const total=(type:string)=>sum(rows.filter(t=>t.type===type));
  const income=total('Payday'),expenses=total('Expense'),savings=total('Savings'),investments=total('Investment');
  const left=(cents(opening)+cents(income)-cents(expenses)-cents(savings)-cents(investments))/100;
  months.push({month:key,opening,income,expenses,savings,investments,left});opening=left;
  const d=new Date(date+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);date=d.toISOString().slice(0,10);
 }
 return months;
}
export function example(kind='job',today?:Date): Budget {
 const item=(name:string,amount:number,day:string)=>({id:uid(),name,amount,date:'2026-10-'+day});
 const result:Budget={start:'2026-10-01',end:'2026-10-31',opening:kind==='blank'?0:60,income:kind==='blank'?[]:kind==='allowance'?[item('Allowance',100,'02'),item('Allowance',100,'16')]:[item('Café shift pay',320,'09'),item('Café shift pay',320,'23')],categories:kind==='blank'?[{id:uid(),name:'Essentials',items:[item('Transit',0,'01'),item('Phone',0,'10')]},{id:uid(),name:'Flexible spending',items:[item('Food out',0,'08')]},{id:uid(),name:'Fun',items:[item('Fun money',0,'18')]}]:[{id:uid(),name:'Everyday essentials',items:[item('Transit pass',80,'01'),item('Phone plan',35,'12')]},{id:uid(),name:'Food & friends',items:[item('Lunches',65,'10'),item('Weekend hangout',40,'17')]},{id:uid(),name:'A little for me',items:[item('Clothes',55,'24'),item('Music subscription',11,'05')]}],goal:{name:kind==='blank'?'Savings goal':'A new pair of headphones',amount:kind==='blank'?0:kind==='allowance'?50:200,saved:0,target:'2026-10-31',perPayday:kind==='blank'?0:kind==='allowance'?25:100}};
 if(kind==='allowance'){result.categories=[{id:uid(),name:'Food & friends',items:[item('Snacks after school',25,'04'),item('A day out',35,'18')]},{id:uid(),name:'A little for me',items:[item('Game or hobby',30,'20'),item('Music subscription',11,'05')]}];}
 if(today){const prefix=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;const end=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();result.start=prefix+'-01';result.end=prefix+'-'+end;result.goal.target=result.end;for(const i of [...result.income,...result.categories.flatMap(c=>c.items)])i.date=prefix+i.date.slice(7);}
 if(result.income.length)result.income=[{...result.income[0],cadence:'biweekly'}];
 return result;
}
export const surprises=[
 {name:'Phone screen repair',amount:-75,detail:'Your screen cracked. Compare repair options before deciding.',options:[{label:'Repair the screen',amount:-75},{label:'Use a basic repair service (check the quote first)',amount:-45}]},
 {name:'School trip fee',amount:-45,detail:'A school trip has a fee. Ask what support or alternatives are available.',options:[{label:'Pay the full fee',amount:-45},{label:'Ask about support; model half the fee if approved',amount:-22.5}]},
 {name:'Lost earbuds',amount:-60,detail:'Your earbuds are missing. You can replace them or find another way.',options:[{label:'Buy the same model',amount:-60},{label:'Buy a basic wired pair',amount:-15},{label:'Use a spare pair for now',amount:0}]},
 {name:'An extra shift',amount:65,detail:'You are offered an extra shift. Think about your time as well as the pay.',options:[{label:'Take the shift',amount:65},{label:'Keep the time for school or rest',amount:0}]},
 {name:'Birthday money',amount:40,detail:'A gift from family gives you more room in your plan.',options:[{label:'Add the gift to my budget, then decide where it goes',amount:40}]},
 {name:'Lost transit card',amount:-25,detail:'You need a way to get around after losing your transit card.',options:[{label:'Replace the card and fare balance',amount:-25},{label:'Check balance recovery; model only a replacement fee',amount:-6}]},
 {name:'Bike tune-up',amount:-45,detail:'Your bike needs attention before your next ride.',options:[{label:'Use a bike shop',amount:-45},{label:'Try a community repair clinic and pay for parts',amount:-15}]},
 {name:'Sold an old game',amount:30,detail:'Someone offers to buy a game you no longer play.',options:[{label:'Sell it',amount:30},{label:'Keep it',amount:0}]},
 {name:'Friend’s birthday',amount:-35,detail:'You want to celebrate a friend without stretching your budget.',options:[{label:'Buy a gift',amount:-35},{label:'Make a card and share a small treat',amount:-10}]},
 {name:'Team registration',amount:-80,detail:'Registration opens for a team you want to join.',options:[{label:'Pay the registration fee',amount:-80},{label:'Ask about assistance; model a reduced fee if approved',amount:-40},{label:'Choose a free activity this time',amount:0}]},
 {name:'Pet-sitting offer',amount:50,detail:'A neighbour needs help caring for a pet this weekend.',options:[{label:'Accept the job',amount:50},{label:'Decline because I have other plans',amount:0}]},
 {name:'Rainy-day ride home',amount:-20,detail:'Your usual ride falls through. You need another way home.',options:[{label:'Pay for a ride',amount:-20},{label:'Take public transit',amount:-4}]},
 {name:'School supplies',amount:-30,detail:'A class needs supplies you do not have yet.',options:[{label:'Buy the supplies',amount:-30},{label:'Borrow some and buy the rest',amount:-12}]},
 {name:'Concert invitation',amount:-90,detail:'Friends invite you to a show. Include travel when weighing the cost.',options:[{label:'Go to the show',amount:-90},{label:'Plan a free hangout instead',amount:0}]}
];
