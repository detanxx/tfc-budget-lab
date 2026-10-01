import test from 'node:test';
import assert from 'node:assert/strict';
import {analyse,example} from '../lib/budget.ts';
test('savings are capped after expenses and investments and recover when costs fall',()=>{
 const b=example();b.goal.amount=1000;b.goal.perPayday=1000;
 b.investments=[{id:'i',account:'TFSA',amount:50,date:b.start}];
 let a=analyse(b);assert.equal(a.savingsAvailable,364);assert.equal(a.savings,364);assert.equal(a.left,0);assert.equal(a.goalGap,636);assert.equal(a.savingsLimited,true);
 b.categories[0].items[0].amount+=500;a=analyse(b);assert.equal(a.savings,0);assert.equal(a.left,-136);assert.equal(a.savingsAvailable,0);
 b.categories=[];a=analyse(b);assert.equal(a.savings,650);assert.equal(a.left,0);
});
