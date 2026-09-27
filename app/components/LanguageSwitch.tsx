'use client';
import {useEffect, useState} from 'react';
import {applyLang, getLang, onLangChange, setLang, type Lang} from '../lib/i18n';

let started = false;
function start() { if (!started) { started = true; applyLang(getLang()) } }

/** Applique la langue enregistrée dès le chargement (sans rien afficher). */
export function LanguageRuntime() { useEffect(start, []); return null }

/** Sélecteur FR / EN de l’interface. */
export default function LanguageSwitch() {
 const [lang, setCurrent] = useState<Lang>('fr');
 useEffect(() => { start(); setCurrent(getLang()); return onLangChange(setCurrent) }, []);
 return <div className="lang-switch" role="group" aria-label="Langue / Language" translate="no">
  {(['fr', 'en'] as const).map(l => <button type="button" key={l} className={lang === l ? 'active' : ''} aria-pressed={lang === l} onClick={() => setLang(l)} title={l === 'fr' ? 'Français' : 'English'}>{l.toUpperCase()}</button>)}
 </div>;
}
