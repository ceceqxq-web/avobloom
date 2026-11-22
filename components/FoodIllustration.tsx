 'use client';
import {useId} from 'react';
import {foodArtwork,fallbackFoodArtwork} from '@/lib/foodArtwork';
import type {MarketDepartment} from '@/lib/gardenCategories';
/** A square viewBox keeps each atlas cell's original aspect ratio in any slot. */
export default function FoodIllustration({name,ratio=1,fatPer100,department,artworkName,imageUrl}:{name:string;ratio?:number;amount?:number;fatPer100?:number|null;department?:MarketDepartment;artworkName?:string;imageUrl?:string|null}){
 const clipId=useId().replace(/:/g,''),matched=foodArtwork(artworkName||name,fatPer100),art=matched??fallbackFoodArtwork(name,department);
 const productPhoto=(artworkName==='商品图片'||(!artworkName&&/花生酱|peanut butter|tahini|芝麻酱/i.test(name)))&&imageUrl&&/^https:\/\//i.test(imageUrl)?imageUrl:null;
 const rows=art.atlas===3?3:4,edge=productPhoto||art.src?0:art.atlas>=3?2:0;
 return <span className="food-illustration watercolor-art" role="img" aria-label={`${name}，${productPhoto?"商品图片":(matched?"食物":"类别")+"水彩示意"}，${Number(ratio.toFixed(2))}份`} title={`${productPhoto?"商品图片":matched?"食物示意图":"按类别匹配的示意图，非商品实拍"}；实际品种与分量见文字`}><svg className="watercolor-art-image" viewBox={`${productPhoto?0:art.cell%4*100+edge} ${productPhoto?0:Math.floor(art.cell/4)*100+edge} ${100-edge*2} ${100-edge*2}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{width:'100%',height:'100%',display:'block',overflow:'hidden'}}><defs><clipPath id={clipId}><rect x={productPhoto?0:art.cell%4*100+edge} y={productPhoto?0:Math.floor(art.cell/4)*100+edge} width={100-edge*2} height={100-edge*2}/></clipPath></defs><image clipPath={`url(#${clipId})`} href={productPhoto??art.src??`/brand/watercolor-food-atlas-v${art.atlas}.png`} width={productPhoto||art.src?100:400} height={productPhoto||art.src?100:rows*100} preserveAspectRatio="xMidYMid meet"/></svg></span>;
}
