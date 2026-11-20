import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyFood,summarizeFoodCategories} from '../lib/foodCategory.ts';
import {foodCalories} from '../lib/foodRecord.ts';
const entry=(name,energyKcal,more={})=>({id:name,name,type:'food',date:'2026-10-27',amount:100,meal:'未分类',time:'10:00',protein:null,carbs:null,fat:null,energyKcal,...more});
test('food-type icons distinguish core foods, portion-sensitive foods and discretionary snacks',()=>{
 for(const name of ['橙子','东北玉米','鸡蛋','Woolworths Lean Beef Strips 500g'])assert.equal(classifyFood(entry(name,100)).category,'healthy',name);
 for(const name of ['杏仁','粗粮饼干','Woolworth cracker饼干','Woolworths BBQ Flavoured Nut & Legume Mix 325g'])assert.equal(classifyFood(entry(name,100)).category,'moderate',name);
 for(const name of ['雪花酥','香草白巧克力曲奇','Doritos Corn Chips Cheese Supreme','巧克力杏仁'])assert.equal(classifyFood(entry(name,100)).category,'limit',name);
});
test('high energy alone never determines category; manual category overrides recognition',()=>{
 assert.equal(classifyFood(entry('未命名食物',900)).category,'unclassified');
 assert.equal(classifyFood(entry('曲奇',100,{foodCategory:'healthy'})).category,'healthy');
 assert.equal(classifyFood(entry('曲奇',100,{foodCategory:'__proto__'})).category,'limit');
});
test('shares use energy, not food counts, and include unclassified energy in denominator',()=>{
 const s=summarizeFoodCategories([entry('橙子',100),entry('鸡蛋',100),entry('杏仁',100),entry('曲奇',500),entry('未知食物',200)],foodCalories);
 assert.equal(s.total,1000);assert.deepEqual(s.groups.map(g=>g.percent),[20,10,50,20]);assert.equal(s.groups[0].count,2);
});
test('unknown calories stay excluded, zeros are not missing and nonfood records are ignored',()=>{
 const s=summarizeFoodCategories([entry('橙子',null),entry('杏仁',0),entry('曲奇',100),entry('体重',800,{type:'weight'})],foodCalories);
 assert.equal(s.total,100);assert.equal(s.missingCalories,1);assert.equal(s.groups[0].missingCalories,1);assert.equal(s.groups[2].percent,100);
 const empty=summarizeFoodCategories([],foodCalories);assert.equal(empty.total,0);assert.ok(empty.groups.every(g=>g.percent===0));
});
test('rounded percentage sums to 100.0 and adjusts when calories or category change',()=>{
 const items=[entry('橙子',1),entry('杏仁',1),entry('曲奇',1)];const s=summarizeFoodCategories(items,foodCalories);
 assert.equal(s.groups.reduce((sum,g)=>sum+Math.round(g.percent*10),0),1000);
 items[0].energyKcal=2;items[1].foodCategory='limit';const edited=summarizeFoodCategories(items,foodCalories);assert.equal(edited.groups[0].percent,50);assert.equal(edited.groups[1].percent,0);assert.equal(edited.groups[2].percent,50);
});
