import test from 'node:test';
import assert from 'node:assert/strict';
import {analyse,example,incomeDates} from '../lib/budget.ts';
import {parsePlan,serializePlan} from '../lib/plan-file.ts';
import {workbook} from '../lib/export.ts';
test('weekly and biweekly generate real dates and recompute savings and available money',()=>{
 const b=example('blank');b.categories=[];b.goal.amount=200;b.income=[{id:'a',name:'Pay',amount:100,date:'2026-10-01',cadence:'weekly'}];b.goal.perPayday=20;
 assert.deepEqual(analyse(b).paydays,['2026-10-01','2026-10-08','2026-10-15','2026-10-22','2026-10-29']);assert.equal(analyse(b).income,500);assert.equal(analyse(b).savings,100);assert.equal(analyse(b).left,400);
 b.income[0].cadence='biweekly';assert.equal(analyse(b).income,300);assert.equal(analyse(b).required,66.67);assert.equal(analyse(b).left,240);
 b.start='2026-10-10';assert.deepEqual(analyse(b).paydays,['2026-10-15','2026-10-29']);assert.equal(analyse(b).excluded,0);
});
test('twice monthly differs from biweekly and monthly keeps its anchor through February',()=>{
 const b=example('blank');b.start='2028-01-01';b.end='2028-03-31';const i={id:'a',name:'Pay',amount:100,date:'2028-01-31',cadence:'monthly' as const};assert.deepEqual(incomeDates(b,i),['2028-01-31','2028-02-29','2028-03-31']);
 assert.deepEqual(incomeDates(b,{...i,date:'2028-02-02',cadence:'twice-monthly'}),['2028-02-16','2028-03-01','2028-03-16']);assert.deepEqual(incomeDates(b,{...i,date:'',cadence:'weekly'}),[]);
});
test('cadence survives saving and exports rules and generated payments with original comparison',async()=>{
 const b=example('blank');b.categories=[];b.goal.amount=200;b.income=[{id:'a',name:'Pay',amount:100,date:'2026-10-01',cadence:'biweekly'}];const original=structuredClone(b);b.income[0].cadence='weekly';
 const plan={format:'tfc-budget-lab' as const,version:1 as const,budget:b,original,events:[],trades:[],reflection:''};assert.deepEqual(parsePlan(serializePlan(plan)),plan);
 const book=await workbook(original,b,[],[],'');assert.equal(book.getWorksheet('Revised income schedules')!.getCell('D2').value,'weekly');assert.equal(book.getWorksheet('Revised details')!.rowCount,6);assert.equal(book.getWorksheet('Comparison')!.getCell('B2').value,300);assert.equal(book.getWorksheet('Comparison')!.getCell('C2').value,500);
});
