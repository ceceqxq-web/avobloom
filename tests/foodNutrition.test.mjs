import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNutritionLabel, woolworthsProductId } from '../lib/foodNutrition.ts';

test('Woolworths copied desktop label uses per-100 column and converts kJ', () => {
  const label = `Quantity Per Serving  Quantity Per 100mL\nEnergy 660 kJ 264 kJ\nProtein 8.2 g 3.3 g\nFat, Total 8.5 g 3.4 g\nCarbohydrate 12.0 g 4.8 g\nSugars < 1.0 g < 1.0 g`;
  const result = parseNutritionLabel(label, 'last');
  assert.equal(result.protein, 3.3);
  assert.equal(result.fat, 3.4);
  assert.equal(result.carbs, 4.8);
  assert.ok(Math.abs(result.energyKcal - 264 / 4.184) < 1e-8);
  // 250 mL uses label energy, not 4/4/9 macro estimate.
  assert.ok(Math.abs(result.energyKcal * 2.5 - 660 / 4.184) < 1e-8);
});
test('responsive label with duplicated accessible values selects explicit per-100 data', () => {
  const result = parseNutritionLabel(`Quantity Per Serving Quantity Per 100g / 100mL\nEnergy 660.0kJ Per serving660.0kJ 264.0kJ Per 100 grams or millilitres264.0kJ\nProtein 8.2g Per serving8.2g 3.3g Per 100 grams or millilitres3.3g\nFat, Total 8.5g Per serving8.5g 3.4g Per 100 grams or millilitres3.4g\nCarbohydrate 12g Per serving12g 4.8g Per 100 grams or millilitres4.8g`);
  assert.equal(result.protein, 3.3);
  assert.equal(result.carbs, 4.8);
});
test('supports first-column per-100 label and kcal', () => {
  const result = parseNutritionLabel('Per 100g Per serving\nEnergy 400 kcal 200 kcal\nProtein 10 g 5 g\nTotal Fat 12 g 6 g\nCarbohydrate 60 g 30 g', 'first');
  assert.deepEqual(result, {energyKcal:400,protein:10,carbs:60,fat:12});
});
test('supports HTML nutrition tables', () => {
  const result = parseNutritionLabel('<table><tr><th>Per Serving</th><th>Per 100g</th></tr><tr><td>Energy</td><td>400 kJ</td><td>800 kJ</td></tr><tr><td>Protein</td><td>2 g</td><td>4 g</td></tr><tr><td>Fat, Total</td><td>3 g</td><td>6 g</td></tr><tr><td>Carbohydrate</td><td>10 g</td><td>20 g</td></tr></table>');
  assert.equal(result.protein,4); assert.equal(result.carbs,20);
});
test('missing data and per-serving-only labels never silently become zero', () => {
  assert.throws(()=>parseNutritionLabel('Per serving\nEnergy 200 kJ\nProtein 2g\nFat 3g\nCarbohydrate 4g'));
  assert.throws(()=>parseNutritionLabel('Per 100g\nEnergy 200 kJ\nProtein 2g\nFat 3g'));
  assert.throws(()=>parseNutritionLabel('Per 100g\nEnergy 200 kJ\nProtein < 1g\nFat 3g\nCarbohydrate 4g'));
  assert.throws(()=>parseNutritionLabel('Per 100g\nEnergy 200 kJ\nProtein 200g\nFat 3g\nCarbohydrate 4g'));
});
test('only permits Woolworths product URLs or numeric product ids', () => {
  assert.equal(woolworthsProductId('https://www.woolworths.com.au/shop/productdetails/888140/full-cream-milk'), '888140');
  assert.equal(woolworthsProductId('888140'), '888140');
  for (const url of ['http://127.0.0.1:3000/', 'https://www.woolworths.com.au.evil.com/shop/productdetails/888140','https://www.woolworths.com.au@evil.com/shop/productdetails/888140','https://www.woolworths.com.au:8080/shop/productdetails/888140','file:///etc/passwd']) assert.equal(woolworthsProductId(url), null);
});

