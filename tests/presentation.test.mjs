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
 assert.match(purpose,/Dossier illustré/);assert.match(purpose,/D1 : Infographie.pdf/);assert.match(purpose,/D2 : Catalogue.pdf/);assert.match(purpose,/sourceIds/);assert.match(purpose,/OCR/);assert.match(purpose,/omets-le/);assert.doesNotMatch(purpose,/signale les contradictions/);assert.match(purpose,/metrics/);assert.match(purpose,/timeline/);
 const kpis=normalizeProposal({summary:'E',blocks:[{title:'Identité',items:['18 salariés']}],metrics:['18 salariés','1,2 M€',3],timeline:['2012','2016']},'source',docs);
 assert.deepEqual(kpis.metrics,['18 salariés','1,2 M€']);assert.deepEqual(kpis.timeline,['2012','2016']);assert.doesNotMatch(purpose,/owner\/dossiers/);
});

test('AI can recommend a mind map or infographic, including for a REAC',()=>{
 const reac=presentationPurpose('Accueillir un visiteur','',true);
 assert.match(reac,/recommendedModel/);assert.match(reac,/mindmap/);assert.match(reac,/infographic/);assert.match(reac,/REAC/);assert.doesNotMatch(reac,/dossier \(/);
 assert.match(presentationPurpose('Accueillir','',true,'mindmap'),/idée centrale/);
 assert.match(presentationPurpose('Accueillir','',true,'infographic'),/décomptes exacts/);
 const p=normalizeProposal({summary:'REAC',center:'Accueil du public',recommendedModel:'mindmap',recommendationReason:'Compétences reliées.',blocks:[{title:'Activité 1',type:'skills',items:['Accueillir']}]},'src');
 assert.equal(recommendedModel(p),'mindmap');assert.equal(p.center,'Accueil du public');assert.equal(p.recommendationReason,'Compétences reliées.');
 const bad=normalizeProposal({summary:'x',recommendedModel:'<script>',recommendationReason:'x',blocks:[{title:'A',type:'skills',items:['a']}]},'src');
 assert.equal(bad.recommendedModel,undefined);assert.equal(bad.recommendationReason,'');assert.equal(recommendedModel(bad),'mindmap');
 assert.equal(normalizeProposal({summary:'x',recommendedModel:'dossier',blocks:[{title:'A',items:['a']}]},'src').recommendedModel,undefined);
 assert.equal(recommendedModel({sections:[{type:'context',items:['a']}],metrics:['18 salariés','1,2 M€'],timeline:['2012']}),'infographic');
});
