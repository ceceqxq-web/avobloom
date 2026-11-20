import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudHealthStore,emptyCloudState} from '../lib/health/cloudState.ts';
import {diffData,emptyHealthData,DataConflict} from '../lib/health/data.ts';
function repository(){let row={revision:0,payload:emptyCloudState()};return {read:async()=>structuredClone(row),compareAndSwap:async(revision,payload)=>{if(revision!==row.revision)return false;row={revision:revision+1,payload:structuredClone(payload)};return true}}}
const entry=id=>({id,date:'2026-11-05',type:'weight',name:'体重',amount:70,protein:0,carbs:0,fat:0,time:'08:00',meal:'未分类'});
test('two devices add disjoint records without lost updates; same-record conflict remains explicit',async()=>{
 const repo=repository(),a=cloudHealthStore(repo),b=cloudHealthStore(repo),empty=emptyHealthData();
 await Promise.all([a.patch(diffData(empty,{...empty,entries:[entry('a')]})),b.patch(diffData(empty,{...empty,entries:[entry('b')]}))]);
 const before=(await a.read()).data;assert.equal(before.entries.length,2);
 await a.patch(diffData(before,{...before,entries:before.entries.map(e=>e.id==='a'?{...e,amount:69}:e)}));
 await assert.rejects(b.patch(diffData(before,{...before,entries:before.entries.map(e=>e.id==='a'?{...e,amount:68}:e)})),DataConflict);
 assert.equal((await b.read()).data.entries.find(e=>e.id==='a').amount,69);
});
test('bootstrap is idempotent and does not resurrect deleted records',async()=>{
 const a=cloudHealthStore(repository()),incoming={...emptyHealthData(),entries:[entry('a')]};
 await a.migrate('device',incoming,{});const before=(await a.read()).data;await a.patch(diffData(before,emptyHealthData()));
 await a.migrate('device',incoming,{});assert.equal((await a.read()).data.entries.length,0);
});
test('separate user repositories cannot see each other',async()=>{
 const a=cloudHealthStore(repository()),b=cloudHealthStore(repository()),empty=emptyHealthData();await a.patch(diffData(empty,{...empty,entries:[entry('private')]}));assert.equal((await b.read()).data.entries.length,0);
});
test('concurrent workers claim once; atomic completion is idempotent and rejects invalid output',async()=>{
 const repo=repository(),a=cloudHealthStore(repo),b=cloudHealthStore(repo),input={id:'job-12345678',text:'1个梨',date:'2026-11-05',meal:'午餐',time:'12:00'};
 await Promise.all([a.enqueueFoodJob(input),b.enqueueFoodJob(input)]);assert.equal((await a.listFoodJobs()).length,1);
 const claims=await Promise.all([a.claimFoodJob('one'),b.claimFoodJob('two')]),claimed=claims.find(Boolean);assert.equal(claims.filter(Boolean).length,1);
 const label={id:'test',name:'梨',unit:'g',energyKcal:57,protein:.4,carbs:15.2,fat:.1,source:'AI估算'},item={name:'梨',amount:100,amountUnit:'g',energyKcal:57,protein:.4,carbs:15.2,fat:.1,foodLabel:label};
 await assert.rejects(a.finishFoodJob(input.id,claimed.owner,[{...item,protein:NaN}]));assert.equal((await a.read()).data.entries.length,0);assert.equal((await a.listFoodJobs())[0].status,'running');
 await a.finishFoodJob(input.id,claimed.owner,[item]);await b.finishFoodJob(input.id,claimed.owner,[item]);assert.equal((await a.read()).data.entries.length,1);assert.equal((await b.listFoodJobs())[0].status,'succeeded');
});

test('local SQLite migration preserves cloud settings, is idempotent, and keeps later cloud deletions',async()=>{
 const store=cloudHealthStore(repository()),incoming={...emptyHealthData(),goal:65,calGoal:1200,entries:[entry('local')]};
 const initial=await store.migrate('sqlite-source',incoming,{source:'sqlite'},true);
 assert.equal(initial.data.goal,55);assert.equal(initial.data.calGoal,1800);
 const before=initial.data;
 await store.patch(diffData(before,{...before,entries:[],goal:58,calGoal:1700}));
 const repeated=await store.migrate('sqlite-source',incoming,{},true);
 assert.equal(repeated.data.entries.length,0);assert.equal(repeated.data.goal,58);assert.equal(repeated.data.calGoal,1700);
});
