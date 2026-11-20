import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {demoContent} from '../lib/demoData.ts';
test('demo uses only independent public examples and has internally consistent totals',()=>{
 const a=demoContent(),b=demoContent();
 assert.ok(a.meals.length>0);assert.ok(a.meals.every(m=>m.id.startsWith('demo-')));
 assert.equal(a.totals.energyKcal,a.meals.reduce((sum,m)=>sum+m.energyKcal,0));
 a.meals[0].name='modified';a.foods[0].label.name='modified';a.weights[0]=0;
 assert.notEqual(b.meals[0].name,'modified');assert.notEqual(b.foods[0].label.name,'modified');assert.notEqual(b.weights[0],0);
 assert.ok(!JSON.stringify(b).includes('user_id'));
});
test('demo entry points do not mount live data hooks or mutation APIs',()=>{
 for(const p of ['components/DemoPreview.tsx','lib/demoData.ts','app/demo/page.tsx']){
  const source=readFileSync(p,'utf8');
  assert.doesNotMatch(source,/useHealthDatabase|HealthDashboard|HealthClient|\/api\/health|\/api\/foods|fetch\s*\(|localStorage|sessionStorage|document\.cookie|createClient/);
 }
 const source=readFileSync('components/DemoPreview.tsx','utf8');
 assert.match(source,/示例数据/);assert.match(source,/disabled/);
});
