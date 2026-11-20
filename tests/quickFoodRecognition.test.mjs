import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizeQuickFoods} from '../lib/quickFoodRecognition.ts';
test('recognizes orange natural language with editable, explicitly estimated nutrition',()=>{
 const [food]=recognizeQuickFoods('1个橙子');assert.equal(food.name,'橙子');assert.equal(food.quantityText,'1个');assert.equal(food.amount,131);assert.equal(food.energyKcal,61.57);assert.match(food.recordNote,/估算/);
});
test('recognizes prefixes, suffixes, Chinese numbers and fractional portions',()=>{
 const items=recognizeQuickFoods('两个鸡蛋\n橙子1个\n半根香蕉\n1/2个苹果');assert.equal(items[0].quantityText,'2个');assert.equal(items[1].name,'橙子');assert.equal(items[2].amount,59);assert.equal(items[3].amount,91);
});
test('distinguishes per-item calories from totals and converts kJ',()=>{
 assert.equal(recognizeQuickFoods('3块粗粮饼干25大卡')[0].energyKcal,25);
 assert.equal(recognizeQuickFoods('3块粗粮饼干 每块25大卡')[0].energyKcal,75);
 assert.equal(recognizeQuickFoods('2块曲奇 合计25大卡')[0].energyKcal,25);
 assert.ok(Math.abs(recognizeQuickFoods('1块饼干418.4kJ')[0].energyKcal-100)<1e-5);
});
test('parses masses, volumes, commas and unitless leading quantity',()=>{
 const items=recognizeQuickFoods('1个橙子，2个鸡蛋；150g米饭\n200毫升牛奶\n2香草白巧克力曲奇');assert.equal(items.length,5);assert.equal(items[2].energyKcal,174);assert.equal(items[3].amount,200);assert.equal(items[3].amountUnit,'mL');assert.equal(items[4].name,'香草白巧克力曲奇');assert.equal(items[4].energyKcal,null);
});
test('unknown foods do not acquire made-up nutrition; unrecognized sizes require correction',()=>{
 const [food]=recognizeQuickFoods('6块雪花酥');assert.equal(food.energyKcal,null);assert.equal(food.protein,null);assert.equal(food.amount,null);assert.throws(()=>recognizeQuickFoods('橙子'));assert.throws(()=>recognizeQuickFoods('0个橙子'));
});
test('local labels are matched exactly and grams are never relabelled as millilitres',()=>{
 const milk={id:'milk',name:'特定牛奶',unit:'mL',energyKcal:60,protein:3,carbs:5,fat:3,serving:{millilitres:250},source:'Woolworths',importedAt:'test'};
 assert.equal(recognizeQuickFoods('1份特定牛奶',[milk])[0].energyKcal,150);
 const mismatch=recognizeQuickFoods('100g特定牛奶',[milk])[0];assert.equal(mismatch.energyKcal,null);assert.equal(mismatch.amountUnit,'g');
 assert.equal(recognizeQuickFoods('200ml特定牛奶 每100ml60kcal',[milk])[0].energyKcal,120);
 assert.equal(recognizeQuickFoods('200ml特定牛奶 每100g60kcal',[milk])[0].energyKcal,null);
});
test('legacy structured input remains usable without forcing delimiter syntax on users',()=>{
 const [food]=recognizeQuickFoods('杏仁 | 10颗 | 69.5 | 估算 | 12 | 2.54 | 2.59 | 5.99');assert.equal(food.amount,12);assert.equal(food.protein,2.54);assert.equal(food.energyKcal,69.5);
});

test('per-serving energy is not multiplied by grams without a serving conversion',()=>{
 assert.equal(recognizeQuickFoods('100g饼干 每份25大卡')[0].energyKcal,null);
});
