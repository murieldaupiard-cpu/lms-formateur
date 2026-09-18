"use client";
import {useState} from "react";

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
 return <main className="studio">
  <header className="studio-nav">
   <button className="studio-brand" onClick={()=>setView("home")}><span>S</span><div><strong>STUDIO</strong><small>LMS FORMATEUR</small></div></button>
   <div className="studio-nav-right"><span>ESPACE FORMATEUR</span><div className="trainer-avatar">MD</div></div>
  </header>
  {view==="home"?<>
   <section className="studio-heading">
    <div><span>CRÉATION PÉDAGOGIQUE</span><h1>Votre espace formateur</h1><p>Construisez vos formations, organisez vos ressources et suivez vos apprenants.</p></div>
    <button className="create-main" onClick={()=>setView("create")}>＋ CRÉER UNE FORMATION <b>→</b></button>
   </section>
   <section className="studio-list">
    <div className="list-title"><div><span>VOS FORMATIONS</span><h2>Construire et piloter</h2></div><small>3 ESPACES DISPONIBLES</small></div>
    {formations.map(x=><button className="studio-row" key={x[0]} onClick={()=>x[0]==="01"&&setView("create")}><span className="row-num">{x[0]}</span><div className="row-body"><div><h3>{x[1]}</h3><span>{x[3]}</span></div><p>{x[2]}</p></div><b className="row-arrow">→</b></button>)}
    <div className="list-title tools-title"><div><span>OUTILS DE CRÉATION</span><h2>Que souhaitez-vous créer ?</h2></div><small>5 TYPES DE RESSOURCES</small></div>
    {toolsList.map(x=><button className="studio-row tool-row" key={x[0]} onClick={()=>setView("create")}><span className="row-num">{x[0]}</span><div className="row-body"><div><h3>{x[1]}</h3><span>{x[3]}</span></div><p>{x[2]}</p></div><b className="row-arrow">→</b></button>)}
   </section>
  </>:<section className="creator-page">
    <div className="creator-head"><div><span>CRÉER UNE FORMATION</span><h1>Construisez votre parcours</h1><p>Commencez par les informations générales, puis organisez vos modules et vos ressources.</p></div><button className="home-pill" onClick={()=>setView("home")}>← MENU PRINCIPAL</button></div>
    <div className="creation-row"><span className="row-num">01</span><div><small>ÉTAPE 1</small><h3>Informations</h3><p>Titre, description et objectifs de la formation.</p></div><b>→</b></div>
    <div className="creation-row"><span className="row-num">02</span><div className="palette-step"><small>ÉTAPE 2</small><h3>Couleur & identité</h3><p>Choisissez une couleur vibrante pour identifier votre formation.</p><div className="palette">${palette.map((color,i)=><button key={color} className="swatch" style={{background:color}} aria-label={`Couleur ${i+1}`} title={color}/>)}</div></div><b>→</b></div>
    <div className="creation-row"><span className="row-num">03</span><div><small>ÉTAPE 3</small><h3>Ressources & activités</h3><p>Ajoutez cours, quiz, Casino Game, Time’s Up et questionnaires.</p></div><b>→</b></div>
    <div className="creation-row"><span className="row-num">04</span><div><small>ÉTAPE 4</small><h3>Aperçu & publication</h3><p>Vérifiez le rendu apprenant avant de publier.</p></div><b>→</b></div>
   </section>}
  <footer><div className="studio-brand compact"><span>S</span><div><strong>STUDIO</strong><small>LMS FORMATEUR</small></div></div><small>CREATED BY <b>ALEXANDRE AND MURIEL</b></small></footer>
 </main>
}