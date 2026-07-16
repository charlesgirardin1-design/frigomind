// -----------------------------------------------------------------------------
// AppContext.jsx
// État global de l'application FrigoMind : photo, ingrédients détectés,
// préférences, recettes générées, historique, et navigation entre "pages".
// On utilise Context + useReducer plutôt qu'une librairie externe pour rester
// sans dépendance compliquée (contrainte du projet).
// -----------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { analyzeImage } from '../data/mockVision.js'
import { useAuth } from './AuthContext.jsx'
import { useLanguage } from './LanguageContext.jsx'
import {
  getHistory,
  saveHistoryEntry,
  saveHistoryEntries,
  clearHistory,
  getFavorites,
  saveFavorites,
  getFavoriteKey,
  getPreferences,
  savePreferences,
  DEFAULT_PREFERENCES,
} from '../utils/storage.js'
import { maybeShowReminder } from '../utils/reminders.js'
import { pathForView, viewFromPath } from '../routes.js'

const AppStateContext = createContext(null)

// L'historique, les favoris et les préférences sont propres au compte
// connecté (voir storage.js) : on ne peut donc pas les lire au chargement
// du module (l'utilisateur Firebase n'est pas encore connu à cet instant). On
// démarre à vide et on les charge dès que le compte est connu (voir l'effet
// LOAD_USER_DATA ci-dessous), pour ne jamais afficher les données d'un autre
// compte utilisé précédemment sur cet appareil.
const initialState = {
  view: 'home', // 'home' | 'upload' | 'validate' | 'results' | 'history' | 'favorites' | 'ingredient'
  photo: null,
  isAnalyzing: false,
  ingredients: [], // [{id, name, confidence, alternatives, checked}]
  preferences: DEFAULT_PREFERENCES,
  recipes: [],
  activeRecipeId: null,
  history: [],
  isSurprise: false,
  favorites: [],
  activeIngredient: '',
  redirectTo: null,
  viewingRecipe: null,
  recipeReturnView: 'home',
}

function reducer(state, action) {
  switch (action.type) {
    case 'GO_TO':
      return { ...state, view: action.view, redirectTo: null }
    case 'REQUIRE_LOGIN':
      return { ...state, view: 'login', redirectTo: action.from }
    case 'SET_PHOTO':
      return { ...state, photo: action.photo, ingredients: [], recipes: [] }
    case 'START_ANALYSIS':
      return { ...state, isAnalyzing: true }
    case 'ANALYSIS_DONE':
      return { ...state, isAnalyzing: false, ingredients: action.items, view: 'validate' }
    case 'TOGGLE_INGREDIENT':
      return {
        ...state,
        ingredients: state.ingredients.map((ing) =>
          ing.id === action.id ? { ...ing, checked: !ing.checked } : ing
        ),
      }
    case 'RENAME_INGREDIENT':
      return {
        ...state,
        ingredients: state.ingredients.map((ing) =>
          ing.id === action.id ? { ...ing, name: action.name, alternatives: [] } : ing
        ),
      }
    case 'REMOVE_INGREDIENT':
      return { ...state, ingredients: state.ingredients.filter((ing) => ing.id !== action.id) }
    case 'ADD_INGREDIENT': {
      if (!action.name.trim()) return state
      const newIng = {
        id: `manual-${Date.now()}`,
        name: action.name.trim(),
        confidence: 1,
        alternatives: [],
        checked: true,
      }
      return { ...state, ingredients: [...state.ingredients, newIng] }
    }
    case 'SET_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.prefs } }
    case 'SET_RECIPES':
      return { ...state, recipes: action.recipes, view: 'results', isSurprise: !!action.isSurprise }
    case 'SET_ACTIVE_RECIPE':
      return { ...state, activeRecipeId: action.id }
    case 'OPEN_RECIPE':
      return { ...state, viewingRecipe: action.recipe, recipeReturnView: state.view, view: 'recipe' }
    case 'CLOSE_RECIPE':
      return { ...state, viewingRecipe: null, view: state.recipeReturnView }
    case 'PUSH_HISTORY':
      return { ...state, history: action.history }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] }
    case 'SET_FAVORITES':
      return { ...state, favorites: action.favorites }
    case 'SET_ACTIVE_INGREDIENT':
      return { ...state, activeIngredient: action.name, view: 'ingredient' }
    case 'RESET_SESSION':
      return {
        ...initialState,
        history: state.history,
        favorites: state.favorites,
        preferences: state.preferences,
      }
    case 'LOAD_USER_DATA':
      return {
        ...state,
        history: action.history,
        favorites: action.favorites,
        preferences: action.preferences,
      }
    default:
      return state
  }
}

