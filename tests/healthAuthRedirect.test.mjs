import test from 'node:test';
import assert from 'node:assert/strict';
import {safeAuthNext,authCallbackRedirect} from '../lib/health/authRedirect.ts';
test('post-login path stays on the app, including malformed navigation values',()=>{
 for(const value of ['https://example.com','//example.com','/\\example.com','/\r\nfoo',null])assert.equal(safeAuthNext(value),'/');
 assert.equal(safeAuthNext('/meal-planner?date=2026-11-19'),'/meal-planner?date=2026-11-19');
 const restored=authCallbackRedirect(new URL('http://localhost:3000/?code=one-use-code&next=%2Fmeal-planner'));
 assert.equal(restored.pathname,'/auth/callback');assert.equal(restored.searchParams.get('next'),'/meal-planner');
});
