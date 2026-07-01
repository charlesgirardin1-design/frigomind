# 🥕 FrigoMind

MVP d'une application food tech : **Photo → Ingrédients → Recettes**, en 3 clics.

## Concept

1. L'utilisateur prend en photo son frigo (ou sa table).
2. Une IA détecte réellement certains aliments visibles (100% dans le navigateur, gratuite).
3. L'utilisateur valide/corrige la liste d'ingrédients.
4. L'app propose 3 à 5 recettes réalistes, personnalisables (temps, type de cuisine, régime).

Bonus inclus : mode anti-gaspi (priorise les ingrédients périssables), bouton "J'ai faim → surprends-moi", historique des recettes générées (localStorage).

## Stack technique

- **React 18 + Vite** — build rapide, aucun serveur backend requis
- **Tailwind CSS** — design system minimaliste (vert "fraîcheur" / orange "gourmand")
- Aucune dépendance de routing ou de state management externe : Context + `useReducer` maison, routage par état local
- **TensorFlow.js + COCO-SSD** — vraie détection d'objets exécutée dans le navigateur, gratuite, sans clé API (voir `src/data/mockVision.js`, le nom du fichier n'a pas changé mais il ne contient plus rien de "mock")

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
│   │   ├── mockVision.js      # vraie détection d'image (TensorFlow.js + COCO-SSD, dans le navigateur)
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

## Comportement IA (vraie détection, gratuite)

`src/data/mockVision.js` charge le modèle **COCO-SSD** (via `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd`) directement dans le navigateur de l'utilisateur, et l'exécute sur la photo prise/importée. Aucune clé API, aucun serveur : tout se passe côté client.

Limite assumée : COCO-SSD est un modèle généraliste à 80 classes d'objets du quotidien. Seule une dizaine correspond à des aliments (banane, pomme, orange, brocoli, carotte, sandwich, hot-dog, pizza, donut, gâteau). Il ne reconnaît pas des ingrédients comme œufs, fromage, lait, oignon, viande crue, etc., car ce ne sont pas des classes du modèle — dans ce cas la liste détectée est vide, ce qui est normal, et l'utilisateur complète à la main.

`src/logic/recipeEngine.js` calcule ensuite un score de correspondance par recette : il favorise les recettes qui utilisent le plus d'ingrédients disponibles, ignore les basiques de placard (sel, poivre, huile...) dans le calcul des ingrédients manquants, ajoute un bonus pour les recettes anti-gaspi, et **garantit toujours au moins une suggestion** même si aucune recette ne correspond parfaitement.

## Passer à une détection plus précise (Claude Vision)

Le point d'intégration est **entièrement isolé** dans `src/data/mockVision.js`. Pour reconnaître vraiment tous les ingrédients (œufs, fromage, lait...), il faut un modèle multimodal plus puissant :

1. Créer un backend (route serverless Vercel dans `/api`, par ex.) qui reçoit l'image en base64 et appelle l'API Claude avec un prompt du type :
   > "Voici une photo d'un frigo ou d'une table. Liste les aliments visibles au format JSON : `[{name, confidence}]`. Si un aliment est ambigu, propose des alternatives possibles."
2. Stocker la clé API Anthropic comme variable d'environnement **côté serveur uniquement** (jamais exposée au navigateur).
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
- ✅ Analyse IA réelle (TensorFlow.js, gratuite, dans le navigateur), jamais bloquante
- ✅ Liste modifiable (cases à cocher, ajout, suppression, renommage via alternatives)
- ✅ 3 à 5 recettes avec nom, temps, niveau, ingrédients utilisés, étapes numérotées
- ✅ Personnalisation : temps max, type de cuisine, régime végétarien
- ✅ Design moderne, mobile-first, fond clair + accents vert/orange, cartes pour les recettes
- ✅ Bonus : mode anti-gaspi, bouton surprise, historique des recettes générées
- ✅ Immédiatement exécutable (`npm install && npm run dev`), aucune dépendance backend obligatoire
