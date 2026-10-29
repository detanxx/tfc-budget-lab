import {test} from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {addBudgetTemplate} from '../lib/budget-template.ts';
import {analyse,example} from '../lib/budget.ts';

test('Budget template preserves CSV categories, editable blanks and live formulas through export',async()=>{
 const book=new ExcelJS.Workbook();addBudgetTemplate(book,'Budget Template');
 const loaded=new ExcelJS.Workbook();await loaded.xlsx.load(await book.xlsx.writeBuffer());
 const s=loaded.getWorksheet('Budget Template')!;
 const find=(name:string)=>{let found=0;s.eachRow(r=>{if(r.getCell(1).value===name)found=r.number});assert.ok(found,name);return found;};
 for(const label of ['Part-time job','Allowance','Food & Drinks','Phone / Subscriptions','School Supplies','TFSA','FHSA','RRSP']){
  const n=find(label);assert.equal(s.getCell(`B${n}`).value,null);assert.equal(s.getCell(`C${n}`).value,null);
  assert.equal(s.getCell(`D${n}`).formula,`IF(C${n}="","",B${n}-C${n})`);
 }
 const start=find('Money at the start'),left=find('Money left over');
 assert.equal(s.getCell(`B${left}`).formula,`B${start}+B${start+1}-SUM(B${start+2}:B${left-1})`);
 assert.equal(s.getCell(`B${left}`).result,0);
});

test('Populated budget reconciles savings and investments once, and empty sections do not self-reference',()=>{
 for(const kind of ['job','blank']){
  const b=example(kind);const book=new ExcelJS.Workbook();const s=addBudgetTemplate(book,'Budget',b);
  s.eachRow(r=>{
   if(r.getCell(1).value==='Money left over')assert.equal(r.getCell(2).result,analyse(b).left);
   for(const col of [2,3,4]){const f=r.getCell(col).formula;if(!f)continue;
    for(const m of f.matchAll(/([BC])(\d+):[BC](\d+)/g)){assert.ok(Number(m[2])<=Number(m[3]));assert.ok(Number(m[3])<r.number);}
   }
  });
 }
});
