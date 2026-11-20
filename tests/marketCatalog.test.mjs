import test from 'node:test';import assert from 'node:assert/strict';import {gardenFoods,gardenRecord} from '../lib/foodGarden.ts';import {prepareMarketFoods,foodBadges,marketPortionText} from '../lib/marketCatalog.ts';
test('ordinary duplicate egg cards collapse and use one egg plus corresponding grams and energy',()=>{
 const egg=gardenFoods([],[]).find(f=>f.id==='garden-egg'),old=gardenRecord(egg,4,'2026-11-17','早餐');old.name='鸡蛋';old.foodLabel=undefined;
 const foods=prepareMarketFoods(gardenFoods([old],[])),matches=foods.filter(f=>/^(水煮)?鸡蛋$/.test(f.name));assert.equal(matches.length,1);const f=matches[0];assert.equal(f.amount,50);assert.equal(gardenRecord(f,2,'2026-11-17','午餐').energyKcal,155);assert.equal(marketPortionText(f,2),'约2个');assert.ok(foodBadges(f).includes('蛋白'));
});
test('label serving beats defaults and different products or raw/cooked rice remain separate',()=>{
 const base=gardenFoods([],[]).find(f=>f.id==='garden-milk');const a={...base,id:'one',name:'Brand Milk 1L',label:{...base.label,id:'one',source:'Woolworths',sourceUrl:'https://www.woolworths.com.au/shop/productdetails/111',serving:{grams:null,millilitres:200,quantity:1,quantityUnit:'杯'}}};const b={...a,id:'two',label:{...a.label,id:'two',sourceUrl:'https://www.woolworths.com.au/shop/productdetails/222'}};
 const foods=prepareMarketFoods([a,b]);assert.equal(foods.length,2);assert.equal(foods[0].amount,200);assert.match(foods[0].caption,/1杯/);
 const rice=gardenFoods([],[]).find(f=>f.id==='garden-rice');assert.equal(prepareMarketFoods([{...rice,id:'raw',name:'大米（生重）'},rice]).length,2);
});

test('market orders foods by recorded frequency and preserves manual department choice',()=>{const foods=gardenFoods([],[]);const egg=foods.find(f=>f.id==='garden-egg'),tofu=foods.find(f=>f.id==='garden-tofu');const list=prepareMarketFoods([{...egg,frequency:1},{...tofu,frequency:4,label:{...tofu.label,marketDepartmentOverride:'豆制品'}}]);assert.equal(list[0].id,tofu.id);assert.equal(list[0].label.marketDepartmentOverride,'豆制品')});

test('selected pumpkin quantity is a total, not a per-tap instruction',()=>{
 const base=gardenFoods([],[])[0];
 const pumpkin={...base,id:'test-pumpkin',name:'南瓜',amount:100,caption:'1块（每次点选）',template:undefined,label:{...base.label,id:'test-pumpkin',name:'南瓜',energyKcal:26,protein:1,carbs:6,fat:.1,serving:{grams:100,quantity:1,quantityUnit:'块'}}};
 assert.equal(marketPortionText(pumpkin,1),'1块（每次点选）');assert.equal(marketPortionText(pumpkin,4),'4块（已选合计）');
 const selected=gardenRecord(pumpkin,4,'2026-11-20','午餐');assert.equal(selected.amount,400);assert.equal(selected.energyKcal,104);
});
