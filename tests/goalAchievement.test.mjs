import test from 'node:test';
import assert from 'node:assert/strict';
import {goalAchievement} from '../lib/goalAchievement.ts';
const weight=(id,date,amount,time='08:00')=>({id,date,amount,time,type:'weight'});
const plan={startWeight:68,startDate:'2026-10-01',targetDate:'2026-12-01'};
test('latest weight reaches or passes loss target, irrespective of deadline',()=>{assert.equal(goalAchievement([weight('1','2026-10-29',60)],60,plan,'2026-10-29').weight,60);assert.equal(goalAchievement([weight('1','2026-12-10',59.9)],60,plan,'2026-12-10').weight,59.9);assert.equal(goalAchievement([weight('1','2026-10-29',60.1)],60,plan,'2026-10-29'),null)});
test('future records and older successful weights do not trigger current achievement',()=>{assert.equal(goalAchievement([weight('1','2026-10-28',60),weight('2','2026-10-29',61)],60,plan,'2026-10-29'),null);assert.equal(goalAchievement([weight('1','2026-11-01',60)],60,plan,'2026-10-29'),null);assert.equal(goalAchievement([],60,plan,'2026-10-29'),null)});
test('new goals get independent celebration keys; maintenance and pre-baseline entries do not qualify',()=>{const entries=[weight('1','2026-10-29',59)];assert.notEqual(goalAchievement(entries,60,plan,'2026-10-29').key,goalAchievement(entries,59,plan,'2026-10-29').key);assert.equal(goalAchievement(entries,68,plan,'2026-10-29'),null);assert.equal(goalAchievement(entries,60,{...plan,startDate:'2026-11-01'},'2026-10-29'),null)});
test('gain direction and same-day latest time are handled',()=>{assert.ok(goalAchievement([weight('1','2026-10-29',60)],60,{...plan,startWeight:55},'2026-10-29'));assert.equal(goalAchievement([weight('1','2026-10-29',60),weight('2','2026-10-29',61,'09:00')],60,plan,'2026-10-29'),null)});
