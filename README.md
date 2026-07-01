# 🥕 FrigoMind

MVP d'une application food tech : **Photo → Ingrédients → Recettes**, en 3 clics.

## Concept

1. L'utilisateur prend en photo son frigo (ou sa table).
2. Une IA multimodale gratuite (Google Gemini) détecte réellement les aliments visibles sur la photo.
3. L'utilisateur valide/corrige la liste d'ingrédients.
4. L'app propose 3 à 5 recettes réalistes, personnalisables (temps, type de cuisine, régime).

Bonus inclus : mode anti-gaspi (priorise les ingrédients périssables), bouton "J'ai faim → surprends-moi", historique des recettes générées (localStorage).

## Stack technique

- **React 18 + Vite** — build rapide
- **Tailwind CSS** — design system minimaliste (vert "fraîcheur" / orange "gourmand")
- Aucune dépendance de routing ou de state management externe : Context + `useReducer` maison, routage par état local
- **Google Gemini** via une fonction serverless Vercel (`/api/analyze-fridge.js`) — reconnaît un vocabulaire alimentaire large (œufs, fromage, lait, oignon, viande, légumes...), pas juste une dizaine de classes fixes. Palier gratuit sans carte bancaire.

## ⚠️ Configuration requise pour que l'analyse IA fonctionne

Cette app appelle l'API Google Gemini depuis une fonction serverless Vercel. Pour que ça marche une fois déployé, il faut définir une variable d'environnement sur Vercel :

1. Créer une clé API **gratuite** sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (aucune carte bancaire requise pour le palier gratuit)
2. Dans le projet Vercel → **Settings → Environment Variables**, ajouter :
   - Nom : `GEMINI_API_KEY`
   - Valeur : la clé créée à l'étape 1
3. Redéployer (un nouveau déploiement prend en compte la variable)

Sans cette clé, l'app ne plante pas : elle affiche simplement une liste vide et l'utilisateur ajoute ses ingrédients à la main.

Optionnel : `GEMINI_MODEL` permet de changer le modèle utilisé (par défaut `gemini-2.5-flash`) si Google renomme ses modèles, sans avoir à modifier le code.

## Lancer le projet en local

Prérequis : [Node.js](https://nodejs.org) 18+ installé.

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (en général `http://localhost:5173`).

⚠️ En local avec `npm run dev`, la route `/api` n'existe pas (elle n'est servie que par Vercel ou par `vercel dev`) : la détection IA renverra une liste vide, ce qui est normal. Utilisez `vercel dev` (CLI Vercel) si vous voulez tester l'API en local avec la clé.

Build de production :

```bash
npm run build
npm run preview
```

## Structure du projet

```
frigomind/
├── index.html
├── api/
│   └── analyze-fridge.js      # fonction serverless Vercel : appelle Google Gemini, garde la clé API secrète
├── src/
│   ├── main.jsx              # point d'entrée React
│   ├── App.jsx                # routeur simple basé sur l'état global
│   ├── index.css              # design system Tailwind (couleurs, boutons, cards)
│   ├── state/
│   │   └── AppContext.jsx     # état global : photo, ingrédients, préférences, recettes, historique
│   ├── data/
│   │   ├── mockVision.js      # appelle /api/analyze-fridge (nom du fichier conservé, plus rien de "mock")
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

## Comportement IA

`src/data/mockVision.js` envoie la photo (base64) à `/api/analyze-fridge`, qui appelle l'API Google Gemini avec un prompt demandant la liste des aliments visibles au format JSON, avec un score de confiance et des alternatives possibles pour les ingrédients ambigus (ex : "lait ou crème fraîche"). La clé API reste côté serveur, jamais exposée au navigateur.

`src/logic/recipeEngine.js` calcule ensuite un score de correspondance par recette : il favorise les recettes qui utilisent le plus d'ingrédients disponibles, ignore les basiques de placard (sel, poivre, huile...) dans le calcul des ingrédients manquants, ajoute un bonus pour les recettes anti-gaspi, et **garantit toujours au moins une suggestion** même si aucune recette ne correspond parfaitement.

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
- ✅ Analyse IA réelle (Google Gemini, gratuit), jamais bloquante, propose des alternatives en cas d'incertitude
- ✅ Liste modifiable (cases à cocher, ajout, suppression, renommage via alternatives)
- ✅ 3 à 5 recettes avec nom, temps, niveau, ingrédients utilisés, étapes numérotées
- ✅ Personnalisation : temps max, type de cuisine, régime végétarien
- ✅ Design moderne, mobile-first, fond clair + accents vert/orange, cartes pour les recettes
- ✅ Bonus : mode anti-gaspi, bouton surprise, historique des recettes générées
- ✅ Immédiatement exécutable (`npm install && npm run dev`) ; une clé API Gemini gratuite est nécessaire sur Vercel pour activer la reconnaissance d'image
