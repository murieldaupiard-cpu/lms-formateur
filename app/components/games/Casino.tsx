"use client";

import {useEffect, useRef, useState} from "react";
import "./games.css";
import "./casino.css";
import {shuffledCasino, type CasinoContent} from "../../lib/games";

// ---------------------------------------------------------------------------
// Casino Game — repris du Casino CADGA : roue d'équipe, capital de 100 €, mises
// (5, 10, 20, 50 € ou tapis), croupier, adversaires, explication après chaque main
// et « Final All-in ». Les questions sont générées par l'IA à partir des documents.
// ---------------------------------------------------------------------------

const players = [
 {name: "Victoria", role: "LA STRATÈGE", initial: "V"},
 {name: "Malik", role: "LE RISQUE-TOUT", initial: "M"},
 {name: "Sofia", role: "L’ANALYSTE", initial: "S"},
 {name: "James", role: "LE VÉTÉRAN", initial: "J"},
];
const stakes = [5, 10, 20, 50];

export default function Casino({game, eyebrow, onExit}: {game: CasinoContent; eyebrow?: string; onExit?: () => void}) {
 const [questions, setQuestions] = useState(() => shuffledCasino(game.questions)); const total = questions.length;
 const [index, setIndex] = useState(0), [balance, setBalance] = useState(100), [stake, setStake] = useState<number | null>(null), [choice, setChoice] = useState<number | null>(null), [locked, setLocked] = useState(false), [started, setStarted] = useState(false), [teamDraw, setTeamDraw] = useState<"idle" | "spinning" | "revealed">("idle"), [team, setTeam] = useState<"GOLD" | "PURPLE">("GOLD"), [finished, setFinished] = useState(false), [correct, setCorrect] = useState(0), [music, setMusic] = useState(true), [reaction, setReaction] = useState<"win" | "loss" | null>(null), [history, setHistory] = useState<number[]>([]);
 const audio = useRef<{ctx: AudioContext; timer: number} | null>(null);
 const timers = useRef<number[]>([]);
 const q = questions[index], isFinal = index === total - 1, available = Math.max(balance, 0), selectedStake = isFinal ? available : stake === null ? 0 : Math.min(stake, available);
 const exit = (e: React.MouseEvent) => { e.preventDefault(); stopAmbience(); onExit?.() };

 function tone(frequency: number, duration = .16) { if (!music) return; try { const Ctx = window.AudioContext || (window as any).webkitAudioContext; if (!Ctx) return; const ctx: AudioContext = audio.current?.ctx || new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = "sine"; osc.frequency.value = frequency; gain.gain.setValueAtTime(.045, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration) } catch {} }
 function startAmbience() { if (!music || audio.current) return; const Ctx = window.AudioContext || (window as any).webkitAudioContext; if (!Ctx) return; const ctx: AudioContext = new Ctx(); const playChord = () => { [110, 164.81, 220].forEach((f, i) => { const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = i === 1 ? "triangle" : "sine"; osc.frequency.value = f; gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.012, ctx.currentTime + .35); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 3.4); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 3.5) }) }; playChord(); const timer = window.setInterval(playChord, 3800); audio.current = {ctx, timer} }
 function stopAmbience() { if (!audio.current) return; window.clearInterval(audio.current.timer); void audio.current.ctx.close(); audio.current = null }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 useEffect(() => () => { stopAmbience(); timers.current.forEach(t => window.clearTimeout(t)) }, []);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 useEffect(() => { if (started && music && !finished) startAmbience(); else stopAmbience() }, [music, started, finished]);

 function enter() { const drawn = Math.random() > .5 ? "GOLD" : "PURPLE"; setTeam(drawn); setTeamDraw("spinning"); timers.current.push(window.setTimeout(() => setTeamDraw("revealed"), 2300), window.setTimeout(() => setStarted(true), 3900)) }
 function placeBet(amount: number) { if (choice === null || locked || amount <= 0) return; const wager = Math.min(amount, available), won = choice === q.answer; setStake(wager); setLocked(true); setReaction(won ? "win" : "loss"); setHistory(h => [...h, choice]); if (won) { setBalance(b => b + wager); setCorrect(c => c + 1); tone(659, .28) } else { setBalance(b => Math.max(0, b - wager)); tone(146, .32) } }
 function next() { if (index === total - 1) { setFinished(true); stopAmbience(); return } if (balance === 0) setBalance(20); setIndex(i => i + 1); setChoice(null); setLocked(false); setReaction(null); setStake(null) }
 function restart() { setQuestions(shuffledCasino(game.questions)); setIndex(0); setBalance(100); setStake(null); setChoice(null); setLocked(false); setStarted(true); setFinished(false); setCorrect(0); setReaction(null); setHistory([]) }

 if (!started) return <div className="game-embed"><div className="casino-entry"><div className="entry-vignette"/>{onExit && <a href="#" className="casino-back" onClick={exit}>← RETOUR</a>}{teamDraw === "idle" ? <section><span className="casino-kicker">{eyebrow || "DÉFI FINAL"}</span><h1><span translate="no">{game.title.replace(/casino/gi, "").replace(/\s+/g, " ").trim() || "LE"}</span><br/><b>CASINO</b></h1><p>{total} questions. Cent euros fictifs. Faites confiance à vos connaissances, placez vos mises et terminez par un dernier All-in.</p><div className="entry-rules"><span>{total} QUESTIONS</span><span>100 € AU DÉPART</span><span>FINAL ALL-IN</span></div><button type="button" onClick={enter}>TOURNER LA ROUE <b>→</b></button><small>Monnaie d’entraînement uniquement · Aucun argent réel</small></section> : <section className={`casino-team-draw ${teamDraw} draw-${team.toLowerCase()}`} aria-live="polite"><span className="casino-kicker">{teamDraw === "spinning" ? "LE CROUPIER FAIT TOURNER LA ROUE…" : "VOTRE TABLE EST PRÊTE"}</span><div className="casino-wheel"><div><b>GOLD</b><b>PURPLE</b><b>GOLD</b><b>PURPLE</b></div></div><h2>{teamDraw === "revealed" ? `TEAM ${team}` : "À VOUS DE JOUER…"}</h2><p>{teamDraw === "revealed" ? "Prenez place. La première main va commencer." : "La roue choisit votre équipe au hasard."}</p></section>}</div></div>;

 if (finished) { const ratio = correct / total; const title = ratio >= .9 ? "CHAMPION DU CASINO" : ratio >= .75 ? "HIGH ROLLER" : ratio >= .55 ? "PARIEUR AVISÉ" : "DÉBUTANT DU CASINO"; return <div className="game-embed"><div className="casino-results">{onExit && <a href="#" className="casino-back" onClick={exit}>← RETOUR</a>}<section><div className="result-crown">♛</div><span>PARTIE TERMINÉE</span><h1>{title}</h1><div className="result-money">{balance} €</div><p>Vous avez trouvé <b>{correct} / {total}</b> bonnes réponses.</p><div className="result-grid"><div><strong>100 €</strong><small>CAPITAL DE DÉPART</small></div><div><strong>{Math.max(100, balance)} €</strong><small>CAPITAL FINAL</small></div><div><strong>{history.length}</strong><small>MISES PLACÉES</small></div></div><div className="result-actions"><button type="button" onClick={restart}>REJOUER</button>{onExit && <a href="#" onClick={exit}>RETOUR À LA SÉQUENCE</a>}</div></section></div></div> }

 return <div className="game-embed"><div className={`casino-game ${reaction || ""}`}>
  <header>{onExit ? <a href="#" onClick={exit}>← QUITTER</a> : <span/>}<div><b translate="no">{game.title}</b><span>TEAM {team} · <span translate="no">{q.round}</span></span></div><button type="button" onClick={() => setMusic(v => !v)} aria-label={music ? "Couper la musique" : "Lancer la musique"}>{music ? "♪ MUSIQUE ON" : "♩ MUSIQUE OFF"}</button></header>
  <section className="casino-room">
   <div className="dealer"><div className="dealer-face"><span>♠</span></div><b>LE CROUPIER</b><small>{locked ? reaction === "win" ? "Excellent choix." : "La banque remporte la mise." : isFinal ? "Dernière main. Tout est en jeu." : "Faites vos jeux."}</small></div>
   <div className="opponents">{players.map((p, i) => <article className={`opponent o${i + 1} ${locked ? reaction || "" : ""}`} key={p.name}><div className="avatar">{p.initial}</div><b>{p.name}</b><small>{locked ? (reaction === "win" ? (i % 2 ? "Bien joué !" : "Bon choix.") : (i % 2 ? "C’était serré." : "La banque gagne.")) : p.role}</small><i>{locked ? reaction === "win" ? (i % 2 ? "👏" : "😮") : (i % 2 ? "😏" : "🤔") : ""}</i></article>)}</div>
   <section className="poker-table">
    <div className="table-mark">CASINO <span>♠</span></div>
    <div className="hand-info"><span>MAIN {index + 1} / {total}</span><div><i style={{width: `${(index + 1) / total * 100}%`}}/></div><b translate="no">{q.round}</b></div>
    <article className="question-card"><span>{isFinal ? `FINAL ALL-IN · QUESTION ${index + 1} SUR ${total}` : `QUESTION ${index + 1} SUR ${total}`}</span><h2 translate="no">{q.prompt}</h2><div className="answer-cards">{q.options.map((option, i) => <button type="button" disabled={locked} className={`${choice === i ? "selected" : ""} ${locked && i === q.answer ? "correct" : ""} ${locked && choice === i && i !== q.answer ? "wrong" : ""}`} onClick={() => setChoice(i)} key={i}><b>{String.fromCharCode(65 + i)}</b><span translate="no">{option}</span></button>)}</div>{locked && <div className={`answer-reveal ${reaction}`}><strong>{reaction === "win" ? `VOUS GAGNEZ ${selectedStake} €` : `VOUS PERDEZ ${selectedStake} €`}</strong>{q.explanation && <p translate="no">{q.explanation}</p>}</div>}</article>
    {stake !== null && <div className={`chip-pot ${locked ? reaction || "" : ""}`}><span>{selectedStake} €</span></div>}
   </section>
  </section>
  <footer className={`betting-dock ${choice !== null && !locked ? "needs-bet" : ""} ${!locked ? "betting-open" : ""}`}><div className="wallet"><small>VOTRE CAPITAL</small><strong>{balance} €</strong></div><div className="bets"><small>{isFinal ? "ÉTAPE 2 — CLIQUEZ POUR FAIRE TAPIS" : "ÉTAPE 2 — CLIQUEZ SUR UN JETON POUR MISER"}</small><em>{choice === null ? "Choisissez d’abord une des trois réponses A, B ou C." : isFinal ? `Cliquez sur ALL-IN pour miser vos ${available} €.` : "Votre clic confirme la mise immédiatement."}</em><div>{isFinal ? <button type="button" className="all-in active" disabled={locked || choice === null || available === 0} onClick={() => placeBet(available)}>ALL-IN {available} €</button> : <>{stakes.map(v => <button type="button" disabled={locked || choice === null || v > available} onClick={() => placeBet(v)} key={v}>{v} €</button>)}<button type="button" disabled={locked || choice === null || available === 0} className="all-in" onClick={() => placeBet(available)}>ALL-IN {available} €</button></>}</div></div>{locked && <button type="button" className="deal next" onClick={next}>{isFinal ? "VOIR LES RÉSULTATS" : "MAIN SUIVANTE"} <b>→</b></button>}</footer>
 </div></div>;
}
