# Carte des défenses

Chaque ligne dit quelle connerie est arrêtée, par quoi, et **où est la preuve** : le lien d'un run rouge ou d'une PR bloquée. Une barrière sans preuve ne compte pas.

| Connerie | Barrière qui l'arrête | Preuve (lien) | Checkpoint |
|---|---|---|---|
| Régression | Tests de contrat et CI obligatoire sur `main` | https://github.com/capweb-2026/capweb-b4/actions/runs/34956777063 : run rouge de la PR #1 à l'étape `npm test`, le contrat a refusé le chatbot de J1 (brain.js et view.js manquants). https://github.com/capweb-2026/capweb-b4/actions/runs/35071358866 : run rouge du commit `test:` de la PR #2, nos tests d'identité vus échouer avant le code (`Cannot find module public/js/persona.js`). https://github.com/capweb-2026/capweb-b4/pull/3 et son run https://github.com/capweb-2026/capweb-b4/actions/runs/35198493639 : PR refusée qui acceptait les messages jusqu'à 300 caractères, arrêtée par le test de contrat « accepte 280 caractères et refuse 281 » | CP1, CP2 |
| Test affaibli ou supprimé | `check:tests` (TEST-CHANGE obligatoire) et relecture | https://github.com/capweb-2026/capweb-b4/pull/4 : PR refusée qui rendait tautologique le test de contrat de la limite de 281 caractères ; https://github.com/capweb-2026/capweb-b4/actions/runs/35198504935 : run rouge à l'étape `npm run check:tests`, « Test existant modifié ou supprimé sans justification : tests/contrat/brain.contrat.test.js » | CP2 |
| Dépendance ajoutée | `check:deps` et `dependances-autorisees.json` | https://github.com/capweb-2026/capweb-b4/pull/5 : PR refusée qui ajoutait la dépendance de production `dayjs`, inutilisée par le code ; https://github.com/capweb-2026/capweb-b4/actions/runs/35198518258 : run rouge à l'étape `npm run check:deps`, « Dépendance ajoutée sans autorisation : dayjs@1.11.23 » | CP2 |
| Secret exposé | | | CP3 |
| IA qui sort de son thème | | | CP3 |
| Faille (`innerHTML`, injection) | | | CP4 |
| Contrôle désactivé | | | CP4 |
| Action destructrice | | | CP4 |
