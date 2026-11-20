import test from 'node:test';import assert from 'node:assert/strict';
import {gardenFoods,gardenRecord} from '../lib/foodGarden.ts';
import {validateHealthData,emptyHealthData} from '../lib/health/data.ts';
import {mergeLibraryFood} from '../lib/foodLibrary.ts';
test('picture portions scale nutrition and survive validation without altering their template',()=>{
 const f=gardenFoods([],[]).find(f=>f.id==='garden-egg'),e=gardenRecord(f,2,'2026-11-17','早餐');
 assert.equal(e.amount,100);assert.equal(e.energyKcal,155);assert.equal(e.portionSpec.amount,50);assert.equal(e.servings,2);validateHealthData({...emptyHealthData(),entries:[e]});assert.equal(f.amount,50);
});
test('unknown historical nutrients stay unknown; repeated picks do not duplicate old ids or plan keys',()=>{
 const original={id:'original',date:'2026-11-15',time:'09:00',type:'food',name:'食物',meal:'早餐',amount:0,weightUnknown:true,energyKcal:33,protein:null,carbs:null,fat:null,quantityText:'1块',planImportKey:'old'};
 const f=gardenFoods([original],[])[0],a=gardenRecord(f,2,'2026-11-17','午餐'),b=gardenRecord(f,2,'2026-11-17','午餐');assert.equal(a.energyKcal,66);assert.equal(a.protein,null);assert.equal(a.foodLabel,undefined);assert.notEqual(a.id,b.id);assert.equal(a.planImportKey,undefined);validateHealthData({...emptyHealthData(),entries:[a]});
});
test('favorite and daily list preferences survive new product nutrition imports',()=>{
 const f=gardenFoods([],[])[0].label,merged=mergeLibraryFood({...f,pinned:true,dailyPick:true},{...f,energyKcal:160});assert.equal(merged.pinned,true);assert.equal(merged.dailyPick,true);assert.equal(merged.energyKcal,160);assert.throws(()=>gardenRecord(gardenFoods([],[])[0],NaN,'2026-11-17','早餐'));
});

test('favoriting and reusing a starter never changes its reference serving',()=>{
 const f=gardenFoods([],[]).find(f=>f.id==='garden-egg'),saved={...f.label,pinned:true},first=gardenRecord(f,2,'2026-11-17','早餐');
 const next=gardenFoods([first],[saved]).find(f=>f.id==='garden-egg');assert.equal(next.amount,50);assert.equal(gardenRecord(next,2,'2026-11-17','早餐').energyKcal,155);assert.equal(next.frequency,1);
});
