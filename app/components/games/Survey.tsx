"use client";

import {type FormEvent, useMemo, useState} from "react";
import "./games.css";
import "./survey.css";
import type {SurveyContent} from "../../lib/games";

// ---------------------------------------------------------------------------
// Questionnaire de satisfaction — même présentation et même fonctionnement que
// celui de CADGA (échelles, compétences mobilisables, questions ouvertes, note de
// recommandation de 0 à 10, compteur de réponses). Questions génériques : les
// compétences mobilisables reprennent les objectifs pédagogiques de la formation.
// ---------------------------------------------------------------------------

const scale = ["Pas du tout", "Plutôt non", "Plutôt oui", "Tout à fait"];
const confidence = ["Pas encore", "Avec de l’aide", "En autonomie", "Avec assurance"];
const scaleQuestions = [
 "La formation m’a permis de progresser étape par étape sans me sentir perdu·e.",
 "Les consignes et la navigation sur la plateforme étaient suffisamment claires pour travailler en autonomie.",
 "Les supports (documents, dossiers, visuels) étaient clairs et utiles pour apprendre.",
 "Les activités m’ont appris une méthode réutilisable, et pas seulement à réussir un exercice.",
 "Les corrections et les explications m’ont permis de comprendre précisément mes réussites et mes erreurs.",
 "L’alternance entre contenus, jeux et activités a soutenu ma motivation.",
 "L’accompagnement du formateur ou de la formatrice m’a aidé·e à identifier une stratégie concrète pour progresser.",
 "Je pourrai réutiliser les acquis de cette formation dans une situation professionnelle réelle.",
];
const openQuestions: [string, string, string][] = [
 ["change", "Quelle activité vous a réellement fait changer de méthode ou de réflexe ? Pourquoi ?", "Décrivez un moment précis…"],
 ["difficulty", "À quel moment de la formation avez-vous rencontré le plus de difficulté ?", "Séquence, activité ou type d’exercice…"],
 ["keep", "Quel élément faudrait-il absolument conserver pour les prochains groupes ?", "Un support, un jeu, une méthode, un accompagnement…"],
 ["improve", "Si une seule chose devait être améliorée sur la plateforme ou l’accompagnement, laquelle choisiriez-vous ?", "Soyez aussi précis·e que possible…"],
];

export default function Survey({survey, onExit}: {survey: SurveyContent; onExit?: () => void}) {
 const skills = survey.skills;
 const total = scaleQuestions.length + skills.length + openQuestions.length + 1;
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [submitted, setSubmitted] = useState(false);
 const completed = useMemo(() => Object.values(answers).filter(v => v.trim()).length, [answers]);
 const set = (key: string, value: string) => setAnswers(a => ({...a, [key]: value}));
 const exit = (e: React.MouseEvent) => { e.preventDefault(); onExit?.() };
 const n = (i: number) => String(i).padStart(2, "0");
 const submit = (e: FormEvent) => {
  e.preventDefault(); if (completed < total) return;
  try { localStorage.setItem(`lms-satisfaction:${survey.title}`, JSON.stringify({answers, completedAt: new Date().toISOString()})) } catch {}
  setSubmitted(true);
 };
 if (submitted) return <div className="game-embed"><div className="survey-page"><header className="survey-nav">{onExit ? <a href="#" onClick={exit}>← RETOUR AU PARCOURS</a> : <span/>}<span>QUESTIONNAIRE TERMINÉ</span></header><section className="survey-thanks"><span>MERCI POUR VOTRE RETOUR</span><h1>Votre expérience compte.</h1><p>Vos réponses aideront à ajuster les activités, les supports et l’accompagnement proposés aux prochains groupes.</p>{onExit && <a href="#" onClick={exit}>RETOUR AU PARCOURS</a>}</section></div></div>;
 return <div className="game-embed"><div className="survey-page"><header className="survey-nav">{onExit ? <a href="#" onClick={exit}>← RETOUR AU PARCOURS</a> : <span/>}<div><span>{completed} / {total} RÉPONSES</span><i><em style={{width: `${Math.round(completed / total * 100)}%`}}/></i></div></header>
  <section className="survey-intro"><span>EN FIN DE FORMATION · 5 À 7 MINUTES</span><h1>Votre regard sur <span translate="no">{survey.title}</span>.</h1><p>Ce questionnaire porte sur l’expérience d’apprentissage, l’autonomie et le transfert professionnel. Il n’est pas évalué.</p></section>
  <form className="survey-form" onSubmit={submit}>
   <section><div className="survey-section-title"><b>01</b><div><h2>Expérience d’apprentissage</h2><p>Pour chaque affirmation, choisissez la réponse qui correspond le mieux à votre expérience.</p></div></div>{scaleQuestions.map((q, i) => <fieldset key={q}><legend>{q}</legend><div className="survey-options">{scale.map(x => <label key={x}><input type="radio" name={`scale-${i}`} value={x} checked={answers[`scale-${i}`] === x} onChange={() => set(`scale-${i}`, x)} required/><span>{x}</span></label>)}</div></fieldset>)}</section>
   {skills.length > 0 && <section><div className="survey-section-title"><b>02</b><div><h2>Compétences mobilisables</h2><p>À la fin de la formation, où vous situez-vous aujourd’hui ?</p></div></div>{skills.map((q, i) => <fieldset key={q}><legend translate="no">{q}</legend><div className="survey-options">{confidence.map(x => <label key={x}><input type="radio" name={`skill-${i}`} value={x} checked={answers[`skill-${i}`] === x} onChange={() => set(`skill-${i}`, x)} required/><span>{x}</span></label>)}</div></fieldset>)}</section>}
   <section><div className="survey-section-title"><b>{n(skills.length ? 3 : 2)}</b><div><h2>Ce qui fera évoluer la formation</h2><p>Des réponses concrètes pour conserver ce qui fonctionne et améliorer le reste.</p></div></div>
    {openQuestions.map(([key, label, placeholder]) => <label className="survey-text" key={key}><span>{label}</span><textarea required value={answers[key] || ""} onChange={e => set(key, e.target.value)} placeholder={placeholder}/></label>)}
    <fieldset><legend>Recommanderiez-vous cette formation à un futur apprenant ?</legend><div className="survey-score">{Array.from({length: 11}, (_, i) => <label key={i}><input type="radio" name="recommend" value={i} checked={answers.recommend === String(i)} onChange={() => set("recommend", String(i))} required/><span>{i}</span></label>)}</div><div className="score-ends"><span>Pas du tout</span><span>Tout à fait</span></div></fieldset>
   </section>
   <div className="survey-submit"><p>{completed === total ? "Toutes les réponses sont complètes." : "Répondez à toutes les questions pour terminer."}</p><button disabled={completed < total}>VALIDER MES RÉPONSES →</button></div>
  </form></div></div>;
}
