'use client';
import {useEffect,useState} from 'react';
import {loadMedia} from '../lib/media';
import {generateIllustration,dossierStyle,AiVisionError} from '../lib/ai-vision';
import './visual.css';

/** Affiche une illustration générée par IA (stockage privé), avec la mention obligatoire. */
export function AiIllustration({path,alt}:{path?:string;alt:string}){
 const [url,setUrl]=useState('');
 useEffect(()=>{if(!path)return;let active=true;let local='';loadMedia(path).then(b=>{if(active){local=URL.createObjectURL(b);setUrl(local)}}).catch(()=>{});return()=>{active=false;if(local)URL.revokeObjectURL(local)}},[path]);
 if(!path)return null;
 return <figure className="ai-illustration">{url?<img src={url} alt={alt} loading="lazy"/>:<div className="ai-illustration-loading" role="status">Chargement de l’illustration…</div>}<figcaption>Illustration générée par IA</figcaption></figure>;
}

/** Panneau formateur : générer, régénérer ou retirer les illustrations des rubriques avant validation. */
export function IllustrationPanel({proposal,onChange,disabled}:{proposal:any;onChange:(next:any)=>void;disabled?:boolean}){
 const sections:any[]=Array.isArray(proposal?.sections)?proposal.sections:[];
 const [busy,setBusy]=useState<number|null>(null);const [status,setStatus]=useState('');
 const [fictional,setFictional]=useState(false);const [brand,setBrand]=useState('');
 const style=dossierStyle(proposal);
 const context=String(proposal?.center||proposal?.intro||'').slice(0,300);
 async function run(indexes:number[]){
  let current=proposal;
  for(let k=0;k<indexes.length;k++){
   const i=indexes[k];const s=current.sections[i];setBusy(i);setStatus(`Illustration ${k+1}/${indexes.length} · ${s.title}`);
   try{
    const path=await generateIllustration({title:s.title,items:(s.items||[]).slice(0,4),style,context,brand:fictional?brand.trim():'',fictional:fictional&&!!brand.trim()});
    current={...current,sections:current.sections.map((x:any,j:number)=>j===i?{...x,illustration:path}:x)};onChange(current);
   }catch(e){setStatus(e instanceof AiVisionError?e.message:'Illustration impossible. Réessayez.');setBusy(null);return}
  }
  setBusy(null);setStatus('Illustrations prêtes · vérifiez-les avant de valider.');
 }
 const missing=sections.map((s,i)=>s.illustration?-1:i).filter(i=>i>=0);
 return <div className="illustration-panel">
  <div className="illustration-panel-head"><strong>✦ Illustrations par IA</strong><span>Une image par rubrique, dans le style des documents importés. Chaque image est signalée « Illustration générée par IA ».</span></div>
  <label className="illustration-brand"><input type="checkbox" checked={fictional} onChange={e=>setFictional(e.target.checked)} disabled={busy!==null}/> Entreprise fictive (cas pédagogique) : son nom peut apparaître sur les visuels</label>
  {fictional&&<input className="illustration-brand-name" type="text" value={brand} maxLength={60} placeholder="Nom de l’entreprise fictive" onChange={e=>setBrand(e.target.value)} disabled={busy!==null}/>}
  <div className="illustration-list">{sections.map((s,i)=><div key={i} className="illustration-row"><span>{s.title}</span>{s.illustration?<><button type="button" className="home-pill" disabled={disabled||busy!==null} onClick={()=>run([i])}>↻ RÉGÉNÉRER</button><button type="button" className="home-pill" disabled={disabled||busy!==null} onClick={()=>onChange({...proposal,sections:sections.map((x:any,j:number)=>j===i?{...x,illustration:undefined}:x)})}>✕ RETIRER</button></>:<button type="button" className="home-pill" disabled={disabled||busy!==null} onClick={()=>run([i])}>{busy===i?'CRÉATION…':'＋ ILLUSTRER'}</button>}</div>)}</div>
  {missing.length>1&&<button type="button" className="next-step" disabled={disabled||busy!==null} onClick={()=>run(missing)}>{busy!==null?'CRÉATION EN COURS…':`✦ ILLUSTRER LES ${missing.length} RUBRIQUES`}</button>}
  <p role="status" aria-live="polite">{status}</p>
 </div>;
}
