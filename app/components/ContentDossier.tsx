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

type Question={question:string;choices:string[];answer:number;explanation:string};
function quizOf(proposal:any):Question[]{
 return (Array.isArray(proposal?.quiz)?proposal.quiz:[]).map((q:any)=>({question:str(q?.question),choices:list(q?.choices),answer:Number(q?.answer),explanation:str(q?.explanation)}))
  .filter((q:Question)=>q.question&&q.choices.length>=2&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length);
}

/** Quiz de fin : une question à la fois dans le même onglet, score, « À retenir », puis résultat. */
export function Quiz({questions,heading,onReview,reviewLabel="REVOIR LE CONTENU"}:{questions:Question[];heading:string;onReview?:()=>void;reviewLabel?:string}){
 const [index,setIndex]=useState(0);const [picked,setPicked]=useState<number|null>(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);
 const q=questions[index];const total=questions.length;
 function choose(i:number){if(picked!==null)return;setPicked(i);if(i===q.answer)setScore(s=>s+1)}
 function next(){if(index+1>=total){setDone(true);return}setIndex(index+1);setPicked(null)}
 function restart(){setIndex(0);setPicked(null);setScore(0);setDone(false)}
 if(done){const ratio=score/total;return <div className="cd-quiz-result" role="status"><span>{score} / {total}</span><h3>{ratio>=.8?"Excellent, le contenu est maîtrisé.":ratio>=.5?"Bien joué, encore un petit effort.":"Reprends les onglets avant de réessayer."}</h3><div><button type="button" onClick={restart}>RECOMMENCER</button>{onReview&&<button type="button" className="ghost" onClick={onReview}>{reviewLabel}</button>}</div></div>}
 return <div className="cd-quiz" key={index}>
  <div className="cd-quiz-head"><div><span>{heading}</span><h3>{q.question}</h3></div><div className="cd-quiz-count"><b>{index+1} / {total}</b><span>SCORE {score}</span></div></div>
  <div className="cd-quiz-progress" aria-hidden="true"><i style={{width:`${((index+(picked!==null?1:0))/total)*100}%`}}/></div>
  <div className="cd-quiz-choices">{q.choices.map((c,i)=><button type="button" key={i} disabled={picked!==null} className={picked===null?"":i===q.answer?"correct":i===picked?"wrong":"muted"} aria-pressed={picked===i} onClick={()=>choose(i)}>{c}</button>)}</div>
  {picked!==null&&<div className="cd-quiz-feedback" aria-live="polite"><div><b>{picked===q.answer?"Bonne réponse":"À retenir"}</b>{q.explanation&&<p>{q.explanation}</p>}{picked!==q.answer&&!q.explanation&&<p>La bonne réponse était : {q.choices[q.answer]}</p>}</div><button type="button" onClick={next}>{index+1>=total?"VOIR MON RÉSULTAT →":"QUESTION SUIVANTE →"}</button></div>}
 </div>;
}

