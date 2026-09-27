'use client';
import {EN, EN_PATTERNS} from './i18n-dictionary';

/**
 * Langue de l’interface (français par défaut, anglais au choix du formateur).
 * L’interface est écrite en français ; en anglais, chaque libellé connu du
 * dictionnaire est remplacé à l’affichage. Les contenus saisis par les
 * formateurs ou générés par l’IA ne figurent pas dans le dictionnaire et
 * restent donc inchangés. Un élément marqué translate="no" n’est jamais traduit.
 */
export type Lang = 'fr' | 'en';
const KEY = 'lms-lang';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const;
const listeners = new Set<(l: Lang) => void>();

const norm = (s: string) => s.replace(/\s+/g, ' ').replace(/'/g, '’').trim();
const DICT: Record<string, string> = Object.fromEntries(Object.entries(EN).map(([k, v]) => [norm(k), v]));

function single(key: string): string | null {
 const hit = DICT[key];
 if (hit !== undefined) return hit;
 for (const [re, rep] of EN_PATTERNS) if (re.test(key)) return key.replace(re, rep as any);
 return null;
}

export function translate(text: string): string | null {
 const key = norm(text);
 if (!key || !/[A-Za-zÀ-ÿ]/.test(key)) return null;
 const whole = single(key);
 if (whole !== null) return whole;
 if (key.includes(' · ')) {
  const parts = key.split(' · ');
  const out = parts.map(p => single(p) ?? p);
  if (out.some((p, i) => p !== parts[i])) return out.join(' · ');
 }
 return null;
}

export function getLang(): Lang {
 try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'fr' } catch { return 'fr' }
}

// Texte d’origine (français) de chaque nœud traduit, et dernière valeur écrite.
const original = new WeakMap<Node, string>();
const written = new WeakMap<Node, string>();
const attrOriginal = new WeakMap<Element, Record<string, string>>();
let observer: MutationObserver | null = null;
let current: Lang = 'fr';

const skipped = (n: Node) => {
 const el = n.nodeType === 1 ? (n as Element) : n.parentElement;
 return !el || !!el.closest('[translate="no"],script,style,textarea,[contenteditable="true"]');
};

function setText(node: Node, value: string) { written.set(node, value); if (node.nodeValue !== value) node.nodeValue = value }

function translateTextNode(node: Text) {
 if (skipped(node)) return;
 const value = node.nodeValue || '';
 if (written.get(node) === value) return; // valeur déjà traduite par nous
 original.set(node, value);
 const t = translate(value);
 if (t !== null) {
  const lead = value.match(/^\s*/)![0], trail = value.match(/\s*$/)![0];
  setText(node, lead + t + trail);
 } else written.delete(node);
}

// Élément dont le texte est découpé en plusieurs morceaux (ex. « 2 OBJECTIFS PÉDAGOGIQUES »).
function translateLeaf(el: Element) {
 const nodes = Array.from(el.childNodes);
 if (nodes.length < 2 || !nodes.every(n => n.nodeType === 3) || skipped(el)) return;
 const texts = nodes.map(n => (written.get(n) === n.nodeValue ? original.get(n) ?? n.nodeValue : n.nodeValue) || '');
 const t = translate(texts.join(''));
 if (t === null) return;
 nodes.forEach((n, i) => { original.set(n, texts[i]); setText(n, i === 0 ? t : '') });
}

function translateAttrs(el: Element) {
 if (el.closest('[translate="no"]')) return;
 for (const a of ATTRS) {
  const v = el.getAttribute(a);
  if (!v) continue;
  const saved = attrOriginal.get(el) || {};
  if (saved['__w_' + a] === v) continue;
  const t = translate(v);
  if (t === null) continue;
  saved[a] = v; saved['__w_' + a] = t; attrOriginal.set(el, saved);
  if (t !== v) el.setAttribute(a, t);
 }
}

function translateTree(root: Node) {
 if (root.nodeType === 3) { translateTextNode(root as Text); if (root.parentElement) translateLeaf(root.parentElement); return }
 if (root.nodeType !== 1) return;
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
 const elements: Element[] = [root as Element];
 for (let n: Node | null = walker.nextNode(); n; n = walker.nextNode()) {
  if (n.nodeType === 3) translateTextNode(n as Text); else elements.push(n as Element);
 }
 elements.forEach(el => { translateAttrs(el); translateLeaf(el) });
}

function restoreTree(root: Element) {
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
 for (let n: Node | null = walker.nextNode(); n; n = walker.nextNode()) {
  if (n.nodeType === 3) {
   if (written.get(n) === n.nodeValue && original.has(n)) { n.nodeValue = original.get(n)!; written.delete(n) }
  } else {
   const saved = attrOriginal.get(n as Element);
   if (saved) for (const a of ATTRS) if (saved[a] && (n as Element).getAttribute(a) === saved['__w_' + a]) (n as Element).setAttribute(a, saved[a]);
   attrOriginal.delete(n as Element);
  }
 }
}

const nativeConfirm = typeof window !== 'undefined' ? window.confirm.bind(window) : null;
const nativeAlert = typeof window !== 'undefined' ? window.alert.bind(window) : null;
const nativePrompt = typeof window !== 'undefined' ? window.prompt.bind(window) : null;

export function applyLang(lang: Lang) {
 if (typeof document === 'undefined') return;
 current = lang;
 document.documentElement.lang = lang;
 observer?.disconnect(); observer = null;
 if (lang === 'fr') {
  restoreTree(document.body);
  if (nativeConfirm) window.confirm = nativeConfirm;
  if (nativeAlert) window.alert = nativeAlert;
  if (nativePrompt) window.prompt = nativePrompt;
  return;
 }
 const tr = (m?: string) => (m ? translate(m) ?? m : m);
 if (nativeConfirm) window.confirm = (m?: string) => nativeConfirm(tr(m));
 if (nativeAlert) window.alert = (m?: string) => nativeAlert(tr(m));
 if (nativePrompt) window.prompt = (m?: string, d?: string) => nativePrompt(tr(m), d);
 translateTree(document.body);
 observer = new MutationObserver(records => {
  for (const r of records) {
   if (r.type === 'characterData') { translateTextNode(r.target as Text); if (r.target.parentElement) translateLeaf(r.target.parentElement) }
   else if (r.type === 'attributes') translateAttrs(r.target as Element);
   else { r.addedNodes.forEach(translateTree); if (r.target.nodeType === 1) translateLeaf(r.target as Element) }
  }
 });
 observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS]});
}

export function setLang(lang: Lang) {
 try { localStorage.setItem(KEY, lang) } catch {}
 applyLang(lang);
 listeners.forEach(fn => fn(lang));
}

export function onLangChange(fn: (l: Lang) => void) { listeners.add(fn); return () => { listeners.delete(fn) } }
export const activeLang = () => current;
