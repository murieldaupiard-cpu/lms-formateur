Correction du workflow IA — LMS Formateur

Base : dépôt murieldaupiard-cpu/lms-formateur, commit f482c88.
Styles existants conservés : aucune modification de globals.css.

Causes : import de contenu sans gestionnaire, sélecteur de modèles absent, appel IA possible avant extraction et toujours orienté REAC, erreurs de lecture marquées réussies, contenu et analyse absents de la sauvegarde des brouillons.

Correction : import branché, extraction avant analyse, trois modèles existants proposés (texte, cartes, étapes), recommandation selon la structure du support, sélection obligatoire avant génération, contexte compétence/objectif et modèle transmis à l’IA, aperçu avant validation, reprise de l’analyse et du choix dans le brouillon. Réponses IA vides rejetées. Limites explicites : PDF de 40 pages maximum et texte de 50 000 caractères maximum. Version du worker PDF alignée sur la bibliothèque.

Vérifications réussies : compilation de production et TypeScript ; deux tests automatisés (réponses IA invalides, contexte et modèle) ; navigateur local avec import TXT, apparition des trois modèles, recommandation étapes, sélection obligatoire, reprise après rechargement, message de connexion en mode démo. Fonction Supabase inspectée ; appel sans session refusé avec HTTP 401.

Restent à valider : génération DeepSeek avec un compte connecté, lecture PDF/OCR/DOCX/PPTX et publication distante. Les activités et jeux restent un chantier séparé. L’introduction de compétence conserve le stockage texte existant ; les contenus de cours conservent leur modèle dans le rendu apprenant.

Correction proposée sur une branche pour revue avant mise en production.

Installation : npm ci
Tests : node --experimental-strip-types --test tests/presentation.test.mjs
Compilation : npm run build
Démarrage : npm run start
