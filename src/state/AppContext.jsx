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
import {
  getHistory,
  saveHistoryEntry,
  clearHistory,
  getFavorites,
  saveFavorites,
  getFavoriteKey,
  getPreferences,
  savePreferences,
  DEFAULT_PREFERENCES,
} from '../utils/storage.js'

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

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { user, authLoading } = useAuth()
  const uid = user?.uid || null

  // Recharge historique/favoris/préférences dès que le compte connecté change
  // (connexion, déconnexion, ou changement de compte sur le même appareil)
  // pour ne jamais mélanger les données de deux comptes.
  useEffect(() => {
    if (authLoading) return
    dispatch({
      type: 'LOAD_USER_DATA',
      history: getHistory(uid),
      favorites: getFavorites(uid),
      preferences: getPreferences(uid),
    })
  }, [uid, authLoading])

  const goTo = useCallback((view) => {
    if (typeof window !== 'undefined' && window.location.hash && window.history?.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    dispatch({ type: 'GO_TO', view })
  }, [])

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
    dispatch({ type: 'REQUIRE_LOGIN', from })
  }, [])

  const setPhoto = useCallback((photoDataUrl) => dispatch({ type: 'SET_PHOTO', photo: photoDataUrl }), [])

  const analyzePhoto = useCallback(async (photoDataUrl, mode = 'frigo') => {
    dispatch({ type: 'START_ANALYSIS' })
    try {
      const result = await analyzeImage(photoDataUrl, mode)
      dispatch({ type: 'ANALYSIS_DONE', items: result.items })
    } catch (e) {
      console.warn('FrigoMind: analyse impossible, liste vide proposée', e)
      dispatch({ type: 'ANALYSIS_DONE', items: [] })
    }
  }, [])

  const toggleIngredient = useCallback((id) => dispatch({ type: 'TOGGLE_INGREDIENT', id }), [])
  const renameIngredient = useCallback((id, name) => dispatch({ type: 'RENAME_INGREDIENT', id, name }), [])
  const removeIngredient = useCallback((id) => dispatch({ type: 'REMOVE_INGREDIENT', id }), [])
  const addIngredient = useCallback((name) => dispatch({ type: 'ADD_INGREDIENT', name }), [])
  // Persiste les préférences à chaque changement : elles servent de valeurs
  // par défaut pour la prochaine session (voir initialState / page paramètres).
  const setPreferences = useCallback(
    (prefs) => {
      savePreferences(uid, { ...state.preferences, ...prefs })
      dispatch({ type: 'SET_PREFERENCES', prefs })
    },
    [state.preferences, uid]
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
      recipes: recipes.map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, time: r.time })),
    }
    const updated = saveHistoryEntry(uid, entry)
    dispatch({ type: 'PUSH_HISTORY', history: updated })
  }, [uid])

  // generateRecipes/surpriseRecipe (et donc la base de 750 recettes qu'ils
  // importent) sont chargés à la demande plutôt qu'au démarrage : AppContext
  // enveloppe toute l'application dès main.jsx, donc un import statique ici
  // aurait forcé toute la recipesDB dans le bundle initial même pour un
  // visiteur qui ne va jamais jusqu'à la génération de recettes.
  const generateFromValidated = useCallback(async () => {
    const validatedNames = getValidatedNames(state.ingredients)
    const { generateRecipes } = await import('../logic/recipeEngine.js')
    const recipes = generateRecipes(validatedNames, state.preferences)
    dispatch({ type: 'SET_RECIPES', recipes, isSurprise: false })
    commitToHistory(validatedNames, recipes)
  }, [state.ingredients, state.preferences, getValidatedNames, commitToHistory])

  const surpriseMe = useCallback(async () => {
    const validatedNames = getValidatedNames(state.ingredients)
    const { surpriseRecipe } = await import('../logic/recipeEngine.js')
    const recipe = surpriseRecipe(validatedNames)
    const recipes = recipe ? [recipe] : []
    dispatch({ type: 'SET_RECIPES', recipes, isSurprise: true })
    if (recipe) commitToHistory(validatedNames, recipes)
  }, [state.ingredients, getValidatedNames, commitToHistory])

  const setActiveRecipe = useCallback((id) => dispatch({ type: 'SET_ACTIVE_RECIPE', id }), [])

  const resetSession = useCallback(() => dispatch({ type: 'RESET_SESSION' }), [])

  const wipeHistory = useCallback(() => {
    clearHistory(uid)
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [uid])

  const toggleFavorite = useCallback(
    (recipe) => {
      const key = getFavoriteKey(recipe)
      const exists = state.favorites.find((r) => getFavoriteKey(r) === key)
      const updated = exists
        ? state.favorites.filter((r) => r.favId !== exists.favId)
        : [{ ...recipe, favId: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...state.favorites]
      dispatch({ type: 'SET_FAVORITES', favorites: saveFavorites(uid, updated) })
    },
    [state.favorites, uid]
  )

  const clearFavorites = useCallback(() => {
    dispatch({ type: 'SET_FAVORITES', favorites: saveFavorites(uid, []) })
  }, [uid])

  // Met à jour la note personnelle et/ou la note en étoiles d'un favori
  // (voir RecipeModal). `meta` ne contient que les champs à modifier (mise à
  // jour partielle) : on peut ainsi changer la note en étoiles sans écraser
  // le texte de la note personnelle, et inversement.
  const updateFavoriteMeta = useCallback(
    (favId, meta) => {
      const updated = state.favorites.map((r) => (r.favId === favId ? { ...r, ...meta } : r))
      dispatch({ type: 'SET_FAVORITES', favorites: saveFavorites(uid, updated) })
    },
    [state.favorites, uid]
  )

  const goToIngredient = useCallback((name) => dispatch({ type: 'SET_ACTIVE_INGREDIENT', name: name || '' }), [])

  const value = useMemo(
    () => ({
      state,
      goTo,
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
    }),
    [
      state,
      goTo,
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
    ]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useApp doit être utilisé à l\'intérieur de <AppProvider>')
  return ctx
}
