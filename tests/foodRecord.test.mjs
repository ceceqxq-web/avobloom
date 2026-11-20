import test from 'node:test';
import assert from 'node:assert/strict';
import {initialPortionDraft,updateFoodPortion,foodCalories} from '../lib/foodRecord.ts';
const corn={id:'corn',date:'2026-10-27',type:'food',name:'东北玉米',amount:150,protein:7.05,carbs:50.1,fat:2.85,energyKcal:258,meal:'未分类',time:'16:42',quantityText:'1根',recordNote:'估算：原150g'};
test('legacy count records scale by grams and retain the original identity and reference',()=>{
 const d=initialPortionDraft(corn);d.mode='weight';d.amount='100';const result=updateFoodPortion(corn,d);
 assert.equal(result.id,corn.id);assert.equal(result.date,corn.date);assert.equal(result.energyKcal,172);assert.equal(result.carbs,33.4);assert.equal(result.amount,100);assert.equal(result.recordNote,corn.recordNote);assert.equal(result.portionBasis.amount,150);
 const next=initialPortionDraft(result);next.amount='150';const restored=updateFoodPortion(result,next);assert.equal(restored.energyKcal,258);assert.equal(restored.protein,7.05);
});
test('serving size and number of servings determine weight and nutrients',()=>{
 const d=initialPortionDraft(corn);d.mode='servings';d.servingAmount='50';d.servingQuantity='1';d.servings='2';const result=updateFoodPortion(corn,d);
 assert.equal(result.amount,100);assert.equal(result.energyKcal,172);assert.equal(result.servings,2);assert.match(result.quantityText,/2份/);
});
test('known quantity with missing grams can be scaled without inventing macros',()=>{
 const biscuits={...corn,id:'biscuit',name:'饼干',amount:0,weightUnknown:true,quantityText:'3块',energyKcal:25,protein:null,carbs:null,fat:null};
 const d=initialPortionDraft(biscuits);d.count='6';let result=updateFoodPortion(biscuits,d);
 assert.equal(result.energyKcal,50);assert.equal(result.protein,null);assert.equal(result.weightUnknown,true);
 d.mode='weight';d.amount='40';assert.throws(()=>updateFoodPortion(biscuits,d));
 d.referenceAmount='20';result=updateFoodPortion(biscuits,d);assert.equal(result.energyKcal,50);assert.equal(result.weightUnknown,false);assert.equal(result.portionBasis.amount,20);
});
test('defining grams and cracker count calibrates a previously unknown serving',()=>{
 const original={...corn,amount:0,weightUnknown:true,quantityText:'3块',energyKcal:25,protein:null,carbs:null,fat:null};
 const d=initialPortionDraft(original);d.mode='servings';d.servingAmount='20';d.servingQuantity='3';d.servings='2';const result=updateFoodPortion(original,d);
 assert.equal(result.amount,40);assert.equal(result.energyKcal,50);assert.equal(result.portionBasis.amount,20);assert.equal(result.protein,null);
});
const milk={...corn,name:'牛奶',amount:250,amountUnit:'mL',quantityText:undefined,protein:8.25,carbs:12,fat:8.5,energyKcal:660/4.184,foodLabel:{id:'milk',name:'牛奶',unit:'mL',source:'Woolworths',importedAt:'2026-10-27',energyKcal:264/4.184,protein:3.3,carbs:4.8,fat:3.4,serving:{millilitres:250,energyKcal:660/4.184,protein:8.2,carbs:12,fat:8.5}}};
test('weight uses per-100 values while servings preserve label rounding',()=>{
 let d=initialPortionDraft(milk);let result=updateFoodPortion(milk,d);assert.equal(result.protein,8.25);
 d.mode='servings';d.servings='2';result=updateFoodPortion(milk,d);assert.equal(result.amount,500);assert.equal(result.protein,16.4);assert.ok(Math.abs(result.energyKcal-1320/4.184)<1e-7);
 d.servingAmount='100';result=updateFoodPortion(milk,d);assert.equal(result.amount,200);assert.equal(result.protein,6.6);
});
test('switching saved weight records back to counts uses the portion mapping',()=>{
 const d=initialPortionDraft(corn);d.mode='weight';d.amount='300';const updated=updateFoodPortion(corn,d),again=initialPortionDraft(updated);assert.equal(again.count,'2');assert.equal(again.servings,'2');
});
test('unknown calories remain unknown, legacy energy fallback works, invalid amounts fail',()=>{
 assert.equal(foodCalories({...corn,energyKcal:undefined}),7.05*4+50.1*4+2.85*9);
 const d=initialPortionDraft(corn);d.count='0';assert.throws(()=>updateFoodPortion(corn,d));d.count='-1';assert.throws(()=>updateFoodPortion(corn,d));d.count='2';assert.equal(updateFoodPortion({...corn,energyKcal:null},d).energyKcal,null);
});

test('manual calorie corrections rebase future grams, servings and counts without changing macros',()=>{
 const d=initialPortionDraft(corn);d.energyOverride='300';const corrected=updateFoodPortion(corn,d);
 assert.equal(corrected.energyKcal,300);assert.equal(corrected.protein,corn.protein);
 const next=initialPortionDraft(corrected);next.count='0.5';assert.equal(updateFoodPortion(corrected,next).energyKcal,150);
 next.mode='weight';next.amount='100';assert.equal(updateFoodPortion(corrected,next).energyKcal,200);
 next.mode='servings';next.servings='2';assert.equal(updateFoodPortion(corrected,next).energyKcal,600);
});
test('calorie correction at a scaled portion preserves correct original reference',()=>{
 const d=initialPortionDraft(corn);d.count='2';d.energyOverride='600';const corrected=updateFoodPortion(corn,d);
 assert.equal(corrected.portionBasis.energyKcal,300);
 const next=initialPortionDraft(corrected);next.count='1';assert.equal(updateFoodPortion(corrected,next).energyKcal,300);
});
test('manual calories accept zero, reject negatives and preserve unknown macros',()=>{
 const original={...corn,amount:0,weightUnknown:true,quantityText:'3块',energyKcal:25,protein:null,carbs:null,fat:null};
 const d=initialPortionDraft(original);d.energyOverride='0';const zero=updateFoodPortion(original,d);assert.equal(zero.energyKcal,0);assert.equal(zero.protein,null);
 d.energyOverride='-5';assert.throws(()=>updateFoodPortion(original,d));d.energyOverride='no';assert.throws(()=>updateFoodPortion(original,d));
});