test('structured Woolworths NIP distinguishes per-serve, fat saturated, and mL', async () => {
  const { nutritionFromWoolworthsProduct } = await import('../lib/foodNutrition.ts');
  const make = (Name,Value) => ({Name,Value});
  const Attributes = [make('Energy kJ Quantity Per 100g - Total - NIP','264.0kJ'),make('Energy kJ Quantity Per Serve - Total - NIP','660.0kJ'),make('Protein Quantity Per 100g - Total - NIP','3.3g'),make('Fat Saturated Quantity Per 100g - Total - NIP','2.2g'),make('Fat Total Quantity Per 100g - Total - NIP','3.4g'),make('Carbohydrate Quantity Per 100g - Total - NIP','4.8g'),make('Serving Size - Total - NIP','250.0 ML')];
  const result = nutritionFromWoolworthsProduct({Stockcode:888140,DisplayName:'Woolworths Full Cream Milk 3L',AdditionalAttributes:{nutritionalinformation:JSON.stringify({Attributes})}});
  assert.equal(result.unit,'mL'); assert.equal(result.protein,3.3); assert.equal(result.fat,3.4); assert.equal(result.energyKcal,264/4.184);
  assert.equal(nutritionFromWoolworthsProduct({Stockcode:1,AdditionalAttributes:{nutritionalinformation:'{}'}}),null);
});

test('serving metadata preserves count, grams and pack size without guessing', async () => {
  const { servingMetadata, nutritionFromWoolworthsProduct } = await import('../lib/foodNutrition.ts');
  assert.deepEqual(servingMetadata('2 biscuits (30g)','8'),{description:'2 biscuits (30g)',quantity:2,quantitySource:'label',quantityUnit:'biscuits',grams:30,millilitres:null,servingsPerPack:8});
  const liquid = servingMetadata('250.0 ML','12.0');
  assert.equal(liquid.grams,null); assert.equal(liquid.quantity,null); assert.equal(liquid.millilitres,250);
  assert.equal(servingMetadata('','').servingsPerPack,null);
  const Attributes = [ ['Energy kJ Quantity Per 100g - Total - NIP','264kJ'],['Protein Quantity Per 100g - Total - NIP','3.3g'],['Fat Total Quantity Per 100g - Total - NIP','3.4g'],['Carbohydrate Quantity Per 100g - Total - NIP','4.8g'],['Serving Size - Total - NIP','250 ML'],['Servings Per Pack - Total - NIP','12'],['Energy kJ Quantity Per Serve - Total - NIP','660kJ'],['Protein Quantity Per Serve - Total - NIP','8.2g'] ].map(([Name,Value])=>({Name,Value}));
  const p=nutritionFromWoolworthsProduct({Stockcode:888140,Name:'Milk',SmallImageFile:'https://cdn0.woolworths.media/content/wowproductimages/small/888140.jpg',AdditionalAttributes:{nutritionalinformation:JSON.stringify({Attributes})}});
  assert.equal(p.serving.protein,8.2); // preserve label rounding; never calculate 3.3*2.5
  assert.equal(p.serving.carbs,null); assert.equal(p.serving.fat,null);
  assert.equal(p.serving.servingsPerPack,12); assert.equal(p.serving.energyKcal,660/4.184);
  assert.ok(p.imageUrl.endsWith('888140.jpg'));
});
test('pasted serving columns and missing values are handled independently',async()=>{
  const {servingFromLabel}=await import('../lib/foodNutrition.ts');
  const result=servingFromLabel('Serving size: 2 biscuits (30g)\nServings per pack: 8\nPer Serving Per 100g\nEnergy 600 kJ 2000 kJ\nProtein 3 g 10 g\nFat, Total Not Available 12 g\nCarbohydrate 15 g 50 g','last');
  assert.equal(result.grams,30);assert.equal(result.quantity,2);assert.equal(result.servingsPerPack,8);assert.equal(result.protein,3);assert.equal(result.fat,null);assert.equal(result.energyKcal,600/4.184);
  const empty=servingFromLabel('Per 100g\nEnergy 400 kcal\nProtein 10g\nFat, Total 12g\nCarbohydrate 60g','last');
  assert.equal(empty.energyKcal,null); assert.equal(empty.protein,null); assert.equal(empty.description,null);
  const responsive=servingFromLabel('Per Serving Per 100g / 100mL\nEnergy 660kJ Per serving660kJ 264kJ Per 100 grams or millilitres264kJ\nProtein 8.2g Per serving8.2g 3.3g Per 100 grams or millilitres3.3g','last');
  assert.equal(responsive.protein,8.2);assert.equal(responsive.energyKcal,660/4.184);
});
test('thumbnail URL validation rejects non-official hosts and insecure links',async()=>{
 const {woolworthsImageUrl}=await import('../lib/foodNutrition.ts');
 assert.equal(woolworthsImageUrl({SmallImageFile:'https://evil.com/food.jpg'}),null);
 assert.equal(woolworthsImageUrl({SmallImageFile:'http://cdn0.woolworths.media/food.jpg'}),null);
 assert.equal(woolworthsImageUrl({}),null);
});


