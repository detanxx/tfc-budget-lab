import {z} from 'zod';
import {investmentAccounts,type Budget,type Log} from './budget.ts';
const text=z.string().max(10000);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T12:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v;});
const amount=z.number().finite().min(0).max(10000000);
const item=z.object({id:z.string().max(100),name:text,amount,date});
const budget=z.object({start:date,end:date,opening:amount,investments:z.array(z.object({id:z.string().max(100),account:z.enum(investmentAccounts),amount,date})).max(1000).optional(),income:z.array(item).max(1000),categories:z.array(z.object({id:z.string().max(100),name:text,items:z.array(item).max(1000)})).max(100),goal:z.object({name:text,amount,saved:amount,target:date,perPayday:amount})}).refine(b=>b.start<=b.end,'Period end must follow start');
const log=z.object({name:text,amount:z.number().finite().min(-10000000).max(10000000),date,detail:text});
const schema=z.object({format:z.literal('tfc-budget-lab'),version:z.literal(1),budget,original:budget.nullable(),events:z.array(log).max(1000),trades:z.array(log).max(1000),reflection:text});
export type SavedPlan={format:'tfc-budget-lab';version:1;budget:Budget;original:Budget|null;events:Log[];trades:Log[];reflection:string};
export function parsePlan(source:string):SavedPlan{if(source.length>2000000)throw new Error('File too large');return schema.parse(JSON.parse(source));}
export function serializePlan(plan:SavedPlan){return JSON.stringify(schema.parse(plan),null,2);}
export function savePlan(plan:SavedPlan){const url=URL.createObjectURL(new Blob([serializePlan(plan)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='TFC-My-Plan.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
