'use client';
import {useId} from 'react';
import {useAppearance} from './AppearancePicker';
const columnFor={garden:0,workbench:1,journal:2};
function AtlasCrop({src,x,y,width,height,atlasWidth,atlasHeight}:{src:string;x:number;y:number;width:number;height:number;atlasWidth:number;atlasHeight:number}){const id=useId().replaceAll(':','');return <svg viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id={id}><rect x={x} y={y} width={width} height={height}/></clipPath></defs><image href={src} width={atlasWidth} height={atlasHeight} clipPath={`url(#${id})`}/></svg>}
export function PosterHero(){const [theme]=useAppearance();return <div className="poster-hero-art" aria-hidden="true"><AtlasCrop src="/brand/avobloom-theme-scenes-v1.png" x={columnFor[theme]*512} y={90} width={512} height={350} atlasWidth={1536} atlasHeight={1024}/></div>}
/** Decoration never defines the size or the safe content area of a module. */
export function PosterModuleTrim(){return <span className="poster-module-trim" aria-hidden="true">{[0,1,2,3].map(index=><span key={index} className={`module-grass-corner corner-${index}`}><AtlasCrop src="/brand/avobloom-theme-scenes-v1.png" x={index%2?412:0} y={index<2?640:810} width={100} height={100} atlasWidth={1536} atlasHeight={1024}/></span>)}</span>}
/** The platter canvas and SVG have the same fixed ratio, so its art is never stretched. */
export function PosterPlatter(){const [theme]=useAppearance();return <div className="platter-illustration" aria-hidden="true"><AtlasCrop src="/brand/avobloom-shallow-platters-v1.png" x={0} y={columnFor[theme]*341} width={1536} height={341} atlasWidth={1536} atlasHeight={1024}/></div>}
