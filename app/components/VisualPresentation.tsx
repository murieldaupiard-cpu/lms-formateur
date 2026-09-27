import {useEffect,useMemo,useRef,useState} from 'react';
import './visual.css';
import {AiIllustration} from './AiIllustration';
const ICONS:Record<string,string>={context:"🧭",skills:"🎯",steps:"🪜",checklist:"✅",product:"📦",target:"👥",warning:"⚠️",resources:"📚",duration:"⏱️",arguments:"💬",level:"📶",timeline:"🗓️"};
const COLORS=["#72c9ff","#8d55ff","#f0a23b","#6ed66f","#f05285","#3f8cff","#2dd4bf","#e879f9"];
export const visualLayouts=["mindmap","infographic"];
export function isVisualLayout(layout:unknown){return typeof layout==="string"&&visualLayouts.includes(layout)}
const sectionsOf=(p:any)=>(Array.isArray(p?.sections)?p.sections:[]).filter((s:any)=>s&&Array.isArray(s.items)&&s.items.length);
const list=(v:unknown)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==="string"&&!!x.trim()):[];
/** En-tête commun : intitulé exact, texte d’explication et objectifs de la compétence. */
export function PresentationIntro({proposal,hideTitle}:{proposal:any;hideTitle?:boolean}){
 const objectives=list(proposal?.objectives);const competence=proposal?.kind==="competence";
 return <header className="presentation-intro">
  {!hideTitle&&proposal?.title&&<><small>{competence?"COMPÉTENCE":"CONTENU PÉDAGOGIQUE"}</small><h2>{proposal.title}</h2></>}
  {proposal?.intro&&<p>{proposal.intro}</p>}
  {objectives.length>0&&<div className="presentation-objectives"><strong>{competence?"Objectifs de la compétence":"Objectifs"}</strong><span>{competence?"À l’issue de cette compétence, vous serez capable de :":"À l’issue de ce contenu, vous serez capable de :"}</span><ol>{objectives.map((o,i)=><li key={i}>{o.replace(/^être capable (?:de\s+|d[’'])/i,"").replace(/^./,c=>c.toUpperCase())}</li>)}</ol></div>}
 </header>;
}

function centerOf(p:any){if(typeof p?.title==="string"&&p.kind==="competence"&&p.title.trim())return p.title.trim();if(typeof p?.center==="string"&&p.center.trim())return p.center.trim();const first=String(p?.intro||"").split(/(?<=[.!?])\s+/)[0]||"";return first&&first.length<=90?first:"Idée centrale"}

type Link={d:string;color:string;width:number};

/** Relie deux éléments par une courbe, dans le repère du conteneur. */
function connect(a:DOMRect,b:DOMRect,o:DOMRect,fromMiddle=false){
 const ax=a.left-o.left,ay=a.top-o.top,bx=b.left-o.left,by=b.top-o.top;
 if(bx>=ax+a.width-4){const x1=ax+a.width,y1=ay+a.height/2,x2=bx,y2=by+b.height/2,m=(x2-x1)/2;return `M${x1},${y1} C${x1+m},${y1} ${x2-m},${y2} ${x2},${y2}`}
 if(bx+b.width<=ax+4){const x1=ax,y1=ay+a.height/2,x2=bx+b.width,y2=by+b.height/2,m=(x1-x2)/2;return `M${x1},${y1} C${x1-m},${y1} ${x2+m},${y2} ${x2},${y2}`}
 const x1=ax+(fromMiddle?a.width/2:Math.min(20,a.width/2)),y1=ay+a.height,x2=bx,y2=by+b.height/2;
 return `M${x1},${y1} L${x1},${y2-10} Q${x1},${y2} ${x1+10},${y2} L${x2},${y2}`;
}

function Branch({section,index,side}:{section:any;index:number;side:"left"|"right"}){
 return <section className={`mm2-branch mm2-${side}`} style={{"--branch":COLORS[index%COLORS.length]} as React.CSSProperties}>
  <div className="mm2-node" data-node={index}>
   <AiIllustration path={section.illustration} alt={section.title}/>
   <h3><span aria-hidden="true">{ICONS[section.type]||"◆"}</span>{section.title}</h3>
   {section.explanation&&<p className="mm-explanation">{section.explanation}</p>}
  </div>
  <ul className="mm2-leaves">{section.items.map((x:string,j:number)=><li key={j} data-leaf={`${index}-${j}`}>{x}</li>)}</ul>
 </section>
}

function MindMap({proposal,hideTitle}:{proposal:any;hideTitle?:boolean}){
 const sections=useMemo(()=>sectionsOf(proposal),[proposal]);const center=centerOf(proposal);
 const box=useRef<HTMLDivElement>(null);const [links,setLinks]=useState<Link[]>([]);const [size,setSize]=useState({w:0,h:0});const [mode,setMode]=useState<"radial"|"tree">("tree");
 // Répartit les branches à gauche et à droite en équilibrant leur hauteur.
 const sides=useMemo(()=>{const left:number[]=[],right:number[]=[];let wl=0,wr=0;const order=sections.map((s:any,i:number)=>({i,w:3+s.items.length+(s.explanation?2:0)})).sort((a:any,b:any)=>b.w-a.w);for(const {i,w} of order){if(wr<=wl){right.push(i);wr+=w}else{left.push(i);wl+=w}}left.sort((a,b)=>a-b);right.sort((a,b)=>a-b);return {left,right}},[sections]);
 useEffect(()=>{
  const el=box.current;if(!el)return;
  const draw=()=>{
   const o=el.getBoundingClientRect();const next:Link[]=[];
   setMode(o.width>=1100?"radial":"tree");
   const c=el.querySelector('[data-center]');if(!c)return;const cr=c.getBoundingClientRect();
   sections.forEach((s:any,i:number)=>{
    const n=el.querySelector(`[data-node="${i}"]`);if(!n)return;const nr=n.getBoundingClientRect();const color=COLORS[i%COLORS.length];
    next.push({d:connect(cr,nr,o,true),color,width:3});
    s.items.forEach((_:string,j:number)=>{const l=el.querySelector(`[data-leaf="${i}-${j}"]`);if(l)next.push({d:connect(nr,l.getBoundingClientRect(),o),color,width:1.5})});
   });
   setSize({w:o.width,h:o.height});setLinks(next);
  };
  const ro=new ResizeObserver(()=>requestAnimationFrame(draw));ro.observe(el);draw();
  return()=>ro.disconnect();
 },[sections,mode]);
 const branch=(i:number,side:"left"|"right")=><Branch key={i} section={sections[i]} index={i} side={side}/>;
 return <div className="visual-presentation">
  <PresentationIntro proposal={proposal} hideTitle={hideTitle}/>
  <div ref={box} className={`mm2 mm2-${mode}`} role="group" aria-label={`Carte mentale : ${center}`}>
   <svg className="mm2-links" width={size.w} height={size.h} aria-hidden="true">{links.map((l,i)=><path key={i} d={l.d} stroke={l.color} strokeWidth={l.width} fill="none" strokeLinecap="round" opacity={l.width>2?.85:.55}/>)}</svg>
   {mode==="radial"?<>
    <div className="mm2-side">{sides.left.map(i=>branch(i,"left"))}</div>
    <div className="mm2-center" data-center><small>IDÉE CENTRALE</small><strong>{center}</strong></div>
    <div className="mm2-side">{sides.right.map(i=>branch(i,"right"))}</div>
   </>:<>
    <div className="mm2-center" data-center><small>IDÉE CENTRALE</small><strong>{center}</strong></div>
    <div className="mm2-side">{sections.map((_:any,i:number)=>branch(i,"right"))}</div>
   </>}
  </div>
 </div>
}

function splitMetric(m:string){const x=m.trim().match(/^([+-]?\d[\d\s.,]*\s*(?:%|M€|k€|€|h|min|ans?|jours?)?)\s*(.*)$/i);return x?[x[1].trim(),x[2].trim()]:[m.trim(),""]}

function Infographic({proposal,hideTitle}:{proposal:any;hideTitle?:boolean}){
 const sections=sectionsOf(proposal);const metrics=list(proposal.metrics);const timeline=list(proposal.timeline);
 return <div className="visual-presentation infographic">
  <PresentationIntro proposal={proposal} hideTitle={hideTitle}/>
  {metrics.length>0&&<div className="ig-kpis">{metrics.map((m,i)=>{const [lead,rest]=splitMetric(m);return <div className="ig-kpi" key={i} style={{"--branch":COLORS[i%COLORS.length]} as React.CSSProperties}><strong>{lead}</strong>{rest&&<span>{rest}</span>}</div>})}</div>}
  {timeline.length>1&&<ol className="ig-timeline" aria-label="Chronologie">{timeline.map((t,i)=><li key={i}><span aria-hidden="true"/>{t}</li>)}</ol>}
  <div className="ig-grid">{sections.map((s:any,i:number)=><article className="ig-tile" key={i} style={{"--branch":COLORS[i%COLORS.length]} as React.CSSProperties}><AiIllustration path={s.illustration} alt={s.title}/><div className="ig-icon" aria-hidden="true">{ICONS[s.type]||"◆"}</div><h3>{s.title}</h3>{s.explanation&&<p className="ig-explanation">{s.explanation}</p>}<ul>{s.items.map((x:string,j:number)=><li key={j}>{x}</li>)}</ul></article>)}</div>
 </div>
}

export default function VisualPresentation({proposal,layout,hideTitle}:{proposal:any;layout:string;hideTitle?:boolean}){
 return layout==="infographic"?<Infographic proposal={proposal} hideTitle={hideTitle}/>:<MindMap proposal={proposal} hideTitle={hideTitle}/>;
}
