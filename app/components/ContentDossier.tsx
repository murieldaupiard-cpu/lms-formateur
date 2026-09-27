'use client';
import {useEffect,useId,useMemo,useState,type ReactNode} from 'react';
import {loadMedia,type SourceDocument} from '../lib/media';
import './content-dossier.css';

/**
 * Dossier à onglets, sur le modèle « Découvrir Primevère » (CADGA) :
 * onglet « L’essentiel » (texte + objectifs), onglets de contenu générés,
 * puis onglet « Documents » pour télécharger les supports d’origine.
 * La couleur d’accent est celle de la compétence ou de la séquence.
 */
type Fact={value:string;label:string};type Dated={date:string;text:string};type Group={title:string;subtitle?:string;items:string[]};
type Tab={title:string;heading:string;explanation:string;kind:string;facts:Fact[];timeline:Dated[];groups:Group[];items:string[];callout?:{title:string;text:string};sourceIds:string[]};

const str=(v:unknown)=>typeof v==="string"?v.trim():"";
const list=(v:unknown)=>Array.isArray(v)?v.map(str).filter(Boolean):[];

function tabsOf(proposal:any):Tab[]{
 return (Array.isArray(proposal?.sections)?proposal.sections:[]).map((s:any)=>({
  title:str(s?.title)||"Contenu",heading:str(s?.heading)||str(s?.title)||"Contenu",explanation:str(s?.explanation),kind:str(s?.kind)||str(s?.type),
  facts:(Array.isArray(s?.facts)?s.facts:[]).map((f:any)=>({value:str(f?.value),label:str(f?.label)})).filter((f:Fact)=>f.value||f.label),
  timeline:(Array.isArray(s?.timeline)?s.timeline:[]).map((t:any)=>({date:str(t?.date),text:str(t?.text)})).filter((t:Dated)=>t.date||t.text),
  groups:(Array.isArray(s?.groups)?s.groups:[]).map((g:any)=>({title:str(g?.title),subtitle:str(g?.subtitle),items:list(g?.items)})).filter((g:Group)=>g.title||g.items.length),
  items:list(s?.items),callout:s?.callout&&str(s.callout.text)?{title:str(s.callout.title),text:str(s.callout.text)}:undefined,sourceIds:list(s?.sourceIds),
 })).filter((t:Tab)=>t.explanation||t.items.length||t.facts.length||t.timeline.length||t.groups.length);
}

function PageImage({path,label}:{path:string;label:string}){
 const [url,setUrl]=useState('');
 useEffect(()=>{let active=true;let local='';loadMedia(path).then(b=>{if(active){local=URL.createObjectURL(b);setUrl(local)}}).catch(()=>{});return()=>{active=false;if(local)URL.revokeObjectURL(local)}},[path]);
 return <figure className="cd-figure">{url?<a href={url} target="_blank" rel="noreferrer" title="Agrandir"><img src={url} alt={label} loading="lazy"/></a>:<div className="cd-figure-wait" role="status">Chargement du visuel…</div>}<figcaption>{label}</figcaption></figure>;
}