/** Familles de savoir-faire d’un REAC (techniques, organisationnels, relationnels…) : affichées en sous-onglets plutôt qu’en colonnes. */
function isSkillFamilies(groups:Group[],context=""){const family=/savoir|techniques?|organisationnel|relationnel|comportement/i;return groups.length>=2&&groups.length<=6&&(/savoir/i.test(context)?true:groups.every(g=>family.test(g.title)))}
function SubTabs({groups}:{groups:Group[]}){
 const [active,setActive]=useState(0);const base=useId();const g=groups[Math.min(active,groups.length-1)];
 return <div className="cd-subtabs">
  <div className="cd-subtabs-nav" role="tablist" aria-label="Familles de savoir-faire">{groups.map((x,i)=><button type="button" role="tab" key={i} id={`${base}-${i}`} aria-selected={i===active} aria-controls={`${base}-panel`} className={i===active?"active":""} onClick={()=>setActive(i)}><span>{x.title}</span><b>{x.items.length}</b></button>)}</div>
  <div className="cd-subtabs-panel" role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-${active}`}>{g.subtitle&&<p>{g.subtitle}</p>}{g.items.length>0&&<ol>{g.items.map((x,j)=><li key={j}>{x}</li>)}</ol>}</div>
 </div>;
}

/** Évaluation importée par le formateur : même présentation que le quiz de fin des cours / ressources. */
export function QuizDossier({title,questions,color,kicker,onExit}:{title:string;questions:Question[];color?:string;kicker?:string;onExit?:()=>void}){
 return <div className="cdossier" style={{"--accent":color||"#E0A05A"} as React.CSSProperties}>
  <div className="cd-intro"><div><span>{kicker||"ÉVALUATION"}</span><h1>{title||"Évaluation"}</h1></div><div className="cd-badge"><b>{questions.length}</b><span>QUESTION{questions.length>1?"S":""}</span></div></div>
  <div className="cd-panel"><section><Quiz questions={questions} heading="ÉVALUATION · TESTEZ VOS CONNAISSANCES" onReview={onExit} reviewLabel="RETOUR AU PARCOURS"/></section></div>
 </div>;
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
 const questions=useMemo(()=>quizOf(proposal),[proposal]);
 const docs:SourceDocument[]=Array.isArray(proposal?.documents)?proposal.documents:[];
 const objectives=list(proposal?.objectives);const intro=str(proposal?.intro);
 const competence=proposal?.kind==="competence";
 const all=[{id:"essentiel",label:"L’essentiel"},...tabs.map((t,i)=>({id:`t${i}`,label:t.title})),...(questions.length?[{id:"quiz",label:"Quiz"}]:[]),...(docs.length?[{id:"docs",label:"Documents"}]:[])];
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
    <div className="cd-heading"><span>{n(0)} · {label}</span><h2>{lead&&lead.heading!==lead.title&&lead.heading!==str(proposal?.title)?lead.heading:"L’essentiel"}</h2>{(intro||lead?.explanation)&&<p>{intro||lead?.explanation}</p>}</div>
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
    {tab.groups.length>0&&(isSkillFamilies(tab.groups,`${tab.title} ${tab.heading}`)?<SubTabs key={current} groups={tab.groups}/>:<div className="cd-groups">{tab.groups.map((g,i)=><article key={i}><h3>{g.title}</h3>{g.subtitle&&<small>{g.subtitle}</small>}{g.items.length>0&&<ul>{g.items.map((x,j)=><li key={j}>{x}</li>)}</ul>}</article>)}</div>)}
    {tab.items.length>0&&<ul className="cd-list">{tab.items.map((x,i)=><li key={i}>{x}</li>)}</ul>}
    {tab.callout&&<div className="cd-callout"><b>{tab.callout.title||"À retenir"}</b><span>{tab.callout.text}</span></div>}
    {images.length>1||(images[0]?.pages.length??0)>1?<div className="cd-gallery">{images.flatMap(d=>d.pages.map(p=>({d,p}))).slice(1).map(({d,p})=><PageImage key={p.image} path={p.image} label={`${d.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ')} · page ${p.number}`}/>)}</div>:null}
   </section>})()}
   {id==="quiz"&&<section>
    <Quiz questions={questions} heading={`${n(current)} · QUIZ · TESTEZ VOS CONNAISSANCES`} onReview={()=>setActive(0)}/>
   </section>}
   {id==="docs"&&<section>
    <div className="cd-heading"><span>{n(current)} · {label}</span><h2>Documents à télécharger</h2><p>Retrouvez ici les documents d’origine de ce contenu.</p></div>
    <ul className="cd-downloads">{docs.map((d,i)=><DownloadRow key={d.id} doc={d} index={i}/>)}</ul>
   </section>}
   <div className="cd-steps">{current>0?<button type="button" onClick={()=>setActive(current-1)}>← {all[current-1].label}</button>:<span/>}{current<all.length-1&&<button type="button" className="next" onClick={()=>setActive(current+1)}>{all[current+1].label} →</button>}</div>
  </div>
  {footer&&<div className="cd-footer">{footer}</div>}
 </div>;
}
