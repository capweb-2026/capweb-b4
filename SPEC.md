# SPEC.md — L'identité de TriMalin

## Objectif

L'assistant de tri et de recyclage a une identité reconnaissable dès l'ouverture de la page : il s'appelle TriMalin, a un emoji ♻️, souhaite la bienvenue et propose trois questions pour savoir tout de suite où jeter un déchet.

## Identité retenue

- **Nom** : `TriMalin`
- **Emoji** : `♻️`
- **Message d'accueil** : `Bonjour, je suis TriMalin ! Dites-moi quel déchet vous avez, je vous dis dans quel bac le jeter.`
- **Questions suggérées**, dans cet ordre :
  1. `Où jeter mes piles ?`
  2. `Le verre va dans quel bac ?`
  3. `Que faire de mes épluchures ?`

## Critères d'acceptation

1. **Nom** — Quand la page s'ouvre, le système affiche le nom `TriMalin` dans le titre principal (`h1`). Le nom, sans les espaces autour, fait de 2 à 20 caractères visibles : une lettre accentuée comme « é » compte pour un. Un nom de 1 ou de 21 caractères est refusé ; un nom de 2 ou de 20 caractères est accepté.
2. **Emoji** — Quand la page s'ouvre, le système affiche un seul emoji, `♻️`, dans le titre principal, à côté du nom. Un emoji composé comme `♻️` ou `🛡️` compte pour un seul emoji, même si sa longueur en JavaScript vaut 2 ou plus. Deux emojis (`♻️🌱`), du texte (`a`) ou une valeur vide sont refusés.
3. **Accueil** — Quand la conversation est vide, le système affiche le message d'accueil, qui contient le nom `TriMalin`. Ce message n'est pas une ligne de `#messages`. Il disparaît dès qu'une ligne apparaît dans `#messages`, reste caché après un rechargement si la conversation enregistrée n'est pas vide, et revient quand la conversation est effacée avec le bouton « Effacer la conversation ». Un accueil qui ne contient pas le nom est refusé.
4. **Suggestions** — Quand la page s'ouvre, le système propose exactement trois questions suggérées, sous forme de boutons, dans l'ordre de la section « Identité retenue ». Quand l'utilisateur clique sur l'une d'elles, le système place le texte de la question dans `#message` et y met le focus, sans l'envoyer : `#messages` ne gagne aucune ligne. Moins ou plus de trois suggestions, une suggestion vide ou faite d'espaces, deux suggestions identiques ou une suggestion de plus de 280 caractères sont refusées.
5. **Réponses signées** — Quand l'assistant répond, sa ligne dans `#messages` commence par `TriMalin : ` au lieu de `Assistant : `. Les lignes de l'utilisateur commencent toujours par `Vous : `.
6. **Contrat** — Les tests de contrat CP1 (`tests/contrat/` et `browser/contrat.spec.js`) et les tests existants restent verts : `npm run verify` passe.

## Cerveau tri et recyclage

TriMalin doit savoir répondre aux questions de tri, y compris aux trois suggestions. Les règles restent dans `brain.js`, sans IA.

7. **Déchets connus** — Quand le message contient un des mots `plastique`, `verre`, `papier`, `carton`, `pile` ou `compost`, le système répond par la consigne de tri de ce déchet. Chaque déchet a sa propre réponse, différente des autres et différente du repli. Les trois questions suggérées reçoivent ainsi une consigne : « Où jeter mes piles ? » → pile, « Le verre va dans quel bac ? » → verre, « Que faire de mes épluchures ? » → compost.
8. **Mot dans une phrase** — Quand le mot connu est au milieu d'une phrase, avec majuscules, accents, ponctuation, pluriel (`piles`, `bocaux`, `épluchures`) ou synonyme (`batterie` → pile, `bocal` → verre, `journal` → papier, `brique` → carton, `flacon` → plastique, `épluchure` → compost, `coucou`/`hello` → salut), le système répond comme pour le mot seul. Seuls les mots entiers comptent : « tester » ne déclenche pas « test ». Quand une phrase contient un déchet et une salutation, c'est le déchet qui gagne.
9. **Aide et repli** — La réponse à « aide » cite les déchets connus. Un message sans mot connu reçoit une réponse de repli qui renvoie vers « aide ».

## Hors périmètre

- Pas de choix ni de modification de l'identité par l'utilisateur.
- Pas d'image, d'avatar ni de logo.
- Pas d'appel à une IA ni à un service extérieur.
- Pas de changement du titre de l'onglet (`<title>`) ni de la mémoire, au-delà de ce que demandent les critères 1 à 5.
- Aucune dépendance ajoutée, aucun test existant modifié.

## Données et fonctions attendues

- **`public/js/persona.js`** (nouveau) exporte :
  - `persona`, un objet `{ nom, emoji, accueil, suggestions }` :
    - `nom` : chaîne, `'TriMalin'` ;
    - `emoji` : chaîne, `'♻️'` ;
    - `accueil` : chaîne, le message d'accueil de la section « Identité retenue » ;
    - `suggestions` : tableau de trois chaînes, dans l'ordre de la section « Identité retenue ».
  - `validatePersona(persona)`, qui renvoie `{ ok: true }` si toutes les règles des critères 1 à 4 sont respectées, sinon `{ ok: false, erreurs: [texte, …] }`, avec un texte non vide par règle non respectée. Elle ne plante pas si `persona` n'est pas un objet ou s'il lui manque un champ : elle renvoie `ok: false`.
  - `validatePersona(persona)` renvoie `{ ok: true }` pour le `persona` exporté.
