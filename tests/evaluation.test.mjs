import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {normalizeEvaluation, parseQuizText, readEvaluation, evaluationPurpose} from '../app/lib/evaluation.ts';
import {normalizeSurvey, parseSurveyText, readSurvey, surveyPurpose} from '../app/lib/games.ts';

test('Évaluation : lecture locale du format « 1. Question / A) / Réponse : B »', () => {
 const ev = parseQuizText(`Quiz accueil
1. Comment dit-on « bonjour » le matin ?
A) Good night
B) Good morning
C) Goodbye
Réponse : B
Explication : « Good morning » s’utilise jusqu’à midi.
2) Quelle formule est la plus polie ?
a) Give me
*b) Could you please give me
c) I want`, 'Accueil');
 assert.equal(ev.questions.length, 2);
 assert.equal(ev.questions[0].answer, 1);
 assert.deepEqual(ev.questions[0].choices, ['Good night', 'Good morning', 'Goodbye']);
 assert.match(ev.questions[0].explanation, /midi/);
 assert.equal(ev.questions[1].answer, 1);
 assert.equal(ev.questions[1].choices[1], 'Could you please give me');
 assert.ok(readEvaluation(JSON.stringify(ev)));
});

test('Évaluation : sans bonne réponse indiquée, message explicite', () => {
 assert.throws(() => parseQuizText('1. Question ?\nA) oui\nB) non'), /bonnes réponses/);
});

test('Évaluation : normalisation de la réponse IA et consigne fidèle', () => {
 const ev = normalizeEvaluation({title: 'Mon quiz', quiz: [{question: 'Q ?', choices: ['a', 'b'], answer: 1}, {question: 'X', choices: ['a'], answer: 0}]});
 assert.equal(ev.questions.length, 1);
 assert.throws(() => normalizeEvaluation({quiz: []}), /Aucune question/);
 assert.match(evaluationPurpose('C', 'O'), /mot pour mot/);
});

test('Questionnaire : import local et questions personnalisées', () => {
 const sv = parseSurveyText(`Questionnaire
1. La formation a répondu à mes attentes.
2. Les supports étaient-ils clairs ?
3. Quel module avez-vous préféré ?
4. Recommanderiez-vous cette formation ?`, 'CADGA');
 assert.equal(sv.origin, 'import');
 assert.deepEqual(sv.open, ['Quel module avez-vous préféré ?']);
 assert.equal(sv.scale.length, 2);
 assert.ok(readSurvey(JSON.stringify(sv)));
 const ai = normalizeSurvey({scale: ['a', 'b'], open: ['c ?']}, 'T', ['Obj 1'], 'ai');
 assert.deepEqual(ai.skills, ['Obj 1']);
 assert.match(surveyPurpose('ai', 'T', ['Obj 1']), /Obj 1/);
});