// Met à jour l'URL affichée dans la barre d'adresse pour qu'elle corresponde
// à la vue donnée, dans la langue donnée (voir routes.js — chaque vue a un
// chemin FR et un chemin EN), sans dispatcher de changement d'état. Utilisé
// par goTo mais aussi par toutes les autres actions qui changent state.view
// via le reducer (connexion requise, génération de recettes, ouverture d'une
// recette, fin de session...) pour que l'URL ne diverge jamais de la vue
// réellement affichée.
function syncUrlToView(view, lang, { replace = false } = {}) {
  if (typeof window === 'undefined' || !window.history?.pushState) return
  const path = pathForView(view, lang)
  const current = window.location.pathname + window.location.hash
  if (current !== path) {
    if (replace) {
      window.history.replaceState(null, '', path)
    } else {
      window.history.pushState(null, '', path)
    }
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { user, authLoading } = useAuth()
  const uid = user?.uid || null
  const lang = useLanguage()

  // Recharge historique/favoris/préférences dès que le compte connecté change
  // (connexion, déconnexion, ou changement de compte sur le même appareil)
  // pour ne jamais mélanger les données de deux comptes.
  useEffect(() => {
    if (authLoading) return
    const localHistory = getHistory(uid)
    const localFavorites = getFavorites(uid)
    const localPreferences = getPreferences(uid)

    // Affichage instantané avec la copie locale d'abord (voir storage.js) :
    // pas d'attente réseau pour montrer l'historique/favoris déjà connus.
    dispatch({
      type: 'LOAD_USER_DATA',
      history: localHistory,
      favorites: localFavorites,
      preferences: localPreferences,
    })
    // Rappel local anti-gaspi (voir reminders.js) : ne fait rien si
    // l'utilisateur ne l'a pas activé dans les paramètres.
    maybeShowReminder(uid, localHistory, lang)

    if (!uid) return
    let cancelled = false
    // Fusionne ensuite avec la copie cloud (voir cloudSync.js) en arrière-
    // plan : ne bloque jamais l'affichage initial, et si Firestore n'est pas
    // configuré/accessible, échoue silencieusement (fetchCloudData renvoie
    // null) — l'app continue avec les seules données locales comme avant.
    // Import dynamique : `firebase/firestore` est une grosse dépendance,
    // inutile de la charger pour un visiteur non connecté (voir aussi
    // pushToCloud plus bas, même raison).
    import('../utils/cloudSync.js').then(({ fetchCloudData, pushCloudData, mergeHistory, mergeFavorites }) => {
      fetchCloudData(uid).then((cloud) => {
        if (cancelled) return
        const mergedHistory = mergeHistory(localHistory, cloud?.history)
        const mergedFavorites = mergeFavorites(localFavorites, cloud?.favorites)
        const mergedPreferences = cloud?.preferences || localPreferences

        const savedHistory = saveHistoryEntries(uid, mergedHistory)
        const savedFavorites = saveFavorites(uid, mergedFavorites)
        savePreferences(uid, mergedPreferences)

        dispatch({
          type: 'LOAD_USER_DATA',
          history: savedHistory,
          favorites: savedFavorites,
          preferences: mergedPreferences,
        })

        pushCloudData(uid, { history: savedHistory, favorites: savedFavorites, preferences: mergedPreferences })
      })
    })

    return () => {
      cancelled = true
    }
  }, [uid, authLoading, lang])

  // Pousse une mise à jour partielle vers Firestore (voir cloudSync.js),
  // import dynamique pour ne jamais alourdir le bundle initial avec
  // `firebase/firestore` — voir le commentaire équivalent ci-dessus.
  const pushToCloud = useCallback(
    (data) => {
      if (!uid) return
      import('../utils/cloudSync.js').then(({ pushCloudData }) => pushCloudData(uid, data))
    },
    [uid]
  )

  // Change de vue ET met à jour l'URL (voir routes.js) : chaque page a ainsi
  // sa propre adresse partageable/ajoutable en favori, sans dépendance de
  // routing externe — juste l'API History native.
  const goTo = useCallback((view) => {
    syncUrlToView(view, lang)
    dispatch({ type: 'GO_TO', view })
  }, [lang])

  // Change la vue sans toucher à l'historique du navigateur : utilisé quand
  // l'URL a déjà la bonne valeur (chargement initial d'un lien direct, ou
  // clic sur précédent/suivant — voir l'effet popstate ci-dessous), pour ne
  // pas empiler une entrée d'historique redondante.
  const setViewSilently = useCallback((view) => dispatch({ type: 'GO_TO', view }), [])

  // Boutons précédent/suivant du navigateur : resynchronise la vue affichée
  // avec l'URL réellement affichée dans la barre d'adresse.
  useEffect(() => {
    function handlePopState() {
      dispatch({ type: 'GO_TO', view: viewFromPath(window.location.pathname) })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Garde l'adresse affichée dans la langue courante : se déclenche quand la
  // vue ou la langue change, y compris au montage (ex: lien FR ouvert alors
  // que l'interface est en EN, ou changement de langue via le sélecteur dans
  // le header). On remplace l'entrée d'historique (replaceState) plutôt que
  // d'en empiler une nouvelle, puisque c'est toujours la même page, juste
  // traduite.
  useEffect(() => {
    syncUrlToView(state.view, lang, { replace: true })
  }, [state.view, lang])

    // On mémorise aussi la page visée dans sessionStorage : si la connexion
    // Google/Apple bascule sur une redirection complète (popup bloquée par le
  // navigateur), l'état React est réinitialisé au rechargement de la page,
  // mais sessionStorage survit et permet de renvoyer l'utilisateur au bon
  // endroit une fois connecté (voir l'effet dans App.jsx).
  const requireLogin = useCallback((from) => {
    try {
      sessionStorage.setItem('frigomind:pendingRedirect', from)
    } catch {
      // Stockage indisponible (navigation privée stricte, etc.) : tant pis,
      // l'utilisateur retombera simplement sur l'accueil après connexion.
    }
    syncUrlToView('login', lang)
    dispatch({ type: 'REQUIRE_LOGIN', from })
  }, [lang])

  const setPhoto = useCallback((photoDataUrl) => dispatch({ type: 'SET_PHOTO', photo: photoDataUrl }), [])

  const analyzePhoto = useCallback(async (photoDataUrl, mode = 'frigo') => {
    dispatch({ type: 'START_ANALYSIS' })
    try {
      const result = await analyzeImage(photoDataUrl, mode)
      syncUrlToView('validate', lang)
      dispatch({ type: 'ANALYSIS_DONE', items: result.items })
    } catch (e) {
      console.warn('FrigoMind: analyse impossible, liste vide proposée', e)
      syncUrlToView('validate', lang)
      dispatch({ type: 'ANALYSIS_DONE', items: [] })
    }
  }, [lang])

  const toggleIngredient = useCallback((id) => dispatch({ type: 'TOGGLE_INGREDIENT', id }), [])
  const renameIngredient = useCallback((id, name) => dispatch({ type: 'RENAME_INGREDIENT', id, name }), [])
  const removeIngredient = useCallback((id) => dispatch({ type: 'REMOVE_INGREDIENT', id }), [])
  const addIngredient = useCallback((name) => dispatch({ type: 'ADD_INGREDIENT', name }), [])
  // Persiste les préférences à chaque changement : elles servent de valeurs
  // par défaut pour la prochaine session (voir initialState / page paramètres).
  const setPreferences = useCallback(
    (prefs) => {
      const updated = savePreferences(uid, { ...state.preferences, ...prefs })
      dispatch({ type: 'SET_PREFERENCES', prefs })
      pushToCloud({ preferences: updated })
    },
    [state.preferences, uid, pushToCloud]
  )

  const getValidatedNames = useCallback(
    (ingredients) => ingredients.filter((i) => i.checked).map((i) => i.name),
    []
  )

  const commitToHistory = useCallback((validatedNames, recipes) => {
    const entry = {
      id: `hist-${Date.now()}`,
      date: new Date().toISOString(),
      ingredients: validatedNames,
      recipes: recipes.map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, time: r.time, antiGaspi: !!r.antiGaspi })),
    }
    const updated = saveHistoryEntry(uid, entry)
    dispatch({ type: 'PUSH_HISTORY', history: updated })
    pushToCloud({ history: updated })
  }, [uid, pushToCloud])

  // generateRecipes/surpriseRecipe (et donc la base de 750 recettes qu'ils
  // importent) sont chargés à la demande plutôt qu'au démarrage : AppContext
  // enveloppe toute l'application dès main.jsx, donc un import statique ici
  // aurait forcé toute la recipesDB dans le bundle initial même pour un
  // visiteur qui ne va jamais jusqu'à la génération de recettes.
  const generateFromValidated = useCallback(async () => {
    const validatedNames = getValidatedNames(state.ingredients)
    const { generateRecipes } = await import('../logic/recipeEngine.js')
    const recipes = generateRecipes(validatedNames, state.preferences)
    syncUrlToView('results', lang)
    dispatch({ type: 'SET_RECIPES', recipes, isSurprise: false })
    commitToHistory(validatedNames, recipes)
  }, [state.ingredients, state.preferences, getValidatedNames, commitToHistory, lang])

  const surpriseMe = useCallback(async () => {
    const validatedNames = getValidatedNames(state.ingredients)
    const { surpriseRecipe } = await import('../logic/recipeEngine.js')
    const recipe = surpriseRecipe(validatedNames, state.preferences)
    const recipes = recipe ? [recipe] : []
    syncUrlToView('results', lang)
    dispatch({ type: 'SET_RECIPES', recipes, isSurprise: true })
    if (recipe) commitToHistory(validatedNames, recipes)
  }, [state.ingredients, state.preferences, getValidatedNames, commitToHistory, lang])

  const setActiveRecipe = useCallback((id) => dispatch({ type: 'SET_ACTIVE_RECIPE', id }), [])

  const resetSession = useCallback(() => {
    syncUrlToView('home', lang)
    dispatch({ type: 'RESET_SESSION' })
  }, [lang])

  const wipeHistory = useCallback(() => {
    clearHistory(uid)
    dispatch({ type: 'CLEAR_HISTORY' })
    pushToCloud({ history: [] })
  }, [uid, pushToCloud])

  const toggleFavorite = useCallback(
    (recipe) => {
      const key = getFavoriteKey(recipe)
      const exists = state.favorites.find((r) => getFavoriteKey(r) === key)
      const updated = exists
        ? state.favorites.filter((r) => r.favId !== exists.favId)
        : [{ ...recipe, favId: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...state.favorites]
      const saved = saveFavorites(uid, updated)
      dispatch({ type: 'SET_FAVORITES', favorites: saved })
      pushToCloud({ favorites: saved })
    },
    [state.favorites, uid, pushToCloud]
  )

  const clearFavorites = useCallback(() => {
    const saved = saveFavorites(uid, [])
    dispatch({ type: 'SET_FAVORITES', favorites: saved })
    pushToCloud({ favorites: saved })
  }, [uid, pushToCloud])

  // Met à jour la note personnelle et/ou la note en étoiles d'un favori
  // (voir RecipePage). `meta` ne contient que les champs à modifier (mise à
  // jour partielle) : on peut ainsi changer la note en étoiles sans écraser
  // le texte de la note personnelle, et inversement.
  const updateFavoriteMeta = useCallback(
    (favId, meta) => {
      const updated = state.favorites.map((r) => (r.favId === favId ? { ...r, ...meta } : r))
      const saved = saveFavorites(uid, updated)
      dispatch({ type: 'SET_FAVORITES', favorites: saved })
      pushToCloud({ favorites: saved })
    },
    [state.favorites, uid, pushToCloud]
  )

  const goToIngredient = useCallback((name) => {
    syncUrlToView('ingredient', lang)
    dispatch({ type: 'SET_ACTIVE_INGREDIENT', name: name || '' })
  }, [lang])

  // Ouvre une recette en pleine page (voir RecipePage.jsx) depuis n'importe
  // quelle liste (résultats, favoris, page ingrédient...) : on mémorise la
  // vue d'origine pour que le bouton retour y ramène.
  const openRecipe = useCallback((recipe) => {
    syncUrlToView('recipe', lang)
    dispatch({ type: 'OPEN_RECIPE', recipe })
  }, [lang])
  const closeRecipe = useCallback(() => {
    syncUrlToView(state.recipeReturnView, lang)
    dispatch({ type: 'CLOSE_RECIPE' })
  }, [state.recipeReturnView, lang])

  const value = useMemo(
    () => ({
      state,
      goTo,
      setViewSilently,
      requireLogin,
      setPhoto,
      analyzePhoto,
      toggleIngredient,
      renameIngredient,
      removeIngredient,
      addIngredient,
      setPreferences,
      generateFromValidated,
      surpriseMe,
      setActiveRecipe,
      resetSession,
      wipeHistory,
      toggleFavorite,
      clearFavorites,
      updateFavoriteMeta,
      goToIngredient,
      openRecipe,
      closeRecipe,
    }),
    [
      state,
      goTo,
      setViewSilently,
      requireLogin,
      setPhoto,
      analyzePhoto,
      toggleIngredient,
      renameIngredient,
      removeIngredient,
      addIngredient,
      setPreferences,
      generateFromValidated,
      surpriseMe,
      setActiveRecipe,
      resetSession,
      wipeHistory,
      toggleFavorite,
      clearFavorites,
      updateFavoriteMeta,
      openRecipe,
      closeRecipe,
      goToIngredient,
    ]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useApp doit être utilisé à l\'intérieur de <AppProvider>')
  return ctx
}
