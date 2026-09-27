import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {normalizeArena, readArena, shuffledArena, arenaPurpose, isArenaActivity} from '../app/lib/arena.ts';

const raw = {title:'Primevère', headline:['Découvrir','Primevère'], questions:[
 {type:'single', prompt:'Année de création ?', options:['1958','1962','1978','1988'], correct:0, explanation:'Créée en 1958.'},
 {type:'multi', prompt:'Distributeurs en Europe ? (2 réponses)', options:['BÖHME GMBH','HARVEY INC.','FIRMA VENERE','KBEAUTY'], correct:[0,2]},
 {type:'single', prompt:'PDG ?', options:['Pierre BOSS','Yves BILLET'], correct:'0'},
 {type:'single', prompt:'invalide', options:['a','b'], correct:5},
 {type:'multi', prompt:'toutes vraies', options:['a','b'], correct:[0,1]},
]};

test('normalise les questions de l’Arène et écarte les invalides', () => {
 const a = normalizeArena(raw);
 assert.equal(a.questions.length, 3);
 assert.equal(a.questions[1].type, 'multi');
 assert.deepEqual(a.questions[1].correct, [0,2]);
 assert.equal(a.questions[2].correct, 0);
 assert.ok(readArena(JSON.stringify(a)));
 assert.equal(readArena('{"__digital":true}'), null);
});
test('le mélange conserve les bonnes réponses', () => {
 const a = normalizeArena(raw);
 for (let k = 0; k < 20; k++) shuffledArena(a.questions).forEach(q => {
  const src = a.questions.find(x => x.id === q.id);
  const good = c => (Array.isArray(c) ? c : [c]);
  assert.deepEqual(good(q.correct).map(i => q.options[i]).sort(), good(src.correct).map(i => src.options[i]).sort());
 });
});
test('consigne IA et libellés', () => {
 assert.ok(arenaPurpose('C','O').includes('exactement 15 questions'));
 assert.ok(isArenaActivity('L’ARÈNE') && isArenaActivity('QUIZ ARENA'));
 assert.throws(() => normalizeArena({questions:[]}));
});
