import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnalytics,eligible} from '../lib/analytics.ts';
function fixture(enabled=true){
 const events:{name:string;params:Record<string,string>}[]=[],consents:boolean[]=[];let loads=0;
 const client=createAnalytics({initialize:()=>{loads++;return true},consent:v=>consents.push(v),send:(name,params)=>events.push({name,params})},enabled);
 return {client,events,consents,loads:()=>loads};
}
test('only trusted production deployment with a valid ID is eligible',()=>{
 const config={production:true,deployment:'production',id:'G-552JP2ZLZH',hostname:'tools.teenfinanceclub.com',protocol:'https:'};
 assert.equal(eligible(config),true);
 for(const overrides of [{production:false},{deployment:'preview'},{deployment:'development'},{id:''},{id:'GTM-ABC'},{hostname:'localhost'},{hostname:'127.0.0.1'},{hostname:'tfc-budget-branch.vercel.app'},{protocol:'file:'}])assert.equal(eligible({...config,...overrides}),false);
});
test('unknown/refused consent sends nothing; accepting records current screen only',()=>{
 const f=fixture();f.client.page('/budget-lab');f.client.start('budget_lab');f.client.page('/budget-lab/first-plan');f.client.setConsent('denied');assert.equal(f.loads(),0);assert.equal(f.events.length,0);
 f.client.setConsent('granted');assert.equal(f.loads(),1);assert.deepEqual(f.events.map(e=>e.name),['page_view','tool_opened']);assert.equal(f.events[0].params.page_path,'/budget-lab/first-plan');
});
test('repeat renders and repeated consent do not initialize or record twice',()=>{
 const f=fixture();f.client.setConsent('granted');for(let i=0;i<3;i++){f.client.page('/budget-lab');f.client.setConsent('granted');}
 assert.equal(f.loads(),1);assert.equal(f.events.length,2);
 f.client.page('/budget-lab/first-plan');f.client.page('/budget-lab');assert.equal(f.events.filter(e=>e.name==='page_view').length,3);assert.equal(f.events.filter(e=>e.name==='tool_opened').length,1);
});
test('SPA tool changes get one page view and tool_opened; unknown URLs ignored',()=>{
 const f=fixture();f.client.setConsent('granted');f.client.page('/budget-lab');f.client.page('/invest-lab');f.client.page('/invest-lab');f.client.page('/invest-lab/accounts');f.client.page('/private/person@example.com');
 assert.equal(f.events.filter(e=>e.name==='tool_opened').length,2);assert.equal(f.events.filter(e=>e.name==='page_view').length,3);
});
test('simulation events come from explicit actions and complete once per run',()=>{
 const f=fixture();f.client.setConsent('granted');f.client.page('/budget-lab');f.client.complete('budget_lab');f.client.reset('budget_lab');
 f.client.start('budget_lab');f.client.start('budget_lab');f.client.complete('budget_lab');f.client.complete('budget_lab');f.client.reset('budget_lab');f.client.reset('budget_lab');f.client.start('budget_lab');
 assert.deepEqual(f.events.filter(e=>e.name.startsWith('simulation')).map(e=>e.name),['simulation_started','simulation_completed','simulation_reset','simulation_started']);
 assert.ok(f.events.filter(e=>e.name!=='page_view').every(e=>JSON.stringify(e.params)==='{"tool_name":"budget_lab"}'));
});
test('withdrawal stops subsequent events and no historical actions replay on reaccept',()=>{
 const f=fixture();f.client.setConsent('granted');f.client.page('/budget-lab');f.client.setConsent('denied');f.client.start('budget_lab');f.client.complete('budget_lab');assert.equal(f.events.length,2);
 f.client.setConsent('granted');assert.equal(f.events.length,2);assert.equal(f.loads(),1);assert.deepEqual(f.consents,[false,true]);
});
test('disabled environments cannot initialize even after explicit opt-in',()=>{
 const f=fixture(false);f.client.setConsent('granted');f.client.page('/budget-lab');f.client.start('budget_lab');assert.equal(f.loads(),0);assert.equal(f.events.length,0);
});
test('existing external tag blocks initialization rather than duplicating events',()=>{
 let sends=0;const c=createAnalytics({initialize:()=>false,consent:()=>{},send:()=>sends++},true);c.setConsent('granted');c.page('/budget-lab');c.start('budget_lab');assert.equal(sends,0);
});
