import type {FoodNutrition} from './foodNutrition';
import type {GardenFood} from './foodGarden';
// Generic choices are estimates, not exact product matches. Edible weight excludes
// shells/bones. The user's purchased label can replace them through search/edit.
const rows:[string,string,number,string,number,number,number,number,string][]=[
 ['beef-medium','牛肉（中等肥 · 约18%脂肪）',100,'1掌心份量 · 生重',242,20,0,18,'按每100g蛋白20g、脂肪18g的示例配比估算，4/4/9换算，非特定部位标签'],
 ['beef-fatty','肥牛（约28%脂肪）',100,'1小盘 · 生重',320,17,0,28,'按每100g蛋白17g、脂肪28g的示例配比估算，4/4/9换算，非特定部位标签'],
 ['clams','蚬子（去壳肉）',50,'1小份 · 去壳生重',86,14.67,3.57,.96,'通用蛤蜊肉估算；不含贝壳，种类有差异；USDA SR Legacy Mollusks clam mixed species raw'],
 ['basa','巴沙鱼（鱼柳）',100,'约1小片 · 生重',280/4.184,12.9,1,1.6,'参考Woolworths Basa Fillets 289591每100g标签，作为同类估算，实际以所购包装为准'],
 ['chicken-wing','鸡翅（带皮肉）',60,'约2只翅中可食肉 · 去骨生重',191,17.52,0,12.85,'USDA通用生鸡翅肉和皮估算；数量约值，称去骨可食部分，烹调油酱另计'],
 ['chicken-leg','鸡腿（带皮肉）',100,'约1只鸡腿可食肉 · 去骨生重',161,18.08,0,9.2,'USDA通用生鸡腿肉和皮估算；数量约值，称去骨可食部分，烹调油酱另计'],
 ['whole-chicken','整鸡（分餐可食肉）',150,'1餐份 · 去骨带皮生肉',215,18.6,0,15.06,'USDA通用整鸡肉和皮估算；一餐份非整只，去骨称重，烹调油酱另计'],
 ['pork-tenderloin','猪里脊',100,'1掌心份量 · 生重',120,20.65,0,3.53,'USDA通用生猪里脊估算；去可见外部肥油，烹调油酱另计'],
 ['pork-ribs','猪排骨（可食肉）',100,'约3小块可食肉 · 去骨生重',277,15.47,0,23.4,'USDA通用生猪排骨肉脂估算；不含骨头，数量约值，油酱另计'],
 ['pork-belly','猪五花肉',80,'约4片厚切 · 生重',1290/4.184,18.6,1,26.2,'参考Woolworths Pork Belly Thinly Sliced 488351每100g标签，作为同类估算，肥瘦差异大']
];
export function kitchenMeats():GardenFood[]{return rows.map(([id,name,amount,caption,energyKcal,protein,carbs,fat,labelEvidence])=>{
 const label:FoodNutrition={id:'garden-'+id,name,unit:'g',source:'通用估算',energyKcal,protein,carbs,fat,labelEvidence,importedAt:'',serving:{grams:amount,description:caption},marketDepartmentOverride:/clams|basa/.test(id)?'海鲜':'肉类'};
 return {id:label.id,name,label,amount,caption,frequency:0,icon:''};
})}
