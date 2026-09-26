import './visual.css';
const ICONS:Record<string,string>={context:"🧭",skills:"🎯",steps:"🪜",checklist:"✅",product:"📦",target:"👥",warning:"⚠️",resources:"📚",duration:"⏱️",arguments:"💬",level:"📶",timeline:"🗓️"};
const COLORS=["#72c9ff","#8d55ff","#f0a23b","#6ed66f","#f05285","#3f8cff","#2dd4bf","#e879f9"];
export const visualLayouts=["mindmap","infographic"];
export function isVisualLayout(layout:unknown){return typeof layout==="string"&&visualLayouts.includes(layout)}
const sectionsOf=(p:any)=>(Array.isArray(p?.sections)?p.sections:[]).filter((s:any)=>s&&Array.isArray(s.items)&&s.items.length);
const list=(v:unknown)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==="string"&&!!x.trim()):[];
function centerOf(p:any){if(typeof p?.center==="string"&&p.center.trim())return p.center.trim();const first=String(p?.intro||"").split(/(?<=[.!?])\s+/)[0]||"";return first&&first.length<=90?first:"Idée centrale"}

function Branch({section,index}:{section:any;index:number}){
 return <section className="mm-branch" style={{"--branch":COLORS[index%COLORS.length]} as React.CSSProperties}>
  <h3><span aria-hidden="true">{ICONS[section.type]||"◆"}</span>{section.title}</h3>
  <ul>{section.items.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul>
 </section>
}

function MindMap({proposal}:{proposal:any}){
 const sections=sectionsOf(proposal);const half=Math.ceil(sections.length/2);const center=centerOf(proposal);
 return <div className="visual-presentation">
  <div className="mindmap" role="group" aria-label={`Carte mentale : ${center}`}>
   <div className="mm-side mm-left">{sections.slice(0,half).map((s:any,i:number)=><Branch key={i} section={s} index={i}/>)}</div>
   <div className="mm-center"><small>IDÉE CENTRALE</small><strong>{center}</strong></div>
   <div className="mm-side mm-right">{sections.slice(half).map((s:any,i:number)=><Branch key={i} section={s} index={i+half}/>)}</div>
  </div>
  {proposal.intro&&proposal.intro!==center&&<p className="visual-summary">{proposal.intro}</p>}
 </div>
}

function splitMetric(m:string){const x=m.trim().match(/^([+-]?\d[\d\s.,]*\s*(?:%|M€|k€|€|h|min|ans?|jours?)?)\s*(.*)$/i);return x?[x[1].trim(),x[2].trim()]:[m.trim(),""]}

function Infographic({proposal}:{proposal:any}){
 const sections=sectionsOf(proposal);const metrics=list(proposal.metrics);const timeline=list(proposal.timeline);
 return <div className="visual-presentation infographic">
  <header className="ig-head"><small>INFOGRAPHIE</small>{proposal.intro&&<p>{proposal.intro}</p>}</header>
  {metrics.length>0&&<div className="ig-kpis">{metrics.map((m,i)=>{const [lead,rest]=splitMetric(m);return <div className="ig-kpi" key={i} style={{"--branch":COLORS[i%COLORS.length]} as React.CSSProperties}><strong>{lead}</strong>{rest&&<span>{rest}</span>}</div>})}</div>}
  {timeline.length>1&&<ol className="ig-timeline" aria-label="Chronologie">{timeline.map((t,i)=><li key={i}><span aria-hidden="true"/>{t}</li>)}</ol>}
  <div className="ig-grid">{sections.map((s:any,i:number)=><article className="ig-tile" key={i} style={{"--branch":COLORS[i%COLORS.length]} as React.CSSProperties}><div className="ig-icon" aria-hidden="true">{ICONS[s.type]||"◆"}</div><h3>{s.title}</h3><ul>{s.items.map((x:string,j:number)=><li key={j}>{x}</li>)}</ul></article>)}</div>
 </div>
}

export default function VisualPresentation({proposal,layout}:{proposal:any;layout:string}){
 return layout==="infographic"?<Infographic proposal={proposal}/>:<MindMap proposal={proposal}/>;
}
