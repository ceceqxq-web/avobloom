// Kitchen references are explicit app assumptions, not exact mass/volume conversions.
type Reference={amount:number;unit:string;basis:string};
const references:Record<string,Reference>={
 chickpeas:{amount:150,unit:'小饭碗',basis:'1小饭碗熟鹰嘴豆按150 g估算'},
 fungus:{amount:100,unit:'小饭碗',basis:'1小饭碗泡发熟木耳按100 g估算，非干重'},
 mixedberries:{amount:50,unit:'小把',basis:'1小把混合莓果按50 g估算'},
 fries:{amount:100,unit:'小碗',basis:'1小碗冷冻薯条按100 g估算'},
 jam:{amount:7,unit:'平小勺',basis:'1平小勺果酱按7 g估算'},
 peanutbutter:{amount:5,unit:'平小勺',basis:'1平小勺花生酱按5 g估算'},
 chia:{amount:4,unit:'平小勺',basis:'1平小勺干奇亚籽按4 g估算'},
 wholeyogurt:{amount:15,unit:'平大勺',basis:'1平大勺酸奶按15 g估算'},
 rawrice:{amount:15,unit:'平大勺',basis:'1平大勺生米按15 g估算，非熟饭'},
 milkpowder:{amount:8,unit:'平大勺',basis:'1平大勺干奶粉按8 g估算'},
 crackers:{amount:7,unit:'片',basis:'1片普通薄脆饼干按7 g估算，实际以包装为准'},
 pear:{amount:170,unit:'个',basis:'1个去核中等梨按170 g估算'},
 cannedfish:{amount:95,unit:'小罐',basis:'1小罐沥水鱼肉按95 g估算，以包装净含量为准'},
 firmtofu:{amount:100,unit:'块',basis:'1块老豆腐按100 g估算'},

 oil:{amount:4.5,unit:'小勺',basis:'1平小勺=5 mL，油约4.5 g'},
 rice:{amount:150,unit:'饭碗',basis:'1小饭碗熟饭按150 g估算'},
 quinoa:{amount:150,unit:'饭碗',basis:'1小饭碗熟藜麦按150 g估算'},
 pasta:{amount:150,unit:'饭碗',basis:'1小饭碗熟意面按150 g估算'},
 oats:{amount:10,unit:'平大勺',basis:'1平大勺干燕麦按10 g估算'},
 bread:{amount:30,unit:'片',basis:'1片面包按30 g估算'},
 egg:{amount:50,unit:'个',basis:'1个去壳熟鸡蛋按50 g估算'},
 white:{amount:33,unit:'个蛋白',basis:'1个熟蛋白按33 g估算'},
 milk:{amount:250,unit:'杯',basis:'1杯=250 mL'},
 soymilk:{amount:250,unit:'杯',basis:'1杯=250 mL'},
 yogurt:{amount:15,unit:'平大勺',basis:'1平大勺酸奶按15 g估算'},
 skyr:{amount:15,unit:'平大勺',basis:'1平大勺酸奶按15 g估算'},
 tofu:{amount:100,unit:'块',basis:'1块豆腐按100 g估算'},
 potato:{amount:150,unit:'个',basis:'1个去皮中等土豆按150 g估算'},
 banana:{amount:100,unit:'根',basis:'1根去皮香蕉按100 g估算'},
 orange:{amount:130,unit:'个',basis:'1个去皮橙子按130 g估算'},
 apple:{amount:150,unit:'个',basis:'1个去核苹果按150 g估算'},
 almond:{amount:1.2,unit:'颗',basis:'1颗去壳杏仁按1.2 g估算'},
 walnut:{amount:5,unit:'份核桃仁',basis:'1份核桃仁按5 g估算'},
 blueberry:{amount:50,unit:'小把',basis:'1小把蓝莓按50 g估算'},
 broccoli:{amount:100,unit:'小饭碗',basis:'1小饭碗熟西兰花按100 g估算'},
 spinach:{amount:100,unit:'小饭碗',basis:'1小饭碗熟菠菜按100 g估算'},
 carrot:{amount:100,unit:'根',basis:'1根中等胡萝卜可食部分按100 g估算'},
 tomato:{amount:150,unit:'个',basis:'1个中等番茄按150 g估算'},
 chicken:{amount:90,unit:'掌心份',basis:'1掌心去皮熟鸡肉按90 g估算，不含手指'},
 beef:{amount:90,unit:'掌心份',basis:'1掌心熟牛肉按90 g估算，不含手指'},
 cod:{amount:100,unit:'掌心份',basis:'1掌心熟鱼肉按100 g估算，不含手指'},
 salmon:{amount:100,unit:'掌心份',basis:'1掌心熟鱼肉按100 g估算，不含手指'},
 shrimp:{amount:10,unit:'只虾仁',basis:'1只去壳熟虾仁按10 g估算'},
};
export function householdPortion(foodId:string,amount:number){
 const ref=references[foodId];
 if(!ref||!Number.isFinite(amount)||amount<=0)return{text:'暂无',basis:'暂无可靠的日常用量参照，请按重量称量'};
 const ratio=amount/ref.amount;
 const quantity=ratio<.1?'<0.1':String(Math.round(ratio*10)/10);
 return{text:`约 ${quantity} ${ref.unit}`,basis:ref.basis};
}
