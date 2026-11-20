"use client";
import {useEffect,useRef,useState} from 'react';
import type {HealthEntry} from '@/lib/foodRecord';
import type {WeightPlan} from '@/lib/weightGoal';
import {goalAchievement} from '@/lib/goalAchievement';
import './goal-celebration.css';
export default function GoalCelebration({entries,goal,plan,today,ready,onReview}:{entries:HealthEntry[];goal:number;plan:WeightPlan|undefined;today:string;ready:boolean;onReview:()=>void}){
 const achievement=ready?goalAchievement(entries,goal,plan,today):null,key=achievement?.key;
 const [visible,setVisible]=useState(false),[cheered,setCheered]=useState(false);
 const shown=useRef(new Set<string>()),closeButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!key)return;
  const storageKey='wellgrove-achievement:'+key;
  const show=()=>{if(shown.current.has(key))return;try{if(localStorage.getItem(storageKey))return;localStorage.setItem(storageKey,'seen')}catch{/* In-memory deduplication still works if storage is unavailable. */}shown.current.add(key);setCheered(false);setVisible(true)};
  const timer=window.setTimeout(show,0);return()=>window.clearTimeout(timer);
 },[key]);
 useEffect(()=>{
  if(!visible)return;
  const previous=document.activeElement as HTMLElement|null;closeButton.current?.focus();
  const handle=(event:KeyboardEvent)=>{if(event.key==='Escape')setVisible(false);if(event.key==='Tab'){const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('.gc-dialog button'));const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}};
  document.addEventListener('keydown',handle);return()=>{document.removeEventListener('keydown',handle);previous?.focus()};
 },[visible]);
 if(!visible||!achievement)return null;
 return <div className="gc-overlay" onClick={()=>setVisible(false)}><section className="gc-dialog" role="dialog" aria-modal="true" aria-labelledby="gc-title" onClick={e=>e.stopPropagation()}><button ref={closeButton} className="gc-close" aria-label="关闭达标祝贺" onClick={()=>setVisible(false)}>×</button><div className="gc-sprout" aria-hidden="true">🌱 ✨</div><p className="gc-eyebrow">WELLGROVE · 一个值得纪念的时刻</p><h2 id="gc-title">恭喜，达成体重目标！</h2><p>你在 {achievement.date} 的体重记录为 <strong>{achievement.weight} kg</strong>，已达到 {achievement.goal} kg 的目标。</p><p>谢谢你认真照顾自己。接下来可以回顾这段旅程，逐步转向维持与健康习惯。</p><button className="gc-cheer" onClick={()=>setCheered(true)}>{cheered?'🌿 为每一份坚持喝彩！':'🙌 和自己击个掌'}</button><p className="gc-response" aria-live="polite">{cheered?'今天，为自己开心一下。健康成长，每一步都算数。':'体重会自然波动，一次达标也是值得记录的里程碑。'}</p><button className="gc-review" onClick={()=>{setVisible(false);onReview()}}>回顾目标与下一步</button><button className="gc-later" onClick={()=>setVisible(false)}>继续记录我的一天</button></section></div>;
}
