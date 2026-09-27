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

function Branch({section,index}:{section:any;index:number}){
 return <section className="mm-branch" style={{"--branch":COLORS[index%COLORS.length]} as React.CSSProperties}>
  <AiIllustration path={section.illustration} alt={section.title}/>
  <h3><span aria-hidden="true">{ICONS[section.type]||"◆"}</span>{section.title}</h3>
  {section.explanation&&<p className="mm-explanation">{section.explanation}</p>}
  <ul>{section.items.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul>
 </section>
}

function MindMap({proposal,hideTitle}:{proposal:any;hideTitle?:boolean}){
 const sections=sectionsOf(proposal);const center=centerOf(proposal);
 return <div className="visual-presentation">
  <PresentationIntro proposal={proposal} hideTitle={hideTitle}/>
  <div className="mindmap" role="group" aria-label={`Carte mentale : ${center}`}>
   <div className="mm-center"><small>IDÉE CENTRALE</small><strong>{center}</strong></div>
   <div className="mm-branches">{sections.map((s:any,i:number)=><Branch key={i} section={s} index={i}/>)}</div>
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
