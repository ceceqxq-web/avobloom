import test from 'node:test';import assert from 'node:assert/strict';
import {resolveFoodNutrition} from '../lib/resolveFoodNutrition.ts';
const entry={id:'x',date:'2026-10-29',name:'年糕',amount:25,type:'food',meal:'晚餐',time:'20:05',energyKcal:null,protein:null,carbs:null,fat:null,recordNote:'待确认',portionBasis:{amount:25,energyKcal:null,protein:null,carbs:null,fat:null}};
const food={id:'label',name:'候选年糕',unit:'g',energyKcal:220,protein:4,carbs:48,fat:1,source:'标签导入',sourceUrl:'https://example.com/label',importedAt:'2026-10-29'};
test('confirmation scales label for 25g and preserves date/meal, without mutating original',()=>{const next=resolveFoodNutrition(entry,food,25);assert.equal(next.energyKcal,55);assert.equal(next.protein,1);assert.equal(next.carbs,12);assert.equal(next.fat,.25);assert.equal(next.date,entry.date);assert.equal(next.meal,entry.meal);assert.equal(next.portionBasis,undefined);assert.match(next.recordNote,/用户确认查询标签/);assert.equal(entry.energyKcal,null)});
test('confirmation requires positive measured amount',()=>{for(const value of [0,-1,NaN,10001])assert.throws(()=>resolveFoodNutrition(entry,food,value))});
