"use client";
import {useState} from "react";

type Step=1|2|3|4;

const toolsList=[
 ["01","Cours","Créez vos contenus pédagogiques à partir de maquettes modulables.","6 MAQUETTES"],
 ["02","Quiz","Importez toutes vos questions en une fois, vérifiez puis publiez.","IMPORT EN LOT"],
 ["03","Casino Game","Transformez vos questions A/B/C en activité de groupe.","JEU PÉDAGOGIQUE"],
 ["04","Time’s Up","Importez vos cartes question/réponse et lancez les trois rounds.","CARTES & ROUNDS"],
 ["05","Questionnaire","Créez vos questionnaires de satisfaction multi-formats.","SATISFACTION"]
];
const palette=["#7C3AED","#9333EA","#C026D3","#E11D48","#F43F5E","#F97316","#F59E0B","#EAB308","#84CC16","#22C55E","#10B981","#14B8A6","#06B6D4","#0EA5E9","#3B82F6","#2563EB","#4F46E5","#6366F1","#EC4899","#D946EF"];
const formations=[
 ["01","Ma première formation","Construisez votre parcours par modules et chapitres, puis ajoutez cours et activités.","BROUILLON"],
 ["02","Modèles de formation","Réutilisez vos structures et ressources pour créer plus rapidement.","BIBLIOTHÈQUE"],
 ["03","Résultats & suivi","Consultez les scores, tentatives, réponses et retours des apprenants.","SUIVI"]
];
export default function Home(){
 const [view,setView]=useState<"home"|"create">("home");
 const [step,setStep]=useState<Step>(1);
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [selectedColor,setSelectedColor]=useState(palette[0]);
 return <main className="studio">
  <header className="studio-nav">
   <button className="studio-brand" onClick={()=>setView("home")}><span>S</span><div><strong>STUDIO</strong><small>LMS FORMATEUR</small></div></button>
   <div className="studio-nav-right"><span>ESPACE FORMATEUR</span><div className="trainer-avatar">MD</div></div>
  </header>
  {view==="home"?<>
   <section className="studio-heading">
    <div><span>CRÉATION PÉDAGOGIQUE</span><h1>Votre espace formateur</h1><p>Construisez vos formations, organisez vos ressources et suivez vos apprenants.</p></div>
    <button className="create-main" onClick={()=>{setStep(1);setView("create")}}>＋ CRÉER UNE FORMATION <b>→</b></button>
   </section>
   <section className="studio-list">
    <div className="list-title"><div><span>VOS FORMATIONS</span><h2>Construire et piloter</h2></div><small>3 ESPACES DISPONIBLES</small></div>
    {formations.map(x=><button className="studio-row" key={x[0]} onClick={()=>x[0]==="01"&&setView("create")}><span className="row-num">{x[0]}</span><div className="row-body"><div><h3>{x[1]}</h3><span>{x[3]}</span></div><p>{x[2]}</p></div><b className="row-arrow">→</b></button>)}
    <div className="list-title tools-title"><div><span>OUTILS DE CRÉATION</span><h2>Que souhaitez-vous créer ?</h2></div><small>5 TYPES DE RESSOURCES</small></div>
    {toolsList.map(x=><button className="studio-row tool-row" key={x[0]} onClick={()=>setView("create")}><span className="row-num">{x[0]}</span><div className="row-body"><div><h3>{x[1]}</h3><span>{x[3]}</span></div><p>{x[2]}</p></div><b className="row-arrow">→</b></button>)}
   </section>
  </>:<section className="creator-page">
    <div className="creator-head"><div><span>CRÉER UNE FORMATION</span><h1>Construisez votre parcours</h1><p>Définissez l’action de formation, puis structurez la progression pédagogique, les séquences, les activités d’apprentissage et les ressources.</p></div><button className="home-pill" onClick={()=>setView("home")}>← MENU PRINCIPAL</button></div>
    <div className="creator-workspace">
      <div className={"creation-row "+(step===1?"active-step":"")} onClick={()=>setStep(1)}><span className="row-num">01</span><div className="palette-step"><small>ÉTAPE 1</small><h3>Informations</h3><p>Intitulé, description et objectifs pédagogiques.</p>{step===1&&<div className="step-form" onClick={e=>e.stopPropagation()}><label>Nom de la formation<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex. Anglais professionnel"/></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Décrivez brièvement la formation"/></label><button type="button" className="next-step" onClick={()=>setStep(2)}>CONTINUER →</button></div>}</div><b>→</b></div>
      <div className={"creation-row "+(step===2?"active-step":"")} onClick={()=>setStep(2)}><span className="row-num">02</span><div className="palette-step"><small>ÉTAPE 2</small><h3>Couleur & identité</h3><p>Choisissez une couleur vibrante pour identifier votre formation.</p>{step===2&&<div className="palette" onClick={e=>e.stopPropagation()}>{palette.map((color,i)=><button type="button" key={color} className={"swatch "+(selectedColor===color?"selected":"")} style={{background:color}} onClick={()=>setSelectedColor(color)} aria-label={`Couleur ${i+1}`} title={color}/>)}</div>}</div><b>→</b></div>
      <div className={"creation-row "+(step===3?"active-step":"")} onClick={()=>setStep(3)}><span className="row-num">03</span><div><small>ÉTAPE 3</small><h3>Séquences & activités</h3><p>Organisez les séquences pédagogiques, activités d’apprentissage, ressources et évaluations.</p></div><b>→</b></div>
      <div className={"creation-row "+(step===4?"active-step":"")} onClick={()=>setStep(4)}><span className="row-num">04</span><div><small>ÉTAPE 4</small><h3>Aperçu & publication</h3><p>Vérifiez le rendu apprenant avant de publier.</p></div><b>→</b></div>
    </div>
   </section>}
  <footer><div className="studio-brand compact"><span>S</span><div><strong>STUDIO</strong><small>LMS FORMATEUR</small></div></div><small>CREATED BY <b>ALEXANDRE AND MURIEL</b></small></footer>
 </main>
}