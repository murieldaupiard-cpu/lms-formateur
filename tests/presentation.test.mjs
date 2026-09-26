import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {normalizeProposal,presentationPurpose,recommendedModel} from '../app/lib/presentation.ts';
test('normalizes string content and rejects unusable provider responses',()=>{
 const p=normalizeProposal({summary:'Résumé',blocks:[{title:'Méthode',content:'Lire le document',type:'steps'},null]},'Source');
 assert.deepEqual(p.sections[0].items,['Lire le document']);
 assert.equal(p.source,'Source');assert.equal(recommendedModel(p),'program');
 for(const response of [{},null,{summary:'Vide',blocks:[]},{blocks:[{items:[null,42,{}]}]}])assert.throws(()=>normalizeProposal(response,'Source'));
});
test('generation uses selected model and distinguishes course from REAC',()=>{
 const course=presentationPurpose('Accueillir','Identifier la demande',false,'cards');
 assert.match(course,/Identifier la demande/);assert.match(course,/Cartes pédagogiques/);assert.doesNotMatch(course,/uniquement la compétence/);
 assert.match(presentationPurpose('Accueillir','',true,'program'),/Étapes guidées/);
 assert.match(presentationPurpose('Accueillir','',true),/avant le choix du modèle/);
});
