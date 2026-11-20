import test from 'node:test';
import assert from 'node:assert/strict';
import {householdPortion} from '../lib/householdPortion.ts';
import {plannerFoods} from '../lib/mealPlanner.ts';
test('explicit mass and volume references stay distinct',()=>{assert.equal(householdPortion('milk',250).text,'约 1 杯');assert.match(householdPortion('milk',250).basis,/250 mL/);assert.equal(householdPortion('rice',150).text,'约 1 饭碗');assert.equal(householdPortion('oil',4.5).text,'约 1 小勺');assert.match(householdPortion('oil',4.5).basis,/5 mL/);assert.equal(householdPortion('egg',100).text,'约 2 个')});
test('all planner ingredients have references; missing or invalid values are not invented',()=>{for(const id of Object.keys(plannerFoods))assert.notEqual(householdPortion(id,100).text,'暂无');assert.equal(householdPortion('missing',100).text,'暂无');assert.equal(householdPortion('oil',0).text,'暂无');assert.equal(householdPortion('milk',1).text,'约 <0.1 杯')});
