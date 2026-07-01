# 🥕 FrigoMind

MVP d'une application food tech : **Photo → Ingrédients → Recettes**, en 3 clics.

## Concept

1. L'utilisateur prend en photo son frigo (ou sa table).
2. Une IA (simulée) détecte les aliments visibles.
3. L'utilisateur valide/corrige la liste d'ingrédients.
4. L'app propose 3 à 5 recettes réalistes, personnalisables (temps, type de cuisine, régime).

Bonus inclus : mode anti-gaspi (priorise les ingrédients périssables), bouton "J'ai faim → surprends-moi", historique des recettes générées (localStorage).

## Stack technique

- **React 18 + Vite** — build rapide, aucun serveur backend requis
- **Tailwind CSS** — design system minimaliste (vert "fraîcheur" / orange "gourmand")
- Aucune dépendance de routing ou de state management externe : Context + `useReducer` maison, routage par état local
- IA simulée via `src/data/mockVision.js` (voir plus bas pour brancher une vraie API)

## Lancer le projet

Prérequis : [Node.js](https://nodejs.org) 18+ installé.

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (en général `http://localhost:5173`).

Build de production :

```bash
npm run build
npm run preview
```

## Structure du projet

```
frigomind/
├── index.html
├── src/
│   ├── main.jsx              # point d'entrée React
│   ├── App.jsx                # routeur simple basé sur l'état global
│   ├── index.css              # design system Tailwind (couleurs, boutons, cards)
│   ├── state/
│   │   └── AppContext.jsx     # état global : photo, ingrédients, préférences, recettes, historique
│   ├── data/
│   │   ├── mockVision.js      # simulation de la détection IA (à remplacer par une vraie API)
│   │   ├── recipesDB.js       # base de recettes (ingrédients requis/optionnels, étapes)
│   │   └── expiryData.js      # ingrédients périssables + basiques de placard (pour l'anti-gaspi)
│   ├── logic/
│   │   └── recipeEngine.js    # scoring et sélection des recettes selon ingrédients + préférences
│   ├── components/            # Header, PreferencesPanel, AntiGaspiBanner, RecipeCard, RecipeModal
│   ├── pages/                 # HomePage, UploadPage, ValidatePage, ResultsPage, HistoryPage
│   └── utils/
│       └── storage.js         # persistance de l'historique en localStorage
└── package.json
```

## Comportement IA (mock actuel)

`src/data/mockVision.js` simule un modèle de vision : il retourne aléatoirement l'un de 10 scénarios de frigo réalistes (œufs/tomates/fromage, poulet/riz/poivron, pâtes/tomates, etc.), avec :

- un score de confiance par ingrédient
- des **alternatives proposées** pour les ingrédients incertains (ex : "lait ou crème fraîche ou yaourt"), pour ne jamais bloquer l'utilisateur sur une mauvaise détection

`src/logic/recipeEngine.js` calcule ensuite un score de correspondance par recette : il favorise les recettes qui utilisent le plus d'ingrédients disponibles, ignore les basiques de placard (sel, poivre, huile...) dans le calcul des ingrédients manquants, ajoute un bonus pour les recettes anti-gaspi, et **garantit toujours au moins une suggestion** même si aucune recette ne correspond parfaitement.

## Brancher une vraie API de vision (Claude Vision)

Le point d'intégration est **entièrement isolé** dans `src/data/mockVision.js`. Pour brancher une vraie IA :

1. Créer un petit backend (Node/Express, serverless, etc.) qui reçoit l'image en base64 et appelle l'API Claude avec un prompt du type :
   > "Voici une photo d'un frigo ou d'une table. Liste les aliments visibles au format JSON : `[{name, confidence}]`. Si un aliment est ambigu, propose des alternatives possibles."
2. Ne **jamais** exposer la clé API côté client — toujours passer par ce backend.
3. Remplacer le corps de `analyzeImage()` dans `mockVision.js` par un `fetch('/api/analyze-fridge', { method: 'POST', body: JSON.stringify({ image }) })` qui retourne le même format `{ items: [{ id, name, confidence, alternatives, checked }] }`.

Aucun autre fichier n'a besoin de changer : `AppContext.jsx` appelle `analyzeImage()` sans connaître son implémentation.

## Pousser ce projet sur ton repo GitHub

Le projet est prêt, mais Claude n'a pas accès à tes identifiants GitHub. Depuis ce dossier :

```bash
cd frigomind
git init
git remote add origin https://github.com/charlesgirardin1-design/frigomind.git
git add .
git commit -m "FrigoMind MVP : photo -> ingrédients -> recettes"
git branch -M main
git push -u origin main
```

Si le repo distant contient déjà un README ou des fichiers, fais d'abord `git pull origin main --allow-unrelated-histories` avant le push, ou force-push si tu es sûr de vouloir écraser le contenu existant.

## Couverture du cahier des charges

- ✅ Upload photo (prendre une photo / importer une image) avec aperçu immédiat
- ✅ Analyse IA (simulée), jamais bloquante, propose des alternatives en cas d'incertitude
- ✅ Liste modifiable (cases à cocher, ajout, suppression, renommage via alternatives)
- ✅ 3 à 5 recettes avec nom, temps, niveau, ingrédients utilisés, étapes numérotées
- ✅ Personnalisation : temps max, type de cuisine, régime végétarien
- ✅ Design moderne, mobile-first, fond clair + accents vert/orange, cartes pour les recettes
- ✅ Bonus : mode anti-gaspi, bouton surprise, historique des recettes générées
- ✅ Immédiatement exécutable (`npm install && npm run dev`), aucune dépendance backend obligatoire
