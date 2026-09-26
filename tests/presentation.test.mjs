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

test('multi-document dossier preserves media references and rejects invented source IDs',()=>{
 const docs=[{id:'D1',name:'Infographie.pdf',original:'owner/dossiers/a/original.pdf',pages:[{number:1,image:'owner/dossiers/a/page.jpg'}]},{id:'D2',name:'Catalogue.pdf',original:'owner/dossiers/b/original.pdf',pages:[]}];
 const p=normalizeProposal({summary:'Entreprise',blocks:[{title:'Produits',items:['Cinq gammes'],sourceIds:['D2','D99','https://external.invalid']}]},'source',docs);
 assert.deepEqual(p.sections[0].sourceIds,['D2']);assert.deepEqual(JSON.parse(JSON.stringify(p)).documents,docs);assert.equal(recommendedModel(p),'dossier');
 const purpose=presentationPurpose('Découvrir une entreprise','Identifier ses produits',false,'dossier',docs);
 assert.match(purpose,/Dossier illustré/);assert.match(purpose,/D1 : Infographie.pdf/);assert.match(purpose,/D2 : Catalogue.pdf/);assert.match(purpose,/sourceIds/);assert.doesNotMatch(purpose,/owner\/dossiers/);
});
