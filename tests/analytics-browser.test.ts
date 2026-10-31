// Exercise the real browser adapter without contacting Google or sending test traffic.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
async function browser(deployment='production',hostname='tools.teenfinanceclub.com',existing=false){
 const result=await build({entryPoints:['app/analytics.ts'],bundle:true,write:false,format:'iife',globalName:'adapter',define:{'import.meta.env':JSON.stringify({PROD:true,VITE_GA4_MEASUREMENT_ID:'G-TEST123'}),'__TFC_DEPLOYMENT_ENV__':JSON.stringify(deployment)}});
 const scripts:unknown[]=[],listeners:Record<string,()=>void>={};let cookie='';
 const document={get cookie(){return cookie},set cookie(value:string){cookie=value.split(';')[0]},querySelector:()=>existing?{}:null,createElement:()=>({}),head:{appendChild:(s:unknown)=>scripts.push(s)}};
 const window:Record<string,unknown>={addEventListener:(name:string,f:()=>void)=>{listeners[name]=f},dispatchEvent:()=>{}};
 const context=vm.createContext({window,document,location:{hostname,protocol:'https:',origin:'https://'+hostname,pathname:'/',search:'?income=99999',hash:'#private'},history:{pushState(){},replaceState(){}},Event:class{},console});
 vm.runInContext(result.outputFiles[0].text,context);
 return {scripts,window,context,document,adapter:context.adapter,commands:()=>Array.from((window.dataLayer||[]) as ArrayLike<unknown>).map(a=>Array.from(a as ArrayLike<unknown>))};
}
test('browser adapter has no pre-consent script; one config and script after repeated opt-in',async()=>{
 const f=await browser();f.adapter.analytics.page('/budget-lab');assert.equal(f.scripts.length,0);
 f.adapter.setAnalyticsConsent('granted');f.adapter.setAnalyticsConsent('granted');f.adapter.analytics.page('/budget-lab');
 assert.equal(f.scripts.length,1);const configs=f.commands().filter(c=>c[0]==='config');assert.equal(configs.length,1);
 const config=configs[0][2] as Record<string,unknown>;assert.equal(config.send_page_view,false);assert.equal(config.cookie_domain,'auto');assert.equal(config.allow_google_signals,false);
 assert.equal(f.commands().filter(c=>c[1]==='page_view').length,1);
 assert.ok(!JSON.stringify(f.commands()).includes('99999'));assert.ok(!JSON.stringify(f.commands()).includes('#private'));
});
test('browser adapter blocks preview, localhost, and an existing Google installation',async()=>{
 for(const args of [['preview','tools.teenfinanceclub.com',false],['production','localhost',false],['production','tools.teenfinanceclub.com',true]] as const){
  const f=await browser(args[0],args[1],args[2]);f.adapter.analytics.page('/budget-lab');f.adapter.setAnalyticsConsent('granted');assert.equal(f.scripts.length,0);assert.equal(f.commands().length,0);
 }
});
test('withdrawal sets GA kill switch and denies consent without further custom events',async()=>{
 const f=await browser();f.adapter.analytics.page('/budget-lab');f.adapter.setAnalyticsConsent('granted');f.adapter.setAnalyticsConsent('denied');
 assert.equal(f.window['ga-disable-G-TEST123'],true);const before=f.commands().length;f.adapter.analytics.start('budget_lab');f.adapter.analytics.page('/budget-lab/first-plan');assert.equal(f.commands().length,before);
 assert.equal((f.commands().at(-1)?.[2] as Record<string,string>).analytics_storage,'denied');
});
test('browser history transitions between tools trigger tracking without reloads',async()=>{
 const f=await browser();f.adapter.analytics.page('/budget-lab');f.adapter.setAnalyticsConsent('granted');
 f.context.location.pathname='/invest-lab';f.context.history.pushState({},'','/invest-lab');f.context.history.replaceState({},'','/invest-lab');
 f.context.location.pathname='/budget-lab';f.context.history.pushState({},'','/budget-lab');
 assert.equal(f.scripts.length,1);assert.equal(f.commands().filter(c=>c[1]==='page_view').length,3);assert.equal(f.commands().filter(c=>c[1]==='tool_opened').length,3);
});
