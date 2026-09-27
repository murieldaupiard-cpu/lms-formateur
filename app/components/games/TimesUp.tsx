"use client";

import {type FormEvent, useEffect, useRef, useState} from "react";
import "./games.css";
import "./times-up.css";
import {cleanGuess, type TimesUpContent} from "../../lib/games";

// ---------------------------------------------------------------------------
// Time's Up — repris du Time's Up CADGA : roue d'équipe, 3 manches (description,
// un seul mot, dessin), chrono, bonus de vitesse, équipe adverse, musique et sons.
// Les cartes sont générées par l'IA à partir des documents du formateur.
// ---------------------------------------------------------------------------

const rounds = [
 {name: "DESCRIPTION", time: 30},
 {name: "UN SEUL MOT", time: 15},
 {name: "DESSIN", time: 20},
];

export default function TimesUp({game, eyebrow, onExit}: {game: TimesUpContent; eyebrow?: string; onExit?: () => void}) {
 const deck = game.cards; const total = deck.length;
 const [started, setStarted] = useState(false), [teamDraw, setTeamDraw] = useState<"idle" | "spinning" | "revealed">("idle"), [finished, setFinished] = useState(false), [team, setTeam] = useState<"GOLD" | "PURPLE">("GOLD"), [round, setRound] = useState(0), [index, setIndex] = useState(0), [seconds, setSeconds] = useState(30), [guess, setGuess] = useState(""), [result, setResult] = useState<"correct" | "pass" | null>(null), [score, setScore] = useState(0), [opponent, setOpponent] = useState(0), [music, setMusic] = useState(true);
 const audio = useRef<{ctx: AudioContext; timer: number; musicGain: GainNode; pulse: () => void} | null>(null);
 const timers = useRef<number[]>([]);
 const card = deck[index], r = rounds[round], reveal = round === 2 ? (seconds <= 6 ? 3 : seconds <= 13 ? 2 : 1) : 0;
 const exit = (e: React.MouseEvent) => { e.preventDefault(); stopMusic(); onExit?.() };

 function note(frequency: number, start: number, duration: number, volume = 0.035) { const ctx = audio.current?.ctx; if (!ctx) return; const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = "triangle"; osc.frequency.value = frequency; gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration); osc.connect(gain).connect(ctx.destination); osc.start(start); osc.stop(start + duration) }
 function startMusic() {
  if (audio.current) return;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext; if (!Ctx) return;
  const ctx: AudioContext = new Ctx(); const musicGain = ctx.createGain(); musicGain.gain.value = 0.72; musicGain.connect(ctx.destination);
  const pulse = () => {
   const now = ctx.currentTime, bar = 1.6, roots = [65.41, 58.27, 49, 55], arpeggio = [0, 7, 12, 15, 12, 7, 3, 7];
   roots.forEach((root, chordIndex) => {
    const start = now + chordIndex * bar;
    const bass = ctx.createOscillator(), bassGain = ctx.createGain(); bass.type = "sine"; bass.frequency.value = root;
    bassGain.gain.setValueAtTime(0.0001, start); bassGain.gain.exponentialRampToValueAtTime(0.018, start + 0.32); bassGain.gain.exponentialRampToValueAtTime(0.0001, start + bar);
    bass.connect(bassGain).connect(musicGain); bass.start(start); bass.stop(start + bar + 0.02);
    arpeggio.forEach((semitones, noteIndex) => {
     const noteStart = start + noteIndex * 0.2; const synth = ctx.createOscillator(), synthGain = ctx.createGain();
     synth.type = noteIndex % 2 === 0 ? "triangle" : "sine"; synth.frequency.value = root * 2 * Math.pow(2, semitones / 12); synth.detune.value = noteIndex % 2 === 0 ? -3 : 3;
     synthGain.gain.setValueAtTime(0.0001, noteStart); synthGain.gain.exponentialRampToValueAtTime(0.008, noteStart + 0.08); synthGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.48);
     synth.connect(synthGain).connect(musicGain); synth.start(noteStart); synth.stop(noteStart + 0.5);
    });
   });
  };
  const timer = window.setInterval(pulse, 6400); audio.current = {ctx, timer, musicGain, pulse}; pulse();
 }
 function pauseBackground() { if (!audio.current) return; window.clearInterval(audio.current.timer); audio.current.musicGain.gain.setValueAtTime(0.0001, audio.current.ctx.currentTime) }
 function resumeBackground() { if (!music || !audio.current) return; window.clearInterval(audio.current.timer); audio.current.musicGain.gain.setValueAtTime(1, audio.current.ctx.currentTime); audio.current.pulse(); audio.current.timer = window.setInterval(audio.current.pulse, 3200) }
 function stopMusic() { if (!audio.current) return; window.clearInterval(audio.current.timer); void audio.current.ctx.close(); audio.current = null }
 function toggleMusic() { if (music) { setMusic(false); stopMusic() } else { setMusic(true); startMusic() } }
 function resultMusic(won: boolean) { if (!music || !audio.current) return; const now = audio.current.ctx.currentTime + 0.05; const melody = won ? [261.63, 329.63, 392, 523.25, 659.25] : [392, 349.23, 293.66, 220, 164.81]; melody.forEach((f, i) => note(f, now + i * 0.18, won ? 0.42 : 0.5, won ? 0.065 : 0.05)); if (won) [523.25, 659.25, 783.99].forEach(f => note(f, now + 0.85, 1, 0.04)) }
 function feedbackMusic(won: boolean) {
  if (!music || !audio.current) return; const now = audio.current.ctx.currentTime + 0.03;
  if (won) { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, now + i * 0.12, 0.34, 0.1)); [659.25, 783.99, 1046.5].forEach(f => note(f, now + 0.48, 0.72, 0.055)); return }
  const ctx = audio.current.ctx;
  [146.83, 110].forEach((frequency, i) => { const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = "sawtooth"; osc.frequency.setValueAtTime(frequency, now + i * 0.08); osc.frequency.exponentialRampToValueAtTime(frequency * 0.72, now + 0.62); gain.gain.setValueAtTime(0.0001, now + i * 0.08); gain.gain.exponentialRampToValueAtTime(0.11, now + 0.025 + i * 0.08); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68); osc.connect(gain).connect(ctx.destination); osc.start(now + i * 0.08); osc.stop(now + 0.7) });
 }
 function countdownTick(value: number) { if (!music || !audio.current) return; const ctx = audio.current.ctx, now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = "square"; osc.frequency.value = value % 2 === 0 ? 720 : 920; gain.gain.setValueAtTime(0.055, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085); osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + 0.09) }
 function timeUpSound() {
  if (!music || !audio.current) return; pauseBackground(); const ctx = audio.current.ctx, now = ctx.currentTime;
  [220, 164.81].forEach((frequency, i) => { const osc = ctx.createOscillator(), gain = ctx.createGain(), start = now + i * 0.32; osc.type = "sine"; osc.frequency.setValueAtTime(frequency, start); osc.frequency.exponentialRampToValueAtTime(frequency * 0.82, start + 0.5); gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(0.12, start + 0.025); gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55); osc.connect(gain).connect(ctx.destination); osc.start(start); osc.stop(start + 0.58) });
 }
 useEffect(() => {
  if (!started || finished || result) return;
  const timer = window.setInterval(() => setSeconds(s => { if (s <= 1) { window.clearInterval(timer); timeUpSound(); setResult("pass"); return 0 } if (s <= 6) countdownTick(s - 1); return s - 1 }), 1000);
  return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [started, finished, result, index, round]);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 useEffect(() => () => { stopMusic(); timers.current.forEach(t => window.clearTimeout(t)) }, []);

 function begin() { const drawn = Math.random() > 0.5 ? "GOLD" : "PURPLE"; setTeam(drawn); setTeamDraw("spinning"); if (music) startMusic(); timers.current.push(window.setTimeout(() => setTeamDraw("revealed"), 2300), window.setTimeout(() => { setStarted(true); setSeconds(rounds[0].time) }, 3900)) }
 function submit(e: FormEvent) {
  e.preventDefault(); if (result || !guess.trim()) return;
  const accepted = [card.word, ...(card.aliases || [])].map(cleanGuess);
  if (accepted.includes(cleanGuess(guess))) { setScore(s => s + 100 + Math.max(0, seconds) * 2); pauseBackground(); feedbackMusic(true); setResult("correct") }
  else { feedbackMusic(false); setGuess("") }
 }
 function pass() { if (!result) { pauseBackground(); feedbackMusic(false); setResult("pass") } }
 function next() {
  const opponentGain = (index + round * 7) % 4 === 0 ? 0 : 70 + ((index * 13 + round * 11) % 51), finalOpponent = opponent + opponentGain;
  setOpponent(finalOpponent);
  if (index < total - 1) { resumeBackground(); setIndex(i => i + 1); setSeconds(r.time); setGuess(""); setResult(null); return }
  if (round < 2) { resumeBackground(); setRound(v => v + 1); setIndex(0); setSeconds(rounds[round + 1].time); setGuess(""); setResult(null); return }
  resultMusic(score >= finalOpponent); setFinished(true);
 }
 function replay() { stopMusic(); setStarted(false); setTeamDraw("idle"); setFinished(false); setRound(0); setIndex(0); setSeconds(rounds[0].time); setGuess(""); setResult(null); setScore(0); setOpponent(0) }

 if (!started) return <div className="game-embed"><div className="tu-entry">{onExit && <a href="#" onClick={exit}>← RETOUR</a>}{teamDraw === "idle" ? <section><span>{eyebrow || "DÉFI D’ÉQUIPE"}</span><h1>TIME’S <b>UP!</b></h1><p>{total} cartes. Trois manches : décrire, donner un seul mot, puis suivre le dessin.</p><div><i>DESCRIPTION</i><i>UN SEUL MOT</i><i>DESSIN</i></div><button type="button" onClick={begin}>TOURNER LA ROUE <b>→</b></button></section> : <section className={`team-draw ${teamDraw} draw-${team.toLowerCase()}`} aria-live="polite"><span>{teamDraw === "spinning" ? "LA ROUE CHOISIT…" : "BIENVENUE DANS"}</span><div className="team-wheel"><div><b>GOLD</b><b>PURPLE</b><b>GOLD</b><b>PURPLE</b></div></div><h2>{teamDraw === "revealed" ? `TEAM ${team}` : "BONNE CHANCE…"}</h2><p>{teamDraw === "revealed" ? "Votre équipe est prête. La première manche va commencer." : "Votre équipe est tirée au sort."}</p></section>}</div></div>;

 if (finished) { const won = score >= opponent; return <div className="game-embed"><div className={`tu-results ${team.toLowerCase()}`}>{onExit && <a href="#" onClick={exit}>← RETOUR</a>}<section><span>SCORE FINAL</span><h1>{won ? "VOTRE ÉQUIPE GAGNE !" : "QUEL MATCH SERRÉ !"}</h1><div className="tu-final"><div><small>TEAM {team}</small><strong>{score}</strong></div><b>VS</b><div><small>TEAM {team === "GOLD" ? "PURPLE" : "GOLD"}</small><strong>{opponent}</strong></div></div><p>Vous avez joué les {total} cartes dans les trois manches.</p><button type="button" onClick={replay}>REJOUER</button></section></div></div> }

 return <div className="game-embed"><div className={`tu-game team-${team.toLowerCase()} ${result ? `result-${result}` : ""}`}>
  <header>{onExit ? <a href="#" onClick={exit}>← QUITTER</a> : <span/>}<div><b translate="no">{game.title}</b><span>MANCHE {round + 1} · {r.name}</span></div><div className="tu-header-actions"><strong>TEAM {team}</strong><button type="button" onClick={toggleMusic} aria-label={music ? "Couper la musique" : "Lancer la musique"}>{music ? "♪ MUSIQUE ON" : "♩ MUSIQUE OFF"}</button></div></header>
  <section className="tu-stage">
   <aside className="team-board ours"><span>TEAM {team}</span><strong>{score}</strong><div className="tu-avatars"><i>MD</i><i>H</i><i>+</i></div></aside>
   <aside className="team-board theirs"><span>TEAM {team === "GOLD" ? "PURPLE" : "GOLD"}</span><strong>{opponent}</strong><div className="tu-avatars"><i>V</i><i>M</i><i>S</i></div></aside>
   <section className="tu-screen">
    <div className="timer" style={{"--time": `${(seconds / r.time) * 100}%`} as React.CSSProperties}><strong>{seconds}</strong><small>SECONDES</small></div>
    <div className="card-meta"><span>CARTE {index + 1} / {total}</span><b translate="no">{card.kind}</b></div>
    {round === 0 && <div className="description"><span>DESCRIPTION</span><h2 translate="no">{card.description}</h2>{seconds <= 15 && card.extra && <p translate="no">{card.extra}</p>}</div>}
    {round === 1 && <div className="one-word"><span>UN SEUL MOT</span><h2 translate="no">{card.one}</h2></div>}
    {round === 2 && <div className="ai-sketch"><span>DESSIN EN COURS…</span><div>{card.sketch.map((s, i) => <i className={i < reveal ? "visible" : ""} key={`${s}-${i}`}>{s}</i>)}</div><small>NI LETTRES · NI MOTS</small></div>}
    <form onSubmit={submit}><input autoFocus disabled={!!result} value={guess} onChange={e => setGuess(e.target.value)} placeholder="Tapez votre réponse…" aria-label="Votre réponse"/><button disabled={!!result || !guess.trim()}>VALIDER</button></form>
    <section className="ai-host"><div className="host-avatar">H</div><span>VOTRE ANIMATEUR</span><p>{result === "correct" ? "Excellent ! Votre équipe marque les points." : result === "pass" ? <>Temps écoulé ! La carte était <b translate="no">{card.word}</b>.</> : round === 0 ? "Écoutez bien la description." : round === 1 ? "Un seul mot. Faites confiance à votre mémoire." : "Regardez le dessin apparaître."}</p></section>
    {!result ? <button type="button" className="pass" onClick={pass}>PASSER CETTE CARTE</button> : <button type="button" className="next-card" onClick={next}>{round === 2 && index === total - 1 ? "VOIR LE SCORE FINAL" : index === total - 1 ? "MANCHE SUIVANTE" : "CARTE SUIVANTE"} →</button>}
   </section>
  </section>
  <footer><span>MANCHE {round + 1} SUR 3</span><div><i style={{width: `${((round * total + index + 1) / (total * 3)) * 100}%`}}/></div><b>{round * total + index + 1} / {total * 3}</b></footer>
 </div></div>;
}
