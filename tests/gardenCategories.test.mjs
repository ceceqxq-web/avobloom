import test from 'node:test';import assert from 'node:assert/strict';import {gardenCategory,gardenCategories,mealFoodPriority,proteinFamily} from '../lib/gardenCategories.ts';
test('selection order and food groups',()=>{assert.deepEqual(gardenCategories,['肉蛋奶','蔬菜','水果','碳水','油脂']);for(const [name,category] of [['水煮鸡蛋','肉蛋奶'],['清蒸西兰花','蔬菜'],['梨','水果'],['熟糙米饭','碳水'],['花生酱','油脂'],['Woolworths cracker','碳水'],['无糖豆奶','肉蛋奶']])assert.equal(gardenCategory(name),category);assert.equal(gardenCategory('未知食物'),null)});

test('breakfast places eggs and dairy first; main meals put meat and seafood first',()=>{
 const names=['原味酸奶','去皮鸡胸肉','水煮鸡蛋','清蒸鳕鱼','原味硬豆腐'];
 const rank=meal=>[...names].sort((a,b)=>mealFoodPriority(a,meal)-mealFoodPriority(b,meal));
 assert.deepEqual(rank('早餐'),['水煮鸡蛋','原味酸奶','原味硬豆腐','去皮鸡胸肉','清蒸鳕鱼']);
 for(const meal of ['午餐','晚餐'])assert.deepEqual(rank(meal),['去皮鸡胸肉','清蒸鳕鱼','原味硬豆腐','水煮鸡蛋','原味酸奶']);
 assert.equal(proteinFamily('无糖豆奶'),'豆制品');assert.equal(proteinFamily('chicken eggs'),'鸡蛋');assert.equal(rank('加餐')[0],'原味酸奶');
});

test('supermarket departments separate the whole pantry and honor meal order',async()=>{
 const {marketDepartment,marketOrder}=await import('../lib/gardenCategories.ts');
 for(const [name,zone] of [['鸡蛋','蛋奶'],['乳清蛋白粉','蛋奶'],['Macro firm tofu','豆制品'],['去皮鸡胸肉','肉类'],['prawns','海鲜'],['西兰花','蔬菜'],['梨','水果'],['熟糙米饭','米面主食'],['vanilla cookies','零食点心'],['BBQ peanuts','坚果与油脂'],['橄榄油','坚果与油脂'],['coffee','饮品'],['不认识的食物','其他食物']])assert.equal(marketDepartment(name),zone,name);
 assert.equal(marketOrder('早餐')[0],'蛋奶');assert.deepEqual(marketOrder('午餐').slice(0,2),['肉类','海鲜']);assert.equal(new Set(marketOrder('晚餐')).size,marketOrder('晚餐').length);
});
