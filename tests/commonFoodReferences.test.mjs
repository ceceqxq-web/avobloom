import test from 'node:test';
import assert from 'node:assert/strict';
import {commonFoodReferences} from '../lib/commonFoodReferences.ts';
import {marketDepartment} from '../lib/gardenCategories.ts';
import {initialPortionDraft,selectFoodLabel,updateFoodPortion} from '../lib/foodRecord.ts';
test('lettuce and 生菜 offer the same three explicit varieties without choosing one for the user',()=>{
 const english=commonFoodReferences('lettuce'),chinese=commonFoodReferences('生菜');
 assert.equal(english.length,3);assert.deepEqual(english,chinese);
 for(const food of english){assert.equal(food.source,'通用估算');assert.equal(food.marketDepartmentOverride,'蔬菜');assert.equal(marketDepartment(food.name),'蔬菜');assert.match(food.sourceUrl,/ars\.usda\.gov/);assert.match(food.labelEvidence,/生重可食部分/)}
});
test('specific plain-food aliases narrow the variety, including raw annotations and case',()=>{
 for(const q of ['iceberg lettuce','ICEBERG','球生菜','冰山生菜','iceberg lettuce (raw)'])assert.equal(commonFoodReferences(q)[0].id,'usda-sr28-11252');
 for(const q of ['cos lettuce','romaine','罗马生菜'])assert.equal(commonFoodReferences(q)[0].id,'usda-sr28-11251');
 assert.equal(commonFoodReferences('green leaf lettuce').length,1);
});
test('brands, dressings, cooked dishes, unrelated searches and URLs never silently use a raw lettuce reference',()=>{
 for(const q of ['','Woolworths lettuce 120g','lettuce salad with dressing','cooked lettuce','炒生菜','生菜沙拉','chicken','https://www.woolworths.com.au/shop/productdetails/123'])assert.deepEqual(commonFoodReferences(q),[]);
});
test('preview uses reference nutrition at measured grams without changing source data',()=>{
 const food=commonFoodReferences('iceberg')[0],entry={id:'preview-only',name:'lettuce',date:'2026-11-21',type:'food',meal:'午餐',time:'12:00',amount:50,protein:null,carbs:null,fat:null,energyKcal:null};
 const selected=selectFoodLabel(entry,initialPortionDraft(entry),food),preview=updateFoodPortion(selected.entry,selected.draft);
 assert.equal(preview.amount,50);assert.equal(preview.energyKcal,7);assert.equal(preview.protein,.45);assert.equal(preview.carbs,1.485);assert.equal(preview.fat,.07);assert.equal(entry.foodLabel,undefined);
});
