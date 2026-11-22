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

test('editing one serving persists grams and scales saved nutrition without changing serving count',async()=>{
 const {withMarketServing}=await import('../lib/marketCatalog.ts');
 const egg=gardenFoods([],[]).find(f=>f.id==='garden-egg');
 const label=withMarketServing(egg,30);
 const next=prepareMarketFoods(gardenFoods([],[label])).find(f=>f.id===egg.id);
 assert.equal(next.amount,30);assert.equal(next.label.serving.quantitySource,'manual');
 const record=gardenRecord(next,2,'2026-11-20','早餐');
 assert.equal(record.servings,2);assert.equal(record.amount,60);assert.equal(record.energyKcal,93);assert.equal(record.portionSpec.amount,30);
 assert.equal(egg.amount,50);
 for(const invalid of [0,-1,NaN,Infinity,10001])assert.throws(()=>withMarketServing(egg,invalid));
 const milk=gardenFoods([],[]).find(f=>f.id==='garden-milk');
 assert.equal(withMarketServing(milk,200).serving.millilitres,200);assert.equal(withMarketServing(milk,200).serving.grams,null);
 assert.throws(()=>withMarketServing({...egg,template:{weightUnknown:true}},30));
});

test('raw and cooked chicken breast remain distinct shelf choices',()=>{const foods=prepareMarketFoods(gardenFoods([],[]));const raw=foods.find(f=>f.id==='garden-chicken-raw'),cooked=foods.find(f=>f.id==='garden-chicken');assert.ok(raw);assert.ok(cooked);assert.match(raw.name,/生重/);assert.equal(raw.label.protein,22.5);assert.equal(cooked.label.protein,31);assert.notEqual(raw.id,cooked.id)});

test('a confirmed label rename remains findable on the shelf without changing the old record',()=>{const egg=gardenFoods([],[]).find(f=>f.id==='garden-egg');const product={...egg,id:'brand-original',name:'Old label name',label:{...egg.label,id:'brand-original',name:'Old label name',source:'Woolworths'}};const entry=gardenRecord(product,1,'2026-11-22','早餐');const renamed={...product.label,name:'Updated food label',hiddenInKitchen:false,serving:{grams:50,quantitySource:'manual'}};const next=prepareMarketFoods(gardenFoods([entry],[renamed])).find(f=>f.id===renamed.id);assert.equal(next.name,'Updated food label');assert.equal(next.label.hiddenInKitchen,false);assert.equal(entry.name,'Old label name')});
