'use client';
import {useEffect,useId,useState} from 'react';
import {loadMedia,type SourceDocument} from '../lib/media';
import './dossier.css';
function SourceImage({path,label}:{path:string;label:string}){
 const [url,setUrl]=useState('');const [error,setError]=useState('');
 useEffect(()=>{let active=true;let local='';setUrl('');setError('');loadMedia(path).then(blob=>{if(active){local=URL.createObjectURL(blob);setUrl(local)}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false;if(local)URL.revokeObjectURL(local)}},[path]);
 return <figure className="dossier-source-image">{url?<a href={url} target="_blank" rel="noreferrer"><img src={url} alt={label} loading="lazy"/></a>:<p role="status">{error||'Chargement du visuel…'}</p>}<figcaption>{label}{url?' · Cliquer pour agrandir':''}</figcaption></figure>
}
function SourceDocumentView({source}:{source:SourceDocument}){
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function download(){setBusy(true);setError('');try{const url=URL.createObjectURL(await loadMedia(source.original));const a=document.createElement('a');a.href=url;a.download=source.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 return <section className="dossier-source"><h4>{source.name}</h4><button type="button" className="home-pill" disabled={busy} onClick={download}>{busy?'CHARGEMENT…':'↓ DOCUMENT ORIGINAL'}</button>{error&&<p role="alert">{error}</p>}{source.pages.map(page=><SourceImage key={page.number} path={page.image} label={`${source.name} · page ${page.number}`}/>)}</section>
}
export default function IllustratedDossier({proposal}:{proposal:any}){
 const [selected,setSelected]=useState(0);const base=useId();
 const sections=Array.isArray(proposal.sections)?proposal.sections:[];
 const sources:SourceDocument[]=Array.isArray(proposal.documents)?proposal.documents:[];
 const index=Math.min(selected,sections.length);const section=sections[index];
 const associated=sources.filter(s=>section?.sourceIds?.includes(s.id));
 return <div className="illustrated-dossier">
  <div className="digital-intro"><small>DOSSIER DÉCOUVERTE · {sources.length} DOCUMENTS</small><p>{proposal.intro}</p></div>
  {proposal.metrics?.length>0&&<div className="digital-kpis">{proposal.metrics.map((x:string,i:number)=><strong key={i}>{x}</strong>)}</div>}
  <div role="tablist" aria-label="Rubriques du dossier" className="dossier-tabs">{[...sections.map((s:any)=>s.title),'Documents originaux'].map((title:string,i:number)=><button type="button" role="tab" id={`${base}-tab-${i}`} aria-selected={i===index} aria-controls={`${base}-panel`} tabIndex={i===index?0:-1} className="home-pill" key={i} onClick={()=>setSelected(i)} onKeyDown={e=>{const count=sections.length+1;let next=i;if(e.key==='ArrowRight')next=(i+1)%count;else if(e.key==='ArrowLeft')next=(i+count-1)%count;else if(e.key==='Home')next=0;else if(e.key==='End')next=count-1;else return;e.preventDefault();setSelected(next);document.getElementById(`${base}-tab-${next}`)?.focus()}}>{title}</button>)}</div>
  <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${index}`} tabIndex={0}>
   {section?<><h3>{section.title}</h3>{['steps','timeline'].includes(section.type)?<ol className="dossier-timeline">{section.items.map((x:string,i:number)=><li key={i}>{x}</li>)}</ol>:<div className="digital-sections">{section.items.map((x:string,i:number)=><article key={i}><p>{x}</p></article>)}</div>}{associated.length>0&&<div className="dossier-visuals">{associated.map(source=><SourceDocumentView key={source.id} source={source}/>)}</div>}{associated.length===0&&sources.length>0&&<p>Les visuels sont conservés dans l’onglet « Documents originaux ».</p>}</>:sources.map(source=><SourceDocumentView key={source.id} source={source}/>)}
  </div>
 </div>
}
