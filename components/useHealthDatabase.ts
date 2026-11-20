"use client";
import {useCallback,useEffect,useState,useSyncExternalStore} from "react";
import {HealthClient} from "@/lib/health/client";
import type {HealthData} from "@/lib/health/data";
export function useHealthDatabase(){
 const [client]=useState(()=>new HealthClient());const view=useSyncExternalStore(client.subscribe,client.getSnapshot,client.getSnapshot);
 useEffect(()=>{void client.start(localStorage);const refresh=()=>void client.refresh(),timer=setInterval(refresh,3000);const unload=(e:BeforeUnloadEvent)=>{if(client.dirty()){e.preventDefault();e.returnValue=""}};window.addEventListener("focus",refresh);window.addEventListener("beforeunload",unload);document.addEventListener("visibilitychange",refresh);return()=>{clearInterval(timer);window.removeEventListener("focus",refresh);window.removeEventListener("beforeunload",unload);document.removeEventListener("visibilitychange",refresh)}},[client]);
 const setEntries=useCallback((v:HealthData["entries"]|((p:HealthData["entries"])=>HealthData["entries"]))=>client.update("entries",v),[client]);
 const setCatalog=useCallback((v:HealthData["catalog"]|((p:HealthData["catalog"])=>HealthData["catalog"]))=>client.update("catalog",v),[client]);
 const setGoal=useCallback((v:number)=>client.update("goal",v),[client]),setCalGoal=useCallback((v:number)=>client.update("calGoal",v),[client]);
 const setPlan=useCallback((date:string,value:HealthData["plans"][string])=>client.update("plans",p=>({...p,[date]:value})),[client]);
 return{...view,client,setEntries,setCatalog,setGoal,setCalGoal,setPlan};
}
