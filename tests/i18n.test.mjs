import test from 'node:test';
import assert from 'node:assert/strict';
import {translate} from '../app/lib/i18n.ts';

test('libellés de l’interface traduits', () => {
 assert.equal(translate('DÉCONNEXION'), 'SIGN OUT');
 assert.equal(translate('  Que voulez-vous concevoir ? '), 'What do you want to design?');
 assert.equal(translate("CONFIRMATION : le compte et l'accès seront supprimés définitivement."), 'CONFIRMATION: the account and access will be permanently deleted.');
});
test('libellés composés', () => {
 assert.equal(translate('2 OBJECTIFS PÉDAGOGIQUES'), '2 LEARNING OBJECTIVES');
 assert.equal(translate('1 OBJECTIF PÉDAGOGIQUE'), '1 LEARNING OBJECTIVE');
 assert.equal(translate('BROUILLON · ÉTAPE 3/5'), 'DRAFT · STEP 3/5');
 assert.equal(translate('01 · OBJECTIF'), '01 · OBJECTIVE');
 assert.equal(translate('APERÇU · Dossier à onglets'), 'PREVIEW · Tabbed file');
 assert.equal(translate('SÉQUENCE 02 · Découvrir Primevère'), 'SEQUENCE 02 · Découvrir Primevère');
});
test('contenu des formateurs inchangé', () => {
 assert.equal(translate('Assurer l’accueil physique et téléphonique'), null);
 assert.equal(translate('1958'), null);
});
