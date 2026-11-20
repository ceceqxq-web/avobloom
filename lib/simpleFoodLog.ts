import {inputEnergy} from './inputEnergy.ts';
import type {FoodNutrition} from './foodNutrition';
export type ParsedFood={name:string;rawInput:string;quantityText:string;amount:number;unit:'g'|'mL';energyKcal:number;protein:number;carbs:number;fat:number;assumptions:string;searchQuery:string;count:number|null;countUnit:string|null;explicitTotalKcal?:number|null};
export const foodInputSchema={type:'object',additionalProperties:false,properties:{items:{type:'array',items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},rawInput:{type:'string'},quantityText:{type:'string'},amount:{type:'number'},unit:{type:'string',enum:['g','mL']},energyKcal:{type:'number'},protein:{type:'number'},carbs:{type:'number'},fat:{type:'number'},assumptions:{type:'string'},searchQuery:{type:'string'},count:{type:['number','null']},countUnit:{type:['string','null']},explicitTotalKcal:{type:['number','null']}},required:['name','rawInput','quantityText','amount','unit','energyKcal','protein','carbs','fat','assumptions','searchQuery','count','countUnit','explicitTotalKcal']}}},required:['items']};
export function validateParsedFood(value:ParsedFood){
 if(!value||typeof value.name!=='string'||!value.name.trim()||value.name.length>160||!['g','mL'].includes(value.unit)||!Number.isFinite(value.amount)||value.amount<=0||value.amount>10000)throw new Error('无法确定食物或分量，请补充名称和数量。');
 for(const k of ['energyKcal','protein','carbs','fat'] as const)if(!Number.isFinite(value[k])||value[k]<0||value[k]>(k==='energyKcal'?1000:100))throw new Error('估算结果无效，请补充描述。');
 if(value.protein+value.carbs+value.fat>110)throw new Error('估算营养值不合理。');
 for(const key of ['rawInput','quantityText','assumptions','searchQuery'] as const)if(typeof value[key]!=='string'||value[key].length>1500)throw new Error('食物描述无效。');
 if(value.count!=null&&(!Number.isFinite(value.count)||value.count<=0)||value.countUnit!=null&&typeof value.countUnit!=='string')throw new Error('份量无效。');return value;
}
export function resolvedSimpleFood(parsed:ParsedFood,product:FoodNutrition|null){
 validateParsedFood(parsed);let amount=parsed.amount,portionNote='';
 if(product&&product.unit!==parsed.unit)product=null;
 if(product&&parsed.count!=null&&parsed.countUnit){const serving=product.serving,size=product.unit==='g'?serving?.grams:serving?.millilitres;const unit=parsed.countUnit.toLowerCase();if(size&&['份','serving','servings','serve'].includes(unit)){amount=parsed.count*size;portionNote='采用商品标签每份规格'}else if(size&&serving?.quantity&&serving.quantityUnit&&(unit===serving.quantityUnit.toLowerCase()||/^(?:片|块|个|颗|粒|piece|pieces|cracker|crackers|biscuit|biscuits|slice|slices)$/.test(unit)&&/^(?:片|块|个|颗|粒|piece|pieces|cracker|crackers|biscuit|biscuits|slice|slices)$/.test(serving.quantityUnit.toLowerCase()))){amount=parsed.count/serving.quantity*size;portionNote='采用商品标签每份个数与重量'}else portionNote='商品标签未提供对应个数，重量仍为AI估算';}
 const stated=inputEnergy(parsed.rawInput,amount,parsed.unit,parsed.count);
 const f=product??{id:`ai-estimate-${crypto.randomUUID()}`,name:parsed.name,energyKcal:stated?stated.kcal/amount*100:parsed.energyKcal,protein:parsed.protein,carbs:parsed.carbs,fat:parsed.fat,unit:parsed.unit,source:'AI估算' as const,importedAt:new Date().toISOString(),labelEvidence:parsed.assumptions};
 if(parsed.explicitTotalKcal!=null&&(!Number.isFinite(parsed.explicitTotalKcal)||parsed.explicitTotalKcal<0||parsed.explicitTotalKcal>100000))throw new Error("输入热量无效");
 const ratio=amount/100,round=(n:number)=>Math.round(n*1e6)/1e6;
 return{name:product?.name??parsed.name,quantityText:parsed.quantityText,amount,amountUnit:f.unit,energyKcal:stated?round(stated.kcal):round(f.energyKcal*ratio),protein:round(f.protein*ratio),carbs:round(f.carbs*ratio),fat:round(f.fat*ratio),foodLabel:f,foodInput:parsed.rawInput,recordNote:(stated?`输入热量换算：${round(stated.kcal)}千卡；${stated.note}，热量以输入为准；`:"")+(product?`优先使用${f.source}营养标签${f.sourceUrl?' '+f.sourceUrl:''}；${portionNote||'按输入重量/体积换算'}；${parsed.assumptions}`:`AI估算（非商品标签）：${parsed.assumptions}；可在编辑中查询和修改`)};
}
export async function structuredFoodRequest(instructions:string,input:unknown,schema:object,name:string){
 if(!process.env.OPENAI_API_KEY)throw new Error('尚未配置估算服务。');
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({model:process.env.OPENAI_NUTRITION_MODEL||process.env.OPENAI_MODEL||'gpt-5.5',store:false,input:[{role:'system',content:instructions},{role:'user',content:JSON.stringify(input)}],text:{format:{type:'json_schema',name,strict:true,schema}}})});
 if(!response.ok)throw new Error(response.status===429?'估算服务繁忙或额度不足，请稍后再试。':'估算服务暂不可用，输入已保留。');
 const result=await response.json();const text=(result.output??[]).flatMap((item:{content?:{type:string;text?:string}[]})=>item.content??[]).filter((item:{type:string})=>item.type==='output_text').map((item:{text:string})=>item.text).join('');if(!text)throw new Error('未返回可靠结果，请补充描述。');return JSON.parse(text);
}
