'use client';
import FoodIllustration from './FoodIllustration';
const choices=['果酱','草莓','蜂蜜','核桃','杏仁','花生','混合坚果','黑芝麻粒','奇亚籽','橄榄油','黄油','牛油果','鸡蛋','牛奶','酸奶','奶酪','cottage cheese','豆腐','鸡胸肉','牛肉','三文鱼','米饭','燕麦','意大利面','面包','年糕','西兰花','生菜','番茄','苹果','香蕉','梨','饼干','咖啡'];
export default function FoodArtworkPicker({name,value,onChange,imageUrl}:{name:string;value?:string;onChange:(value:string)=>void;imageUrl?:string|null}){
 return <details className="food-artwork-picker"><summary>配图不符？校准配图</summary><p>按食品的实际形态选择示意图；不改变名称、份量或营养数值。</p><label>配图类型<select aria-label="配图类型" value={value||''} onChange={e=>onChange(e.target.value)}><option value="">自动识别</option>{imageUrl&&<option>商品图片</option>}{choices.map(choice=><option key={choice}>{choice}</option>)}</select></label><FoodIllustration name={name} artworkName={value} imageUrl={imageUrl}/><small>{value?`已选：${value}`:'按食物名称自动匹配'}</small></details>;
}
