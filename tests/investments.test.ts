import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {analyse,example} from '../lib/budget.ts';
import {serializePlan,parsePlan} from '../lib/plan-file.ts';
import {workbook} from '../lib/export.ts';
test('investment contributions count once, by date, separately from expenses and savings',()=>{
 const b=example(),before=analyse(b);
 b.investments=[{id:'1',account:'TFSA',amount:25.01,date:'2026-10-09'},{id:'2',account:'TFSA',amount:10.02,date:'2026-10-10'},{id:'3',account:'RRSP',amount:15,date:'2026-10-23'},{id:'4',account:'Other Investments',amount:5,date:'2026-10-01'},{id:'5',account:'TFSA',amount:999,date:'2026-11-01'}];
 const a=analyse(b);assert.equal(a.investments,55.03);assert.equal(a.investmentTotals.TFSA,35.03);assert.equal(a.left,158.97);assert.equal(a.expenses,before.expenses);assert.equal(a.savings,before.savings);assert.equal(a.income,before.income);assert.equal(a.excluded,1);assert.equal(a.lowest,-36);
 assert.equal(a.timeline.filter(t=>t.type==='Investment').length,4);assert.equal(a.timeline.filter(t=>t.date==='2026-10-09')[0].type,'Payday');
 b.investments[3].date='2026-10-23';assert.equal(analyse(b).lowest,-31);assert.equal(analyse(b).left,a.left);
});
test('investment plans roundtrip and old plans without investments still open',()=>{
 const b=example();const plan={format:'tfc-budget-lab' as const,version:1 as const,budget:b,original:null,events:[],trades:[],reflection:''};assert.equal(analyse(parsePlan(serializePlan(plan)).budget).investments,0);
 b.investments=[{id:'1',account:'RRSP',amount:42.12,date:b.start}];assert.deepEqual(parsePlan(serializePlan(plan)).budget.investments,b.investments);
 assert.throws(()=>parsePlan(JSON.stringify({...plan,budget:{...b,investments:[{...b.investments![0],amount:-1}]}})));
});
test('Excel preserves original and revised investments, account totals and cash flow',async()=>{
 const original=example();original.investments=[{id:'1',account:'TFSA',amount:20,date:'2026-10-09'}];const revised=structuredClone(original);revised.investments![0].amount=30;
 const book=await workbook(original,revised,[],[],'Saving and investing separately.');const read=new ExcelJS.Workbook();await read.xlsx.load(await book.xlsx.writeBuffer());
 const rows=(name:string)=>read.getWorksheet(name)!.getSheetValues().map(r=>Array.isArray(r)?r.slice(1):[]);
 assert.ok(rows('Comparison').some(r=>r[0]==='Investments'&&r[1]===20&&r[2]===30));
 assert.ok(rows('Revised details').some(r=>r[0]==='Investment'&&r[1]==='TFSA'&&r[3]===30&&r[4]==='2026-10-09'));
 assert.ok(rows('Revised totals').some(r=>r[0]==='Investments total'&&r[1]===30));
 assert.ok(rows('Revised totals').some(r=>r[0]==='Investments · TFSA'&&r[1]===30));
 assert.ok(rows('Revised cash flow').some(r=>r[1]==='Investment'&&r[3]===-30));
});
