import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const moduleUrl=(source)=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const foodUrl=moduleUrl(await fs.readFile(new URL('../lib/foodNutrition.ts',import.meta.url),'utf8'));
const photoSource=(await fs.readFile(new URL('../lib/photoNutrition.ts',import.meta.url),'utf8')).replace('"./foodNutrition"',JSON.stringify(foodUrl));
const {photoDraftFromText,foodFromPhotoDraft}=await import(moduleUrl(photoSource));
const label='TEST CRACKERS\nNUTRITION INFORMATION\nServings per pack: 10\nServing size: 20g (3 crackers)\nPer Serving\tPer 100g\nEnergy\t400 kJ\t2000 kJ\nProtein\t2 g\t10 g\nFat, Total\t4 g\t20 g\nCarbohydrate\t12 g\t60 g';
test('photo OCR draft recognizes product, portion count, grams and both nutrient columns',()=>{
 const d=photoDraftFromText(label,'last');assert.equal(d.name,'TEST CRACKERS');assert.equal(d.grams,'20');assert.equal(d.quantity,'3');assert.equal(d.quantityUnit,'crackers');assert.equal(d.protein,'10');assert.equal(d.servingProtein,'2');
 const food=foodFromPhotoDraft(d,label,'test');assert.equal(food.source,'照片识别');assert.equal(food.serving.quantity,3);assert.equal(food.serving.grams,20);assert.equal(food.serving.servingsPerPack,10);assert.equal(food.labelEvidence,label);
});
test('unclear or missing nutrition stays empty and cannot be silently saved as zero',()=>{
 const d=photoDraftFromText('unreadable label','last');assert.equal(d.protein,'');assert.equal(d.quantity,'');assert.throws(()=>foodFromPhotoDraft(d,'unreadable label','test'));
 const valid=photoDraftFromText(label,'last');valid.quantity='';valid.servingProtein='';const food=foodFromPhotoDraft(valid,label,'test');assert.equal(food.serving.quantity,null);assert.equal(food.serving.protein,null);
});
test('photo draft validates per-100 bounds and accepts true zeros',()=>{
 const d=photoDraftFromText(label,'last');d.fat='101';assert.throws(()=>foodFromPhotoDraft(d,label,'test'));d.fat='0';assert.equal(foodFromPhotoDraft(d,label,'test').fat,0);d.quantityUnit='';assert.throws(()=>foodFromPhotoDraft(d,label,'test'));
});