function DownloadRow({doc,index}:{doc:SourceDocument;index:number}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function download(){setBusy(true);setError('');try{const url=URL.createObjectURL(await loadMedia(doc.original));const a=document.createElement('a');a.href=url;a.download=doc.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e:any){setError(e?.message||'Téléchargement impossible.')}finally{setBusy(false)}}
 return <li><span>{String(index+1).padStart(2,'0')}</span><b>{doc.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ')}</b><button type="button" onClick={download} disabled={busy||!doc.original}>{busy?'…':'↓ TÉLÉCHARGER'}</button>{error&&<em role="alert">{error}</em>}</li>;
}

export default function ContentDossier({proposal,color,kicker,label="DOSSIER",actions,footer}:{proposal:any;color?:string;kicker?:string;label?:string;actions?:ReactNode;footer?:ReactNode}){
 const base=useId();const parsed=useMemo(()=>tabsOf(proposal),[proposal]);
 // Un onglet « L’essentiel » produit par l’IA est fusionné dans l’onglet d’accueil pour éviter le doublon.
 const lead=parsed.length>1&&/essentiel/i.test(parsed[0].title)?parsed[0]:undefined;const tabs=lead?parsed.slice(1):parsed;
 const docs:SourceDocument[]=Array.isArray(proposal?.documents)?proposal.documents:[];
 const objectives=list(proposal?.objectives);const intro=str(proposal?.intro);
 const competence=proposal?.kind==="competence";
 const all=[{id:"essentiel",label:"L’essentiel"},...tabs.map((t,i)=>({id:`t${i}`,label:t.title})),...(docs.length?[{id:"docs",label:"Documents"}]:[])];
 const [active,setActive]=useState(0);const current=Math.min(active,all.length-1);const id=all[current]?.id;
 const tab=id?.startsWith("t")?tabs[Number(id.slice(1))]:undefined;
 const graphic=(ids:string[])=>docs.filter(d=>ids.includes(d.id)&&d.reader!=="text"&&d.pages?.length);
 const n=(i:number)=>String(i+1).padStart(2,"0");
 return <div className="cdossier" style={{"--accent":color||"#E0A05A"} as React.CSSProperties}>
  <div className="cd-intro">
   <div><span>{kicker||(competence?"CONTENU DE LA COMPÉTENCE":"CONTENU PÉDAGOGIQUE")}</span><h1>{str(proposal?.title)||"Contenu"}</h1></div>
   {actions?<div className="cd-actions">{actions}</div>:docs.length>0&&<div className="cd-badge"><b>{docs.length}</b><span>DOCUMENT{docs.length>1?"S":""}<br/>SOURCE{docs.length>1?"S":""}</span></div>}
  </div>
  <nav className="cd-tabs" role="tablist" aria-label="Onglets du dossier">{all.map((t,i)=><button type="button" role="tab" id={`${base}-${i}`} aria-selected={i===current} aria-controls={`${base}-panel`} className={i===current?"active":""} key={t.id} onClick={()=>setActive(i)}><b>{n(i)}</b><span>{t.label}</span></button>)}</nav>
  <div className="cd-panel" role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-${current}`}>
   {id==="essentiel"&&<section>
    <div className="cd-heading"><span>{n(0)} · {label}</span><h2>{str(proposal?.title)||"L’essentiel"}</h2>{(intro||lead?.explanation)&&<p>{intro||lead?.explanation}</p>}</div>
    {lead&&lead.facts.length>0&&<div className="cd-facts">{lead.facts.map((f,i)=><article key={i}><strong>{f.value}</strong><span>{f.label}</span></article>)}</div>}
    {lead&&lead.items.length>0&&<ul className="cd-list">{lead.items.map((x,i)=><li key={i}>{x}</li>)}</ul>}
    {objectives.length>0&&<div className="cd-objectives"><strong>{competence?"Objectifs de la compétence":"Objectifs"}</strong><span>{competence?"À l’issue de cette compétence, vous serez capable de :":"À l’issue de ce contenu, vous serez capable de :"}</span><ol>{objectives.map((o,i)=><li key={i}>{o.replace(/^être capable (?:de\s+|d[’'])/i,"").replace(/^./,c=>c.toUpperCase())}</li>)}</ol></div>}
    {tabs.length>0&&<div className="cd-pills">{tabs.map((t,i)=><button type="button" key={i} onClick={()=>setActive(i+1)}>{t.title}</button>)}</div>}
   </section>}
   {tab&&(()=>{const images=graphic(tab.sourceIds);return <section>
    <div className={`cd-lead${images.length?" with-image":""}`}>
     {images.length>0&&<PageImage path={images[0].pages[0].image} label={images[0].name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ')}/>}
     <div className="cd-heading"><span>{n(current)} · {label}</span><h2>{tab.heading}</h2>{tab.explanation&&<p>{tab.explanation}</p>}</div>
    </div>
    {tab.facts.length>0&&<div className="cd-facts">{tab.facts.map((f,i)=><article key={i}><strong>{f.value}</strong><span>{f.label}</span></article>)}</div>}
    {tab.timeline.length>0&&<div className="cd-timeline">{tab.timeline.map((t,i)=><article key={i}><strong>{t.date}</strong><p>{t.text}</p></article>)}</div>}
    {tab.groups.length>0&&<div className="cd-groups">{tab.groups.map((g,i)=><article key={i}><h3>{g.title}</h3>{g.subtitle&&<small>{g.subtitle}</small>}{g.items.length>0&&<ul>{g.items.map((x,j)=><li key={j}>{x}</li>)}</ul>}</article>)}</div>}
    {tab.items.length>0&&<ul className="cd-list">{tab.items.map((x,i)=><li key={i}>{x}</li>)}</ul>}
    {tab.callout&&<div className="cd-callout"><b>{tab.callout.title||"À retenir"}</b><span>{tab.callout.text}</span></div>}
    {images.length>1||(images[0]?.pages.length??0)>1?<div className="cd-gallery">{images.flatMap(d=>d.pages.map(p=>({d,p}))).slice(1).map(({d,p})=><PageImage key={p.image} path={p.image} label={`${d.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ')} · page ${p.number}`}/>)}</div>:null}
   </section>})()}
   {id==="docs"&&<section>
    <div className="cd-heading"><span>{n(current)} · {label}</span><h2>Documents à télécharger</h2><p>Retrouvez ici les documents d’origine de ce contenu.</p></div>
    <ul className="cd-downloads">{docs.map((d,i)=><DownloadRow key={d.id} doc={d} index={i}/>)}</ul>
   </section>}
   <div className="cd-steps">{current>0?<button type="button" onClick={()=>setActive(current-1)}>← {all[current-1].label}</button>:<span/>}{current<all.length-1&&<button type="button" className="next" onClick={()=>setActive(current+1)}>{all[current+1].label} →</button>}</div>
  </div>
  {footer&&<div className="cd-footer">{footer}</div>}
 </div>;
}
