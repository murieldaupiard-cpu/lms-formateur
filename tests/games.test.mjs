import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {normalizeCasino, normalizeTimesUp, readCasino, readTimesUp, readSurvey, surveyContent, cleanGuess, casinoPurpose, timesUpPurpose} from '../app/lib/games.ts';

test('Casino : questions valides, dernière question en Final All-in', () => {
 const qs = Array.from({length: 8}, (_, i) => ({round: 'échauffement', prompt: `Q${i} ?`, options: ['a', 'b', 'c'], answer: i % 3, explanation: 'e'}));
 qs.push({prompt: 'mauvaise', options: ['a'], answer: 0});
 const c = normalizeCasino({title: 'Casino Primevère', questions: qs});
 assert.equal(c.questions.length, 8);
 assert.equal(c.questions[0].round, 'ÉCHAUFFEMENT');
 assert.equal(c.questions.at(-1).round, 'FINAL ALL-IN');
 assert.ok(readCasino(JSON.stringify(c)));
 assert.throws(() => normalizeCasino({questions: []}));
});
test('Time’s Up : cartes valides et dédoublonnées', () => {
 const cards = Array.from({length: 6}, (_, i) => ({word: `Mot ${i}`, description: `Définition ${i}`, one: 'indice', sketch: ['📦', '🚚', '⌂'], kind: 'produit'}));
 cards.push({word: 'Mot 0', description: 'doublon'}, {word: 'Sans description'});
 const t = normalizeTimesUp({cards});
 assert.equal(t.cards.length, 6);
 assert.equal(t.cards[0].kind, 'PRODUIT');
 assert.ok(readTimesUp(JSON.stringify(t)));
 assert.equal(cleanGuess('Crème de jour'), cleanGuess('creme de JOUR'));
});
test('Questionnaire et consignes IA', () => {
 const s = surveyContent('Accueil', ['Objectif 1', '', 'Objectif 2']);
 assert.deepEqual(s.skills, ['Objectif 1', 'Objectif 2']);
 assert.ok(readSurvey(JSON.stringify(s)));
 assert.equal(readSurvey('{"__casino":true}'), null);
 assert.ok(casinoPurpose('C', 'O').includes('exactement 20 questions'));
 assert.ok(timesUpPurpose('C', 'O').includes('exactement 20 cartes'));
});

test('Casino : un seul Final All-in et mélange des réponses', async () => {
 const m = await import('../app/lib/games.ts');
 const qs = Array.from({length: 6}, (_, i) => ({round: i > 3 ? 'FINAL ALL-IN' : 'A', prompt: `Q${i}`, options: [`bon${i}`, 'x', 'y'], answer: 0}));
 const c = m.normalizeCasino({questions: qs});
 assert.equal(c.questions.filter(q => q.round === 'FINAL ALL-IN').length, 1);
 for (let k = 0; k < 10; k++) m.shuffledCasino(c.questions).forEach((q, i) => assert.equal(q.options[q.answer], `bon${i}`));
});