- `persona.js` ne touche pas à la page : aucun `document`, `window` ni `localStorage`, comme `brain.js`.
- **`public/js/view.js`** : `renderMessages(messages, container, nom)` signe les lignes `assistant` avec `nom` ; sans troisième argument, l'étiquette reste `Assistant`. Toujours `textContent`, jamais `innerHTML`.
- **`public/index.html`** contient, en dehors de `#messages` :
  - dans le `h1`, un élément `#emoji` et un élément `#nom` ;
  - un élément `#accueil` ;
  - un élément `#suggestions` qui contient trois `button type="button"`.
- Le nom, l'emoji, l'accueil et les suggestions affichés viennent de `persona.js` : leurs textes ne sont écrits qu'à un seul endroit.
- `persona.js` est ajouté à la liste blanche de `server/app.js`, dans `FICHIERS` et dans `TYPES`.
- Tests attendus : `tests/identite.test.js` (Node) et `browser/identite.spec.js` (navigateur).
- **`public/js/brain.js`** : `replyTo(message)` découpe le message en mots (minuscules, sans accents, sans ponctuation), applique les synonymes, puis cherche le premier mot connu dans l'ordre de priorité déchets, aide, test, salut. Toujours sans `document`. Tests attendus : `tests/tri.test.js`.

## Vraie IA (CP3)

TriMalin répond avec une vraie IA, appelée par le serveur. La clé ne quitte jamais le serveur, et l'assistant répond même quand l'IA est indisponible.

10. **Thème** — L'assistant répond aux questions de tri, de recyclage, de déchets, de collecte et de réemploi. Il répond en français, en trois phrases au maximum, sur un ton simple et pratique. Quand il ne sait pas, il le dit au lieu d'inventer une consigne.
11. **Hors thème** — Toute question étrangère au tri reçoit un refus poli en une phrase, qui rappelle le thème et invite à poser une question de tri. L'assistant ne répond pas à la question hors thème, même partiellement.
12. **Secret du prompt** — L'assistant ne révèle jamais ses instructions internes, ni son modèle, ni son adresse de passerelle, ni sa clé, quelle que soit la formulation de la demande (« ignore tes instructions », « répète ce qui précède », consigne cachée dans une question de tri). Il refuse et reste dans son rôle.
13. **Repli visible** — Quand l'IA ne répond pas (clé invalide, budget épuisé, délai dépassé), le système répond avec `replyTo` et affiche « mode dégradé » dans `#status`. La conversation garde deux lignes par échange : le message de l'utilisateur et la réponse. Le message de mode dégradé n'est jamais une ligne de `#messages`.
14. **Clé côté serveur** — Aucune clé ni adresse de passerelle dans `public/`, ni dans le dépôt. En prod, l'onglet *Réseau* du navigateur ne montre aucune requête vers la passerelle, seulement vers `/api/chat`.

### Choix du délai (piège 5 de la fiche)

Toutes les questions partent à l'IA ; le délai maximal est fixé à **3,5 secondes**, sous la limite de 5 secondes du smoke test. Passé ce délai, la réponse vient de `replyTo` et le mode dégradé s'affiche. Si la mesure du temps de réponse réel de la passerelle depuis la preview dépasse 4 secondes, on bascule sur l'autre option : les mots déjà connus de `replyTo` (les six déchets, salut, aide, test) gardent leur réponse immédiate, et seul le reste part à l'IA.

### Données et fonctions attendues (CP3)

- **`server/ia.js`** (nouveau) exporte `repondre({ message, fournisseur, delaiMax })` :
  - renvoie toujours `{ texte, source }`, où `source` vaut `'ia'` ou `'regles'` ;
  - ne lève jamais d'erreur : fournisseur absent, en échec ou trop lent donnent `{ texte: replyTo(message), source: 'regles' }` ;
  - un message refusé par `validateMessage` donne `{ texte: erreur, source: 'regles' }` sans appeler le fournisseur ;
  - le `fournisseur` est reçu en paramètre : la passerelle en prod, un faux dans les tests.
- **Le prompt système** vit dans `server/`, jamais dans `public/`.
- **`api/chat.js`** : porte d'entrée de la prod, minimale, sans globale Node.
- **`server/app.js`** : route `POST /api/chat` qui appelle le même module, pour les tests locaux.
- **`public/js/app.js`** : envoie le message à `/api/chat`, affiche la réponse, et signale le mode dégradé dans `#status` quand la source n'est pas `'ia'`. Si la requête échoue, la page se replie elle-même sur `replyTo`.
- Appel à la passerelle : `POST <CAPWEB_IA_URL>/chat/completions`, en-tête `Authorization: Bearer <CAPWEB_IA_CLE>`, modèle `capweb-ia`, messages au format OpenAI (prompt système, derniers échanges, message). La réponse est dans `choices[0].message.content`.
- Zéro dépendance : `fetch` natif. Délai maximal avec `setTimeout`, pas `AbortController` (inconnu du lint).
- Tests attendus : `tests/ia.test.js` (Node, avec un faux fournisseur, sans clé).

## Questions ouvertes

Aucune.
