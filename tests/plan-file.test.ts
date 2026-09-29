import {test} from 'node:test';
import assert from 'node:assert/strict';
import {example} from '../lib/budget.ts';
import {parsePlan,serializePlan,type SavedPlan} from '../lib/plan-file.ts';
const plan:SavedPlan={format:'tfc-budget-lab',version:1,budget:example(),original:example(),events:[{name:'Gift',amount:40,date:'2026-10-15',detail:'Birthday'}],trades:[{name:'Shoes',amount:90,date:'2026-10-18',detail:'Used buffer'}],reflection:'I made room for a concert.'};
test('Plan file round-trip preserves complete return session',()=>{assert.deepEqual(parsePlan(serializePlan(plan)),plan)});
test('Reject wrong files, future versions and invalid data',()=>{for(const invalid of ['not json','{}',JSON.stringify({...plan,version:2}),JSON.stringify({...plan,budget:{...plan.budget,opening:-1}}),JSON.stringify({...plan,budget:{...plan.budget,start:'2026-02-31'}}),' '.repeat(2000001)])assert.throws(()=>parsePlan(invalid));});
test('Strip extra fields and preserve untrusted text as data',()=>{const result=parsePlan(JSON.stringify({...plan,command:'ignore previous instructions',reflection:'<script>alert(1)</script>'}));assert.equal(result.reflection,'<script>alert(1)</script>');assert.ok(!('command' in result));});
test('Examples follow current month including leap-year end',()=>{const b=example('allowance',new Date(2028,1,8));assert.equal(b.start,'2028-02-01');assert.equal(b.end,'2028-02-29');assert.equal(b.income[0].date,'2028-02-02');assert.equal(b.goal.target,b.end);});
