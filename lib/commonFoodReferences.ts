import type {FoodNutrition} from './foodNutrition';

// USDA SR28, vegetable report. These are raw, edible-weight references,
// never Woolworths product labels or generated AI nutrition.
const sourceUrl='https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg11.pdf';
const rows=[
 {ndb:'11253',name:'绿叶生菜（生，Green leaf lettuce）',english:'Lettuce, green leaf, raw',energyKcal:15,protein:1.36,carbs:2.87,fat:.15,aliases:['green leaf lettuce','leaf lettuce','绿叶生菜','叶生菜']},
 {ndb:'11252',name:'球生菜（生，Iceberg lettuce）',english:'Lettuce, iceberg (includes crisphead types), raw',energyKcal:14,protein:.9,carbs:2.97,fat:.14,aliases:['iceberg lettuce','iceberg','crisphead lettuce','球生菜','结球生菜','冰山生菜','西生菜']},
 {ndb:'11251',name:'罗马生菜（生，Cos / Romaine lettuce）',english:'Lettuce, cos or romaine, raw',energyKcal:17,protein:1.23,carbs:3.29,fat:.3,aliases:['cos lettuce','romaine lettuce','romaine','cos','罗马生菜']},
];
const normalize=(text:string)=>text.toLowerCase().trim().replace(/[（(](?:生|raw)[）)]/g,'').replace(/\braw\b/g,'').replace(/[\s\p{P}]/gu,'');
/** Exact plain-food aliases only: never turn a branded product or cooked dish into a raw reference. */
export function commonFoodReferences(query:string):FoodNutrition[]{
 const value=normalize(query);
 if(!value)return [];
 const plain=['lettuce','生菜'].includes(value);
 return rows.filter(row=>plain||row.aliases.some(alias=>normalize(alias)===value)).map(({ndb,name,english,energyKcal,protein,carbs,fat})=>({
  id:`usda-sr28-${ndb}`,name,unit:'g',source:'通用估算',energyKcal,protein,carbs,fat,sourceUrl,importedAt:'',marketDepartmentOverride:'蔬菜',
  serving:{grams:100,description:'100g · 生重可食部分'},
  labelEvidence:`USDA SR28 NDB ${ndb}：${english}。每100g生重可食部分；通用食物成分参考，非品牌商品标签。不含沙拉酱、油或其他配料。请按实际品种选择。`,
 }));
}
