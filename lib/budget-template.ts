import ExcelJS from 'exceljs';
import {analyse,scheduledIncome,type Budget} from './budget.ts';

// Replace with the TFC template URL when supplied. Until then generate a local workbook.
export const budgetTemplateUrl:string|null=null;
const currency='"CA$"#,##0.00;[Red]("CA$"#,##0.00);"—"';
export function addBudgetTemplate(book:ExcelJS.Workbook,name:string,b?:Budget){
 const s=book.addWorksheet(name);const a=b?analyse(b):null;
 s.columns=[{width:40},{width:19},{width:19},{width:19},{width:46}];
 s.views=[{state:'frozen',ySplit:5,showGridLines:false}];
 s.pageSetup={paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0};
 const banner=(text:string,colour='1A1A57')=>{const r=s.addRow([text]);s.mergeCells(r.number,1,r.number,5);r.height=32;r.getCell(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+colour}};r.getCell(1).font={name:'Calibri',size:16,bold:true,color:{argb:'FFFFFFFF'}};};
 banner('Teen Finance Club • Monthly Budget');
 const note=(text:string)=>{const r=s.addRow([text]);s.mergeCells(r.number,1,r.number,5);r.height=32;};
 note(b?`Plan dates: ${b.start} to ${b.end}. Planned amounts come from your budget; Actual is yours to fill in.`:'Month: __________________   •   All amounts in Canadian dollars');
 note('Fill in Planned before the month, then Actual as you go. White cells are editable; shaded cells calculate automatically.');
 note('Difference = Planned − Actual. A negative difference means Actual is higher. Blank Actual cells mean not entered yet.');
 s.addRow([]);
 const totals:Record<string,number>={};
 function section(title:string,key:string,colour:string,items:[string,number|null][]){
  const h=s.addRow([title,'Planned ($)','Actual ($)',key==='income'?'Difference ($)':'Left Over ($)','Notes']);h.height=32;
  h.eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+colour}};c.font={name:'Calibri',bold:true,color:{argb:'FF1A1A57'}};});
  if(!items.length)items=[['Add your own item',null]];
  const first=s.rowCount+1;
  for(const [label,amount] of items){const r=s.addRow([label,amount,null,null,'']);r.height=28;const n=r.number;
   r.getCell(4).value={formula:`IF(C${n}="","",B${n}-C${n})`};
   for(const col of [2,3])r.getCell(col).dataValidation={type:'decimal',operator:'greaterThanOrEqual',formulae:[0],allowBlank:true,showErrorMessage:true,errorTitle:'Use a positive amount',error:'Enter 0 or more.'};
  }
  const last=s.rowCount;const r=s.addRow(['TOTAL '+title.toUpperCase(),{formula:`SUM(B${first}:B${last})`,result:items.reduce((n,i)=>n+(i[1]||0),0)},{formula:`IF(COUNT(C${first}:C${last})=0,"",SUM(C${first}:C${last}))`},{formula:`IF(C${last+1}="","",B${last+1}-C${last+1})`},'']);
  totals[key]=r.number;r.height=28;r.font={name:'Calibri',bold:true};s.addRow([]);
 }
 section('Money Coming In (Income)','income','6ED9B3',b?scheduledIncome(b).map(i=>[i.name+' · '+i.date,i.amount]):[['Part-time job',null],['Allowance',null],['Gifts / Other',null],['Other income',null],['Other income',null]]);
 section('Money Going Out (Expenses)','expenses','F9735C',b?b.categories.flatMap(c=>c.items.filter(i=>i.date>=b.start&&i.date<=b.end).map(i=>[c.name+' · '+i.name,i.amount] as [string,number])):[['Food & Drinks',null],['Transportation',null],['Entertainment',null],['Clothing',null],['Phone / Subscriptions',null],['School Supplies',null],['Other',null],['Other',null],['Other',null]]);
 section('Savings (pay yourself first)','savings','FCD34D',a?a.goalResults.map(r=>[r.goal.name,r.saved/100]):[['Emergency fund',null],['Laptop',null],['Trip or event',null]]);
 section('Investments','investments','E2E2EB',a?Object.entries(a.investmentTotals).map(([k,v])=>[k,v]):[['TFSA',null],['FHSA',null],['RRSP',null],['Other Investments',null]]);
 banner('What’s Left?');s.addRow(['SUMMARY','Planned ($)','Actual ($)']);
 const opening=s.addRow(['Money at the start',b?.opening??null,null]).number;
 for(const [key,label] of [['income','Total Income'],['expenses','Total Expenses'],['savings','Total Savings'],['investments','Total Investments']])s.addRow([label,{formula:`B${totals[key]}`},{formula:`IF(C${totals[key]}="","",C${totals[key]})`}]);
 const end=s.rowCount;const left=s.addRow(['Money left over',{formula:`B${opening}+B${opening+1}-SUM(B${opening+2}:B${end})`,result:a?.left??0},{formula:`IF(COUNT(C${opening}:C${end})=0,"",C${opening}+C${opening+1}-SUM(C${opening+2}:C${end}))`}]);left.font={bold:true};
 s.addRow([]);note('Savings and investments are set aside from spending money. Each amount is counted once. Actual totals reflect only the amounts you have entered.');
 note('Tip: Give every dollar a job—spending, saving, investing, or keeping a cushion for surprises. Choose a savings amount that fits your situation.');
 s.eachRow(r=>r.eachCell({includeEmpty:true},(c,col)=>{c.alignment={vertical:'middle',wrapText:true};c.font={name:'Calibri',size:11,color:{argb:'FF1A1A57'},...c.font};if(col>=2&&col<=4)c.numFmt=currency;if(c.type===ExcelJS.ValueType.Formula)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFBF6EE'}};}));
 return s;
}
export async function downloadTemplate(){const book=new ExcelJS.Workbook();book.creator='Teen Finance Club';book.calcProperties.fullCalcOnLoad=true;addBudgetTemplate(book,'Budget Template');await downloadWorkbook(book,'TFC-Monthly-Budget-Template.xlsx');}
export async function downloadWorkbook(book:ExcelJS.Workbook,filename:string){const data=await book.xlsx.writeBuffer();const url=URL.createObjectURL(new Blob([data as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
