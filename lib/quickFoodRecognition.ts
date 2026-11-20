import type { FoodNutrition } from "./foodNutrition";
export type QuickFood={name:string;quantityText:string;energyKcal:number|null;recordNote:string;amount:number|null;protein:number|null;carbs:number|null;fat:number|null;amountUnit?:"g"|"mL"};
type Reference={aliases:string[];mass:number|null;units:string[];unit:"g"|"mL";kcal:number;protein:number;carbs:number;fat:number};
// Approximate generic edible portions, not branded nutrition labels. Orange: USDA SR 09200,
// 47 kcal/100g; medium edible portion 131g (Canadian Nutrient File serving 1722).
const common:Reference[]=[
 {aliases:["橙子","橙","鲜橙","orange"],mass:131,units:["个","只"],unit:"g",kcal:47,protein:.94,carbs:11.75,fat:.12},
 {aliases:["苹果","apple"],mass:182,units:["个","只"],unit:"g",kcal:52,protein:.26,carbs:13.81,fat:.17},
 {aliases:["香蕉","banana"],mass:118,units:["根","个"],unit:"g",kcal:89,protein:1.09,carbs:22.84,fat:.33},
 {aliases:["芒果","mango"],mass:200,units:["个","只"],unit:"g",kcal:60,protein:.82,carbs:14.98,fat:.38},
 {aliases:["鸡蛋","水煮蛋","煮鸡蛋","白煮蛋","egg"],mass:50,units:["个","颗","只","枚"],unit:"g",kcal:155,protein:12.58,carbs:1.12,fat:10.61},
 {aliases:["杏仁","almond","almonds"],mass:1.2,units:["颗","个","粒"],unit:"g",kcal:579,protein:21.15,carbs:21.55,fat:49.93},
 {aliases:["东北玉米","糯玉米","东北糯玉米"],mass:150,units:["根","个"],unit:"g",kcal:172,protein:4.7,carbs:33.4,fat:1.9},
 {aliases:["米饭","熟米饭","白米饭"],mass:150,units:["碗"],unit:"g",kcal:116,protein:2.6,carbs:25.9,fat:.3},
 {aliases:["牛奶","全脂牛奶","milk"],mass:250,units:["杯"],unit:"mL",kcal:61,protein:3.2,carbs:4.8,fat:3.6},
 {aliases:["鸡胸肉","生鸡胸肉"],mass:null,units:[],unit:"g",kcal:120,protein:23,carbs:0,fat:1.9},
 {aliases:["西兰花"],mass:null,units:[],unit:"g",kcal:34,protein:2.8,carbs:6.6,fat:.4},
];
const round=(n:number)=>Math.round(n*1000)/1000;
function numeric(text:string):number{
 if(text==="半")return .5;if(text.includes("/")){const[a,b]=text.split("/").map(Number);return a/b}
 if(/^[\d.]+$/.test(text))return Number(text);
 const digits:Record<string,number>={零:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};let total=0,current=0;
 for(const c of text){if(c==="十"){total+=(current||1)*10;current=0}else if(c==="百"){total+=(current||1)*100;current=0}else current=digits[c]??NaN}return total+current;
}
const number="(?:\\d+(?:\\.\\d+)?(?:/\\d+(?:\\.\\d+)?)?|[零一二两三四五六七八九十百半]+)";
const units="(?:千克|公斤|毫升|克|kg|ml|g|升|l|个|颗|根|块|片|粒|只|枚|碗|杯|袋|包|份|条)";
const normalized=(text:string)=>text.toLowerCase().replace(/\s/g,"");
function nullable(raw:string){if(!raw)return null;const n=Number(raw);if(!Number.isFinite(n)||n<0)throw new Error("重量和营养值须为非负数字。");return n}
function legacy(line:string):QuickFood{
 const [name,quantityText,e="",recordNote="",w="",p="",c="",f=""]=line.split("|").map(s=>s.trim());if(!name||!quantityText)throw new Error("请填写食物名称和数量。");return{name,quantityText,energyKcal:nullable(e),recordNote,amount:nullable(w),protein:nullable(p),carbs:nullable(c),fat:nullable(f)};
}
export function recognizeQuickFoods(text:string,catalog:FoodNutrition[]=[]):QuickFood[]{
 const separator=new RegExp(`[,，](?=\\s*${number}\\s*${units})`,"gi");
 const lines=text.split(/\r?\n|[;；、]/).flatMap(s=>s.includes("|")?[s]:s.split(separator)).map(s=>s.trim()).filter(Boolean);
 if(!lines.length)throw new Error("输入食物和数量，例如：1个橙子。");if(lines.length>50)throw new Error("一次最多识别 50 项食物。");
 return lines.map(raw=>{
  if(raw.includes("|"))return legacy(raw);
  const line=raw.replace(/^[•·\-]\s*/,"").replace(/^(?:早餐|午餐|晚餐|加餐)[：:]\s*/,"");
  const energyMatch=line.match(/(?:总共|合计|总热量|共|每块|每个|每份|每片|每颗|每100\s*(?:g|克|ml|毫升))?\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(大卡|千卡|kcal|kJ|千焦)/i);
  const body=(energyMatch?line.replace(energyMatch[0],""):line).replace(/[,，。]\s*$/,"").trim();
  let qty:number,unit:string,name:string;
  const front=body.match(new RegExp(`^(${number})\\s*(${units})\\s*(.+)$`,"i"));
  const back=body.match(new RegExp(`^(.+?)\\s*(${number})\\s*(${units})$`,"i"));
  const noUnit=body.match(new RegExp(`^(${number})\\s*([^\\d].+)$`,"i"));
  if(front){qty=numeric(front[1]);unit=front[2];name=front[3]}
  else if(back){name=back[1];qty=numeric(back[2]);unit=back[3]}
  else if(noUnit){qty=numeric(noUnit[1]);unit="个";name=noUnit[2]}
  else throw new Error(`「${raw}」还缺少数量，请写成「1个橙子」或「150g米饭」。`);
  name=name.replace(/[,，。:：]+$/g,"").trim();if(!name||!Number.isFinite(qty)||qty<=0||qty>100000)throw new Error(`「${raw}」的食物或数量无法识别。`);
  const massUnit=unit.toLowerCase();let amount:number|null=null,amountUnit:"g"|"mL"|undefined;
  if(["g","克","kg","千克","公斤"].includes(massUnit)){amount=qty*(["kg","千克","公斤"].includes(massUnit)?1000:1);amountUnit="g"}
  else if(["ml","毫升","l","升"].includes(massUnit)){amount=qty*(["l","升"].includes(massUnit)?1000:1);amountUnit="mL"}
  const product=catalog.find(p=>normalized(p.name)===normalized(name));
  const ref=common.find(p=>p.aliases.some(alias=>normalized(alias)===normalized(name)));
  let energyKcal:number|null=null,protein:number|null=null,carbs:number|null=null,fat:number|null=null;const notes:string[]=[];
  if(product){
   if(amount==null)amountUnit=product.unit;
   const servingAmount=product.unit==="g"?product.serving?.grams:product.serving?.millilitres;
   if(amount==null&&unit==="份"&&servingAmount)amount=qty*servingAmount;
   else if(amount==null&&product.serving?.quantity&&servingAmount&&unit===product.serving.quantityUnit)amount=qty/product.serving.quantity*servingAmount;
   if(amount!=null&&amountUnit===product.unit){energyKcal=product.energyKcal*amount/100;protein=product.protein*amount/100;carbs=product.carbs*amount/100;fat=product.fat*amount/100;notes.push("匹配本机商品库标签")}
  }else if(ref){
   if(amount==null&&ref.mass&&ref.units.includes(unit)){amount=qty*ref.mass;amountUnit=ref.unit;notes.push(`估算：每${unit}可食部分约${ref.mass}${ref.unit}`)}
   if(amount!=null&&(amountUnit===ref.unit)){energyKcal=ref.kcal*amount/100;protein=ref.protein*amount/100;carbs=ref.carbs*amount/100;fat=ref.fat*amount/100;notes.push(`常见食物营养估算（每100${ref.unit}约${ref.kcal}千卡）`);if(ref.aliases.includes("鸡蛋"))notes.push("按水煮、不额外加油估算")}
  }
  if(energyMatch){const factor=/kj|千焦/i.test(energyMatch[2])?1/4.184:1;const value=Number(energyMatch[1])*factor;
   if(/每100/i.test(energyMatch[0])){const statedUnit=/每100\s*(?:ml|毫升)/i.test(energyMatch[0])?"mL":"g";energyKcal=amount==null||amountUnit!==statedUnit?null:value*amount/100;notes.push(`按输入的每100${statedUnit}热量换算`)}
   else if(/每[块个份片颗]/.test(energyMatch[0])){if(["g","克","kg","千克","公斤","ml","毫升","l","升"].includes(massUnit)){energyKcal=null;notes.push("已写每份热量，但缺少每份重量，待补全")}else{energyKcal=value*qty;notes.push("按输入的每单位热量换算")}}
   else {energyKcal=value;notes.push("输入的热量按本项合计记录")}
  }
  if(energyKcal==null)notes.push("暂无可靠热量，保存为待补全");
  if(protein==null)notes.push("三大营养素暂无");
  return{name,quantityText:`${qty}${unit}`,amount:amount==null?null:round(amount),amountUnit,energyKcal:energyKcal==null?null:round(energyKcal),protein:protein==null?null:round(protein),carbs:carbs==null?null:round(carbs),fat:fat==null?null:round(fat),recordNote:notes.join("；")};
 });
}
