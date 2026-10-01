import test from 'node:test';
import assert from 'node:assert/strict';
import {analyse,example,monthlyBreakdown} from '../lib/budget.ts';
import {parsePlan,serializePlan} from '../lib/plan-file.ts';
import {workbook} from '../lib/export.ts';
test('multiple goals share available money without double counting',()=>{
 const b=example('blank');b.opening=100;b.goals=[{id:'a',name:'Laptop',amount:500,saved:0,target:b.end,perPayday:70,date:b.start,cadence:'once'},{id:'b',name:'Trip',amount:200,saved:0,target:b.end,perPayday:70,date:b.start,cadence:'once'}];
 const a=analyse(b);assert.equal(a.savings,100);assert.equal(a.goalResults[0].saved,7000);assert.equal(a.goalResults[1].saved,3000);assert.equal(a.left,0);
});
test('recurrences end inclusively, monthly balances carry, and plans export schedules',async()=>{
 const b=example('blank');b.end='2026-12-31';b.opening=1000;b.categories=[];
 b.goals=[{id:'a',name:'Laptop',amount:500,saved:0,target:b.end,perPayday:40,date:'2026-10-10',cadence:'monthly',endDate:'2026-11-10'}];
 b.investments=[{id:'i',account:'TFSA',amount:20,date:'2026-10-15',cadence:'monthly',endDate:'2026-11-15'}];
 const a=analyse(b);assert.equal(a.savings,80);assert.equal(a.investments,40);assert.equal(a.left,880);
 const months=monthlyBreakdown(b);assert.deepEqual(months.map(m=>m.opening),[1000,940,880]);assert.deepEqual(months.map(m=>m.left),[940,880,880]);
 const plan={format:'tfc-budget-lab' as const,version:1 as const,budget:b,original:null,events:[],trades:[],reflection:''};assert.deepEqual(parsePlan(serializePlan(plan)),plan);
 const book=await workbook(b,b,[],[],'');assert.equal(book.getWorksheet('Revised monthly')!.getCell('G3').value,880);assert.equal(book.getWorksheet('Revised goal')!.getCell('H2').value,'2026-11-10');
});