test('recognizes count following gram size as well as count preceding it',async()=>{
 const {servingMetadata}=await import('../lib/foodNutrition.ts');
 for(const text of ['20g (3 crackers)','20 g (approx. 3 crackers)','3 crackers (20g)','20 g = 3 crackers']){
  const info=servingMetadata(text,'10');assert.equal(info.quantity,3,text);assert.equal(info.quantityUnit,'crackers',text);assert.equal(info.grams,20,text);
 }
 assert.equal(servingMetadata('20 g','10').quantity,null);
 assert.equal(servingMetadata('250 mL','12').quantity,null);
});

test('Colby cheese NIP accepts an upper bound without discarding the complete label', async()=>{
 const {nutritionFromWoolworthsProduct}=await import('../lib/foodNutrition.ts');
 const Attributes=[['Serving Size - Total - NIP','25.0 G'],['Servings Per Pack - Total - NIP','40.0'],['Energy kJ Quantity Per 100g - Total - NIP','1620.0kJ'],['Energy kJ Quantity Per Serve - Total - NIP','405.0kJ'],['Protein Quantity Per 100g - Total - NIP','23.9g'],['Protein Quantity Per Serve - Total - NIP','6.0g'],['Fat Total Quantity Per 100g - Total - NIP','32.8g'],['Fat Total Quantity Per Serve - Total - NIP','8.2g'],['Carbohydrate Quantity Per 100g - Total - NIP','< 1.0g'],['Carbohydrate Quantity Per Serve - Total - NIP','0.2g']].map(([Name,Value])=>({Name,Value}));
 const food=nutritionFromWoolworthsProduct({Stockcode:6044041,Name:'Woolworths Colby Cheese Block 1kg',AdditionalAttributes:{nutritionalinformation:JSON.stringify({Attributes})}});
 assert.ok(food);assert.equal(food.carbs,1);assert.equal(food.lessThan.carbs,true);assert.equal(food.energyKcal,1620/4.184);assert.equal(food.serving.grams,25);assert.equal(food.serving.carbs,.2);assert.equal(food.serving.servingsPerPack,40);assert.match(food.labelEvidence,/上限/);
});
test('copied responsive upper bounds survive with independent serving qualifiers',async()=>{
 const {servingFromLabel}=await import('../lib/foodNutrition.ts');
 const text='Serving size: 25g\nServings per pack: 40\nQuantity Per Serving Quantity Per 100g\nEnergy 405kJ 1620kJ\nProtein 6g 23.9g\nFat, Total 8.2g 32.8g\nCarbohydrate < 1g < 1g';
 const food=parseNutritionLabel(text,'last',true);assert.equal(food.lessThan.carbs,true);assert.equal(food.carbs,1);const serving=servingFromLabel(text,'last');assert.equal(serving.lessThan.carbs,true);assert.equal(serving.carbs,1);
 assert.throws(()=>parseNutritionLabel('Per 100g\nEnergy 1620kJ\nProtein 23.9g\nFat 32.8g\nCarbohydrate Not Available','last',true));
});
