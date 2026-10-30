import ExcelJS from 'exceljs';
import {addBudgetTemplate} from './budget-template.ts';
import {analyse,type Budget,type Log} from './budget.ts';
export async function workbook(original:Budget,revised:Budget,events:Log[],trades:Log[],reflection:string){
 const book=new ExcelJS.Workbook();book.creator='Teen Finance Club';book.subject='TFC Budget Lab budget planner';
 book.calcProperties.fullCalcOnLoad=true;
 addBudgetTemplate(book,'Budget Template');
 addBudgetTemplate(book,'Original budget',original);
 const revisedSheet=addBudgetTemplate(book,'Revised budget',revised);
 // Keep the learner's context with their revised plan, without extra tabs.
 const note=(title:string,text:string)=>{const row=revisedSheet.addRow([title,null,null,null,text]);row.height=Math.max(32,Math.ceil(text.length/45)*15);row.getCell(1).font={bold:true,color:{argb:'FF1A1A57'}};row.eachCell(c=>{c.alignment={vertical:'top',wrapText:true};});};
 if(events.length||trades.length||reflection)revisedSheet.addRow([]);
 events.forEach(e=>note('Surprise · '+e.name,`${e.date} · CA$${e.amount.toFixed(2)} · ${e.detail}`));
 trades.forEach(t=>note('Choice · '+t.name,`${t.date} · CA$${t.amount.toFixed(2)} · ${t.detail}`));
 if(reflection)note('What did you change, and why?',reflection);
 const cash=book.addWorksheet('Cashflow');
 cash.columns=[{width:16},{width:16},{width:18},{width:48},{width:20},{width:22},{width:18}];
 cash.views=[{state:'frozen',ySplit:2,showGridLines:false}];
 cash.mergeCells('A1:G1');cash.getCell('A1').value='Cash flow • CAD • Income arrives first on the same date. Savings and investments reduce spendable cash.';cash.getRow(1).height=36;
 cash.addRow(['Budget','Date','Type','Description','In / out (CAD)','Money available (CAD)','Next payday']);
 for(const [label,b] of [['Original',original],['Revised',revised]] as const){
  cash.addRow([label,b.start,'Starting cash','Money available at the start',0,b.opening,'']);
  analyse(b).timeline.forEach(t=>cash.addRow([label,t.date,t.type,t.name,t.amount*(t.type==='Payday'?1:-1),t.balance,t.nextPayday||'None entered']));
 }
 cash.autoFilter={from:'A2',to:`G${cash.rowCount}`};
 cash.eachRow((r,n)=>{r.height=n===1?36:30;r.eachCell(c=>{c.font={name:'Calibri',size:11,color:{argb:'FF1A1A57'}};c.alignment={vertical:'middle',wrapText:true};if(n<=2){c.font={...c.font,bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1A1A57'}};}else if(n%2===0)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFBF6EE'}};});if(n>2)for(const col of [5,6])r.getCell(col).numFmt='"CA$"#,##0.00;[Red]-"CA$"#,##0.00';});
 return book;
}
export async function exportBudget(original:Budget,revised:Budget,events:Log[],trades:Log[],reflection:string){const book=await workbook(original,revised,events,trades,reflection);const data=await book.xlsx.writeBuffer();const url=URL.createObjectURL(new Blob([data as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download='TFC-Budget-Lab.xlsx';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
