/** Framework-independent, allowlisted GA4 client. Never pass budget data here. */
export type Consent = 'granted' | 'denied' | 'unknown';
export type ToolName = 'budget_lab' | 'invest_lab' | 'compound_lab' | 'cash_flow_lab';
export type Screen = {tool:ToolName; path:string; title:string};
export const screens:Record<string,Screen> = {
 '/budget-lab':{tool:'budget_lab',path:'/budget-lab',title:'Budget Lab — Set up'},
 '/budget-lab/first-plan':{tool:'budget_lab',path:'/budget-lab/first-plan',title:'Budget Lab — First plan'},
 '/budget-lab/surprise':{tool:'budget_lab',path:'/budget-lab/surprise',title:'Budget Lab — Surprise'},
 '/budget-lab/revise':{tool:'budget_lab',path:'/budget-lab/revise',title:'Budget Lab — Revise'},
 '/budget-lab/reflect':{tool:'budget_lab',path:'/budget-lab/reflect',title:'Budget Lab — Reflect'},
 '/invest-lab':{tool:'invest_lab',path:'/invest-lab',title:'Invest Lab'},
 '/invest-lab/accounts':{tool:'invest_lab',path:'/invest-lab/accounts',title:'Invest Lab — Accounts'},
 '/invest-lab/holdings':{tool:'invest_lab',path:'/invest-lab/holdings',title:'Invest Lab — Holdings'},
 '/compound-lab':{tool:'compound_lab',path:'/compound-lab',title:'Compound Lab'},
 '/compound-lab/compare':{tool:'compound_lab',path:'/compound-lab/compare',title:'Compound Lab — Compare'},
 '/cash-flow-lab':{tool:'cash_flow_lab',path:'/cash-flow-lab',title:'Cash Flow Lab'},
 '/cash-flow-lab/timing':{tool:'cash_flow_lab',path:'/cash-flow-lab/timing',title:'Cash Flow Lab — Timing'},
};
export function eligible(config:{production:boolean;deployment:string;id:string;hostname:string;protocol:string}) {
 return config.production && config.deployment==='production' && /^G-[A-Z0-9]+$/.test(config.id) && config.protocol==='https:' && ['tools.teenfinanceclub.com','tfc-budget-lab.vercel.app'].includes(config.hostname);
}
export type AnalyticsPort = {
 initialize:(screen:Screen)=>boolean;
 consent:(granted:boolean)=>void;
 send:(name:string,params:Record<string,string>)=>void;
};
export function createAnalytics(port:AnalyticsPort, enabled:boolean) {
 let choice:Consent='unknown', initialized=false, current:Screen|undefined, lastPage='', lastTool:ToolName|undefined;
 const runs=new Map<ToolName,{started:boolean;completed:boolean}>();
 function flush(){
  if(!enabled||choice!=='granted'||!current)return;
  if(!initialized){if(!port.initialize(current))return;initialized=true;}
  if(lastPage!==current.path){
   port.send('page_view',{page_path:current.path,page_title:current.title,tool_name:current.tool});lastPage=current.path;
  }
  if(lastTool!==current.tool){port.send('tool_opened',{tool_name:current.tool});lastTool=current.tool;}
 }
 function event(name:string,tool:ToolName){if(enabled&&initialized&&choice==='granted')port.send(name,{tool_name:tool});}
 return {
  page(path:string){const next=screens[path];if(!next)return;current=next;flush();},
  setConsent(next:Consent){if(next===choice)return;choice=next;if(initialized)port.consent(next==='granted');flush();},
  start(tool:ToolName){if(!Object.values(screens).some(s=>s.tool===tool)||runs.get(tool)?.started)return;runs.set(tool,{started:true,completed:false});event('simulation_started',tool);},
  complete(tool:ToolName){const run=runs.get(tool);if(!run?.started||run.completed)return;run.completed=true;event('simulation_completed',tool);},
  reset(tool:ToolName){if(!runs.get(tool)?.started)return;event('simulation_reset',tool);runs.delete(tool);},
 };
}
