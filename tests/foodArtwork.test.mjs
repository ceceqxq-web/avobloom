import test from 'node:test';
import assert from 'node:assert/strict';
import {foodArtwork} from '../lib/foodArtwork.ts';
import {beefFatTier} from '../lib/meatVisual.ts';
import {gardenFoods,gardenRecord} from '../lib/foodGarden.ts';
import {prepareMarketFoods} from '../lib/marketCatalog.ts';
import {marketDepartment} from '../lib/gardenCategories.ts';
import {mergeLibraryFood} from '../lib/foodLibrary.ts';

test('beef fat tiers use per-100g fat, including exact boundaries',()=>{
 for(const [fat,tier] of [[0,'lean'],[10,'lean'],[10.01,'medium'],[18,'medium'],[20,'medium'],[20.01,'fatty']])assert.equal(beefFatTier('Beef steak',fat),tier);
 assert.equal(foodArtwork('Lean beef',18).cell,1);assert.equal(foodArtwork('Beef',25).cell,2);
 assert.equal(beefFatTier('Beef 18% fat'),'medium');assert.equal(beefFatTier('牛肉'),null);
});
test('specific pantry items cannot fall through to almonds or an unrelated meal',()=>{
 for(const [name,cell] of [['芒果',0],['Woolworths BBQ 花生',1],['Woolworths BBQ mixed nuts',5],['橄榄油',3],['H2Coco 100% Natural Pure Coconut Water',4],['年糕',14]])assert.deepEqual(foodArtwork(name),{cell,atlas:4});
 assert.equal(foodArtwork('未知食品'),null);assert.equal(marketDepartment('蚬子'),'海鲜');assert.equal(marketDepartment('H2Coco Coconut Water'),'饮品');
});
test('new animal foods keep editable edible serving weights through shelf normalization',()=>{
 const foods=prepareMarketFoods(gardenFoods([],[]));
 for(const id of ['clams','basa','chicken-wing','chicken-leg','whole-chicken','pork-tenderloin','pork-ribs','pork-belly','beef-medium','beef-fatty']){
  const f=foods.find(f=>f.id==='garden-'+id);assert.ok(f,id);assert.ok(f.label.energyKcal>0);assert.ok(f.label.labelEvidence);assert.equal(f.amount,f.label.serving.grams);
  const e=gardenRecord(f,2,'2026-11-17','午餐');assert.equal(e.amount,f.amount*2);assert.ok(Math.abs(e.energyKcal-f.label.energyKcal*f.amount/100*2)<.01);
 }
});
test('hiding a shelf food survives a fresh label import and can be restored',()=>{
 const f=gardenFoods([],[]).find(f=>f.id==='garden-egg').label;
 const hidden=mergeLibraryFood({...f,hiddenInKitchen:true},f);assert.equal(hidden.hiddenInKitchen,true);
 assert.equal(mergeLibraryFood(hidden,{...f,hiddenInKitchen:false}).hiddenInKitchen,false);
 const shelf=prepareMarketFoods(gardenFoods([],[hidden]));assert.equal(shelf.find(f=>f.id===f.label.id&&f.id==='garden-egg').label.hiddenInKitchen,true);
});

test('imported foods get specific illustrations before broad food-name rules',()=>{
 for(const [name,cell] of [['Woolworths Ricotta Light Cheese 375g',0],['Colby Cheese',1],['Woolworths Chickpeas 420g',2],['UFC Canned Bean Sprouts 410g',3],['Woolworths Australian Wheat Bran 500g',4],['Macro Organic Wholemeal Spirals 500g',5],['螺旋意大利面（熟，碗装）',5],['小麦面粉',6]])assert.deepEqual(foodArtwork(name),{cell,atlas:5});
 assert.equal(marketDepartment('UFC Canned Bean Sprouts'),'蔬菜');assert.equal(marketDepartment('Ricotta Cheese'),'蛋奶');assert.equal(marketDepartment('Australian Wheat Bran'),'米面主食');
 assert.deepEqual(foodArtwork('Doritos Corn Chips Cheese Supreme'),{cell:9,atlas:2});assert.equal(marketDepartment('Doritos Corn Chips Cheese Supreme'),'米面主食');
});
test('unknown foods have a neutral fallback; category guesses stay distinguishable from exact matches',async()=>{
 const {fallbackFoodArtwork}=await import('../lib/foodArtwork.ts');
 assert.equal(foodArtwork('未知食品'),null);assert.deepEqual(fallbackFoodArtwork('未知食品'),{cell:12,atlas:5});
 assert.deepEqual(fallbackFoodArtwork('自定义食品','豆制品'),{cell:7,atlas:5});
});

test('pumpkin names resolve to a pumpkin rather than the neutral grocery basket',()=>{
 for(const name of ['南瓜','蒸南瓜','Woolworths Japanese Pumpkin','Butternut pumpkin','Kabocha'])assert.equal(foodArtwork(name)?.src,'/brand/watercolor-pumpkin-v1.png');
 assert.notEqual(foodArtwork('南瓜子')?.src,'/brand/watercolor-pumpkin-v1.png');
 assert.notEqual(foodArtwork('Pumpkin seeds')?.src,'/brand/watercolor-pumpkin-v1.png');
});
