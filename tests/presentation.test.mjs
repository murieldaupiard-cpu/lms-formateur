import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {normalizeProposal,presentationPurpose,recommendedModel} from '../app/lib/presentation.ts';

test('normalizes string content and rejects unusable provider responses',()=>{
 const p=normalizeProposal({summary:'Résumé',blocks:[{title:'Méthode',content:'Lire le document',type:'steps'},null]},'Source');
 assert.deepEqual(p.sections[0].items,['Lire le document']);
 assert.equal(p.source,'Source');
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
 assert.deepEqual(p.sections[0].sourceIds,['D2']);assert.deepEqual(JSON.parse(JSON.stringify(p)).documents,docs);
 const purpose=presentationPurpose('Découvrir une entreprise','Identifier ses produits',false,'dossier',docs);
 assert.match(purpose,/Dossier à onglets/);assert.match(purpose,/D1 : Infographie.pdf/);assert.match(purpose,/D2 : Catalogue.pdf/);assert.match(purpose,/sourceIds/);assert.doesNotMatch(purpose,/owner\/dossiers/);
 assert.match(purpose,/metrics/);assert.match(purpose,/timeline/);
 assert.match(purpose,/OCR/);assert.match(purpose,/omets-le/);assert.doesNotMatch(purpose,/signale les contradictions/);
});

test('dossier is the default presentation and must be exhaustive and faithful',()=>{
 assert.equal(recommendedModel({sections:[{type:'skills',items:['a']}]}),'dossier');
 const purpose=presentationPurpose('Accueillir','Présenter l’entreprise',false,'dossier',[{id:'D1',name:'Organigramme.pdf',original:'',pages:[]}]);
 assert.match(purpose,/EXHAUSTIVITÉ/);assert.match(purpose,/organigramme/);assert.match(purpose,/distributeur/);assert.match(purpose,/groups/);assert.match(purpose,/N’invente aucune personne/);
 assert.match(purpose,/Ne crée pas d’onglet « Documents »/);
 const reac=presentationPurpose('Assurer l’accueil physique et téléphonique','',true,'dossier');
 assert.match(reac,/intitulé exact/);assert.match(reac,/Être capable de/);assert.match(reac,/mot pour mot/);
});

test('dossier tabs keep structured content and drop empty tabs',()=>{
 const p=normalizeProposal({title:'Primevère',summary:'Texte.',objectives:['Être capable de situer l’entreprise',3],blocks:[
  {title:'Équipe',heading:'Les services',kind:'groups',explanation:'Qui fait quoi.',groups:[{title:'Direction des achats',items:['Yves Billet · Directeur des achats',7]},{title:'',items:[]}],callout:{title:'Repère',text:'Le bon interlocuteur.'}},
  {title:'Histoire',kind:'timeline',timeline:[{date:'1958',text:'Création'},{}]},
  {title:'Chiffres',kind:'facts',facts:[{value:'150',label:'collaborateurs'}]},
  {title:'Vide',explanation:'Rien.'},
 ]},'src');
 assert.equal(p.title,'Primevère');assert.deepEqual(p.objectives,['Être capable de situer l’entreprise']);
 assert.equal(p.sections.length,3);
 assert.deepEqual(p.sections[0].groups,[{title:'Direction des achats',subtitle:'',items:['Yves Billet · Directeur des achats']}]);
 assert.equal(p.sections[0].heading,'Les services');assert.equal(p.sections[0].callout.text,'Le bon interlocuteur.');
 assert.deepEqual(p.sections[1].timeline,[{date:'1958',text:'Création'}]);
 assert.deepEqual(p.sections[2].facts,[{value:'150',label:'collaborateurs'}]);
});
