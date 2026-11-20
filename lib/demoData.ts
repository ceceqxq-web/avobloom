import {gardenFoods} from './foodGarden.ts';

// Public, fictional examples only. Never accept user data as an argument.
export function demoContent(){
 const foods=gardenFoods([],[]);
 const picks=[['garden-oats','早餐'],['garden-milk','早餐'],['garden-chicken','午餐'],['garden-rice','午餐'],['garden-broccoli','午餐'],['garden-apple','加餐']] as const;
 const meals=picks.map(([id,meal])=>{
  const food=foods.find(f=>f.id===id)!;
  return {id:'demo-'+id,meal,name:food.name,amount:food.amount,unit:food.label.unit,energyKcal:food.label.energyKcal*food.amount/100,protein:food.label.protein*food.amount/100,carbs:food.label.carbs*food.amount/100,fat:food.label.fat*food.amount/100};
 });
 const totals=meals.reduce((sum,f)=>({energyKcal:sum.energyKcal+f.energyKcal,protein:sum.protein+f.protein,carbs:sum.carbs+f.carbs,fat:sum.fat+f.fat}),{energyKcal:0,protein:0,carbs:0,fat:0});
 return {foods,meals,totals,weights:[66.8,66.7,66.75,66.6,66.5,66.4,66.2],weight:66.2,calorieGoal:1800};
}
