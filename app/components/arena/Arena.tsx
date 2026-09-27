"use client";

import {useEffect, useRef, useState, type CSSProperties} from "react";
import "./arena.css";
import {AvatarBuilder, DEFAULT_AVATAR, GladiatorAvatar} from "./GladiatorAvatar";
import {shuffledArena, type ArenaContent, type ArenaQuestion} from "../../lib/arena";

// ---------------------------------------------------------------------------
// L'Arène — quiz de révision gamifié, repris du moteur CADGA (mode solo) :
// questions à choix unique ou multiple, points et séries, jokers 50/50 / Passe /
// Double, bouclier toutes les 3 bonnes réponses, musique, résultats détaillés.
// L'ordre des questions et des réponses est tiré au sort à chaque partie.
// ---------------------------------------------------------------------------

type Screen = "landing" | "avatar" | "question" | "end";
type JokerKind = "5050" | "skip" | "double";
type Review = {question: string; correct: boolean | null; explanation: string};

function useGameSounds() {
 const contextRef = useRef<AudioContext | null>(null);
 const context = () => {
  const AudioCtx = window.AudioContext || (window as typeof window & {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
  const audio = contextRef.current ?? new AudioCtx();
  contextRef.current = audio; void audio.resume(); return audio;
 };
 const tone = (frequency: number, duration: number, type: OscillatorType, volume: number, delay = 0) => {
  try {
   const audio = context(); const start = audio.currentTime + delay;
   const oscillator = audio.createOscillator(); const gain = audio.createGain();
   oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
   gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
   oscillator.connect(gain).connect(audio.destination); oscillator.start(start); oscillator.stop(start + duration + 0.02);
  } catch {}
 };
 useEffect(() => () => { void contextRef.current?.close() }, []);
 return {
  correct: () => { tone(523.25, 0.18, "triangle", 0.06, 0.06); tone(659.25, 0.18, "triangle", 0.06, 0.15); tone(783.99, 0.28, "triangle", 0.07, 0.24) },
  wrong: () => { tone(185, 0.18, "sawtooth", 0.045, 0.06); tone(138.59, 0.34, "sawtooth", 0.04, 0.19) },
  fifty: () => { [740, 590, 460, 350].forEach((f, i) => tone(f, 0.13, "sine", 0.045, i * 0.055)) },
  shield: () => { tone(392, 0.18, "sine", 0.05); tone(587.33, 0.28, "triangle", 0.055, 0.1); tone(783.99, 0.38, "sine", 0.045, 0.22) },
  double: () => { tone(220, 0.16, "square", 0.04); tone(440, 0.22, "square", 0.045, 0.1); tone(880, 0.34, "triangle", 0.06, 0.22) },
 };
}

function useFunMusic() {
 const contextRef = useRef<AudioContext | null>(null);
 const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const [playing, setPlaying] = useState(false);
 const playBar = () => {
  const context = contextRef.current; if (!context) return;
  const notes = [261.63, 329.63, 392, 523.25, 392, 440, 329.63, 392]; const start = context.currentTime;
  notes.forEach((frequency, index) => {
   const oscillator = context.createOscillator(); const gain = context.createGain();
   oscillator.type = index % 2 ? "triangle" : "square"; oscillator.frequency.value = frequency;
   gain.gain.setValueAtTime(0.0001, start + index * 0.24); gain.gain.exponentialRampToValueAtTime(0.035, start + index * 0.24 + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.24 + 0.2);
   oscillator.connect(gain).connect(context.destination); oscillator.start(start + index * 0.24); oscillator.stop(start + index * 0.24 + 0.22);
  });
 };
 const start = () => {
  if (playing) return;
  const AudioCtx = window.AudioContext || (window as typeof window & {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
  contextRef.current = contextRef.current ?? new AudioCtx(); void contextRef.current.resume();
  playBar(); loopRef.current = setInterval(playBar, 1920); setPlaying(true);
 };
 const stop = () => { if (loopRef.current) clearInterval(loopRef.current); loopRef.current = null; void contextRef.current?.suspend(); setPlaying(false) };
 useEffect(() => () => { if (loopRef.current) clearInterval(loopRef.current); void contextRef.current?.close() }, []);
 return {playing, start, stop};
}

function ConfettiBurst() {
 const colors = ["#ffd369", "#ff5c8a", "#51e5ff", "#8dff8a", "#a98bff", "#ffffff"];
 return <div className="qz-confetti" aria-hidden="true">{Array.from({length: 54}, (_, i) => <i key={i} style={{"--confetti-x": `${(i * 37) % 100}%`, "--confetti-delay": `${(i % 9) * 0.045}s`, "--confetti-drift": `${((i * 23) % 180) - 90}px`, background: colors[i % colors.length]} as CSSProperties}/>)}</div>;
}

export default function Arena({arena, eyebrow, onExit}: {arena: ArenaContent; eyebrow?: string; onExit?: () => void}) {
 const [screen, setScreen] = useState<Screen>("landing");
 const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
 const [name, setName] = useState("Toi");
 const [qIndex, setQIndex] = useState(0);
 const [score, setScore] = useState(0);
 const [streak, setStreak] = useState(0);
 const [bestStreak, setBestStreak] = useState(0);
 const [shield, setShield] = useState(false);
 const [answered, setAnswered] = useState(false);
 const [picks, setPicks] = useState<number[]>([]);
 const [removedOpts, setRemovedOpts] = useState<number[]>([]);
 const [jokers, setJokers] = useState<Record<JokerKind, boolean>>({"5050": true, skip: true, double: true});
 const [doubleArmed, setDoubleArmed] = useState(false);
 const [feedback, setFeedback] = useState<{correct: boolean; pts: number} | null>(null);
 const [review, setReview] = useState<Review[]>([]);
 const questionsRef = useRef<ArenaQuestion[]>(arena.questions);
 const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const music = useFunMusic();
 const sounds = useGameSounds();
 const total = questionsRef.current.length;
 const q = questionsRef.current[qIndex];
 useEffect(() => () => { if (advanceRef.current) clearTimeout(advanceRef.current) }, []);

 function startGame() {
  questionsRef.current = shuffledArena(arena.questions);
  setScore(0); setStreak(0); setBestStreak(0); setShield(false); setReview([]);
  setJokers({"5050": true, skip: true, double: true}); setDoubleArmed(false);
  runQuestion(0);
 }
 function runQuestion(index: number) {
  setQIndex(index); setAnswered(false); setPicks([]); setRemovedOpts([]); setFeedback(null); setScreen("question");
 }
 function advance(from: number) {
  const next = from + 1;
  if (next >= questionsRef.current.length) { setScreen("end"); return }
  runQuestion(next);
 }
 function playJoker(kind: JokerKind) {
  if (!jokers[kind] || answered) return;
  setJokers(j => ({...j, [kind]: false}));
  if (kind === "5050") {
   const correctIdx = Array.isArray(q.correct) ? q.correct : [q.correct];
   const wrong = q.options.map((_, i) => i).filter(i => !correctIdx.includes(i));
   setRemovedOpts(wrong.sort(() => Math.random() - 0.5).slice(0, Math.max(0, Math.min(2, wrong.length - 1))));
   sounds.fifty();
  } else if (kind === "skip") {
   setReview(r => [...r, {question: q.prompt, correct: null, explanation: q.explanation}]);
   setAnswered(true); advance(qIndex);
  } else { setDoubleArmed(true); sounds.double() }
 }
 function toggleMulti(i: number) {
  if (answered || removedOpts.includes(i)) return;
  setPicks(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
 }
 function lockIn(pick: number | number[]) {
  if (answered) return;
  setAnswered(true);
  const picked = Array.isArray(pick) ? pick : [pick];
  setPicks(picked);
  const correctSet = (Array.isArray(q.correct) ? q.correct : [q.correct]).slice().sort().join(",");
  const correct = picked.length > 0 && picked.slice().sort().join(",") === correctSet;
  let pts = 0; let newStreak = 0; let earnedShield = shield;
  if (correct) {
   pts = 1000 + streak * 40; if (doubleArmed) pts *= 2;
   newStreak = streak + 1;
   if (newStreak % 3 === 0 && !shield) { earnedShield = true; sounds.shield() } else sounds.correct();
  } else sounds.wrong();
  setDoubleArmed(false); setStreak(newStreak); setBestStreak(b => Math.max(b, newStreak)); setShield(earnedShield);
  setScore(s => s + pts); setFeedback({correct, pts});
  setReview(r => [...r, {question: q.prompt, correct, explanation: q.explanation}]);
  const from = qIndex;
  advanceRef.current = setTimeout(() => advance(from), q.explanation ? 2600 : 1400);
 }

 const answeredList = review.filter(r => r.correct !== null);
 const ok = answeredList.filter(r => r.correct).length;
 const rate = answeredList.length ? Math.round((ok / answeredList.length) * 100) : 0;

 return <div className="qz-page qz-embedded">
  <div className="qz-stage">
   <div className="qz-topbar">
    <div className="qz-brand"><span>{(arena.title[0] || "A").toUpperCase()}</span><div translate="no">{arena.title}</div></div>
    {onExit && <button type="button" className="qz-exit" onClick={onExit}>EXIT</button>}
   </div>
   <div className="qz-body">
    {screen === "landing" && <div className="qz-view qz-landing">
     <div className="qz-eyebrow">{eyebrow || "L’Arène"}</div>
     <h1 translate="no">{arena.headline.map((line, i) => <span key={i}>{i > 0 && <br/>}{line}</span>)}</h1>
     <p className="qz-lede">{arena.summary || "Points, séries, jokers et bouclier : prouve que tu maîtrises le contenu."}</p>
     <div className="qz-mode-grid">
      <button type="button" className="qz-mode-card" onClick={() => setScreen("avatar")}>
       <span className="qz-tag qz-tag-solo">Mode solo</span>
       <div className="qz-mode-name">Jouer seul</div>
       <div className="qz-mode-desc">{total} questions · entraîne-toi immédiatement.</div>
      </button>
     </div>
    </div>}

    {screen === "avatar" && <div className="qz-view qz-center">
     <div className="qz-eyebrow">Avant de commencer</div>
     <h2>Crée ton gladiateur</h2>
     <AvatarBuilder value={avatar} onChange={setAvatar}/>
     <input className="qz-name-input" value={name} maxLength={12} aria-label="Ton prénom" onChange={e => setName(e.target.value)}/>
     <button type="button" className="qz-primary" onClick={startGame}>C&apos;est parti →</button>
    </div>}

    {screen === "question" && q && <div className="qz-view qz-question" key={qIndex}>
     <div className="qz-qhead">
      <div><span className="qz-progress">QUESTION {qIndex + 1}/{total}</span><span className="qz-type">{q.type === "multi" ? "Sélection multiple" : "Choix multiple"}</span></div>
      <div className="qz-status">
       <span className="qz-me"><GladiatorAvatar code={avatar} size={22}/> {name}</span>
       {streak > 0 && <span className="qz-streak">🔥 {streak}</span>}
       {shield && <span className="qz-shield" title="Bouclier">🛡️</span>}
       <span className="qz-score">{score} pts</span>
      </div>
     </div>
     <div className="qz-jokers qz-jokers-featured">
      <button type="button" className="qz-joker" disabled={!jokers["5050"] || q.type !== "single" || answered} onClick={() => playJoker("5050")}>🎯 50/50</button>
      <button type="button" className="qz-joker" disabled={!jokers.skip || answered} onClick={() => playJoker("skip")}>⏭️ Passe</button>
      <button type="button" className={`qz-joker ${doubleArmed ? "active" : ""}`} disabled={!jokers.double || answered} onClick={() => playJoker("double")}>⚡ Double</button>
      <button type="button" className="qz-music-joker" onClick={music.playing ? music.stop : music.start}><b>{music.playing ? "♫ MUSIQUE ON" : "♪ MUSIQUE"}</b><span>{music.playing ? "Couper le son" : "Lancer la musique fun"}</span></button>
     </div>
     <div className="qz-card">
      <div className="qz-qtext" translate="no">{q.prompt}</div>
      <div className="qz-qhint">{q.type === "multi" ? "Sélectionne toutes les bonnes réponses puis valide." : "Une seule bonne réponse."}</div>
     </div>
     <div className="qz-answers">
      {q.options.map((opt, i) => {
       const removed = removedOpts.includes(i); const picked = picks.includes(i);
       const correctIdx = Array.isArray(q.correct) ? q.correct : [q.correct];
       const showCorrect = answered && correctIdx.includes(i); const showWrong = answered && !correctIdx.includes(i) && picked;
       return <button type="button" key={i} className={`qz-answer qz-tile-${i} ${picked ? "picked" : ""} ${showCorrect ? "correct" : ""} ${showWrong ? "wrong" : ""}`} style={{visibility: removed ? "hidden" : "visible"}} disabled={answered || removed} aria-pressed={picked} onClick={() => q.type === "multi" ? toggleMulti(i) : lockIn(i)}>
        <span className="qz-shape"/><span translate="no">{opt}</span>{q.type === "multi" && <span className={`qz-check ${picked ? "on" : ""}`}/>}
       </button>;
      })}
     </div>
     {q.type === "multi" && !answered && <button type="button" className="qz-primary qz-submit" disabled={picks.length === 0} onClick={() => lockIn(picks)}>Valider</button>}
     {feedback && <div className={`qz-feedback ${feedback.correct ? "good" : "bad"}`} role="status">{feedback.correct ? `+${feedback.pts} pts` : "Raté !"}</div>}
     {feedback && q.explanation && <p className="qz-explain" translate="no">{q.explanation}</p>}
    </div>}

    {screen === "end" && <div className="qz-view qz-center">
     {rate >= 80 && <ConfettiBurst/>}
     <div className="qz-eyebrow">Quiz terminé</div>
     <h2>Tes résultats, {name}</h2>
     <div className="qz-stats">
      <div className="qz-stat"><div className="qz-stat-num">{score}</div><div className="qz-stat-label">Points</div></div>
      <div className="qz-stat"><div className="qz-stat-num">{rate}%</div><div className="qz-stat-label">Taux de réussite</div></div>
      <div className="qz-stat"><div className="qz-stat-num">{bestStreak}</div><div className="qz-stat-label">Meilleure série</div></div>
     </div>
     <div className="qz-review">
      {review.map((r, i) => <div key={i} className="qz-review-row" translate="no"><span className={`qz-dot ${r.correct === null ? "sk" : r.correct ? "ok" : "no"}`}/><span>{r.question} {r.correct === null ? "(passée)" : ""}{r.correct !== true && r.explanation && <small>{r.explanation}</small>}</span></div>)}
     </div>
     <button type="button" className="qz-primary" onClick={() => setScreen("landing")}>Rejouer</button>
    </div>}
   </div>
  </div>
 </div>;
}
