// -----------------------------------------------------------------------------
// AppContext.jsx
// État global de l'application FrigoMind : photo, ingrédients détectés,
// préférences, recettes générées, historique, et navigation entre "pages".
// On utilise Context + useReducer plutôt qu'une librairie externe pour rester
// sans dépendance compliquée (contrainte du projet).
// -----------------------------------------------------------------------------

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react'
import { analyzeImage } from '../data/mockVision.js'
import { generateRecipes, surpriseRecipe } from '../logic/recipeEngine.js'
import {
  getHistory,
  saveHistoryEntry,
  clearHistory,
  getFavorites,
  saveFavorites,
  getFavoriteKey,
  getPlanning,
  savePlanning,
} from '../utils/storage.js'

const AppStateContext = createContext(null)

const initialState = {
  view: 'home', // 'home' | 'upload' | 'validate' | 'results' | 'history' | 'favorites' | 'planning' | 'ingredient'
  photo: null,
  isAnalyzing: false,
  ingredients: [], // [{id, name, confidence, alternatives, checked}]
  preferences: { maxTime: 'peu importe', cuisine: 'toutes', vegetarien: false },
  recipes: [],
  activeRecipeId: null,
  history: getHistory(),
  isSurprise: false,
  favorites: getFavorites(),
  planning: getPlanning(),
  activeIngredient: '',
}

function reducer(state, action) {
  switch (action.type) {
    case 'GO_TO':
      return { ...state, view: action.view }
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
    case 'SET_PLANNING':
      return { ...state, planning: action.planning }
    case 'SET_ACTIVE_INGREDIENT':
      return { ...state, activeIngredient: action.name, view: 'ingredient' }
    case 'RESET_SESSION':
      return { ...initialState, history: state.history, favorites: state.favorites, planning: state.planning }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const goTo = useCallback((view) => dispatch({ type: 'GO_TO', view }), [])

  const setPhoto = useCallback((photoDataUrl) => dispatch({ type: 'SET_PHOTO', photo: photoDataUrl }), [])

  const analyzePhoto = useCallback(async (photoDataUrl, mode = 'frigo') => {
    dispatch({ type: 'START_ANALYSIS' })
    try {
      const result = await analyzeImage(photoDataUrl, mode)
      dispatch({ type: 'ANALYSIS_DONE', items: result.items })
    } catch (e) {
      // Même en cas d'erreur IA, on ne bloque jamais l'utilisateur :
      // on lui propose une liste vide qu'il peut remplir à la main.
      console.warn('FrigoMind: analyse impossible, liste vide proposée', e)
      dispatch({ type: 'ANALYSIS_DONE', items: [] })
    }
  }, [])

  const toggleIngredient = useCallback((id) => dispatch({ type: 'TOGGLE_INGREDIENT', id }), [])
  const renameIngredient = useCallback((id, name) => dispatch({ type: 'RENAME_INGREDIENT', id, name }), [])
  const removeIngredient = useCallback((id) => dispatch({ type: 'REMOVE_INGREDIENT', id }), [])
  const addIngredient = useCallback((name) => dispatch({ type: 'ADD_INGREDIENT', name }), [])
  const setPreferences = useCallback((prefs) => dispatch({ type: 'SET_PREFERENCES', prefs }), [])

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
    const updated = saveHistoryEntry(entry)
    dispatch({ type: 'PUSH_HISTORY', history: updated })
  }, [])

  const generateFromValidated = useCallback(() => {
    const validatedNames = getValidatedNames(state.ingredients)
    const recipes = generateRecipes(validatedNames, state.preferences)
    dispatch({ type: 'SET_RECIPES', recipes, isSurprise: false })
    commitToHistory(validatedNames, recipes)
  }, [state.ingredients, state.preferences, getValidatedNames, commitToHistory])

  const surpriseMe = useCallback(() => {
    const validatedNames = getValidatedNames(state.ingredients)
    const recipe = surpriseRecipe(validatedNames)
    const recipes = recipe ? [recipe] : []
    dispatch({ type: 'SET_RECIPES', recipes, isSurprise: true })
    if (recipe) commitToHistory(validatedNames, recipes)
  }, [state.ingredients, getValidatedNames, commitToHistory])

  const setActiveRecipe = useCallback((id) => dispatch({ type: 'SET_ACTIVE_RECIPE', id }), [])

  const resetSession = useCallback(() => dispatch({ type: 'RESET_SESSION' }), [])

  const wipeHistory = useCallback(() => {
    clearHistory()
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [])

  // Ajoute/retire une recette des favoris. On identifie un favori par
  // id+nom (voir getFavoriteKey) car les recettes générées à la volée
  // réutilisent le même id d'une session à l'autre ; chaque favori reçoit en
  // plus un favId unique, utile pour le glisser-déposer dans le planning.
  const toggleFavorite = useCallback(
    (recipe) => {
      const key = getFavoriteKey(recipe)
      const exists = state.favorites.find((r) => getFavoriteKey(r) === key)
      const updated = exists
        ? state.favorites.filter((r) => r.favId !== exists.favId)
        : [{ ...recipe, favId: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...state.favorites]
      dispatch({ type: 'SET_FAVORITES', favorites: saveFavorites(updated) })
    },
    [state.favorites]
  )

  const assignRecipeToDay = useCallback(
    (day, recipe) => {
      const updated = { ...state.planning, [day]: recipe }
      dispatch({ type: 'SET_PLANNING', planning: savePlanning(updated) })
    },
    [state.planning]
  )

  const clearDay = useCallback(
    (day) => {
      const updated = { ...state.planning, [day]: null }
      dispatch({ type: 'SET_PLANNING', planning: savePlanning(updated) })
    },
    [state.planning]
  )

  const goToIngredient = useCallback((name) => dispatch({ type: 'SET_ACTIVE_INGREDIENT', name: name || '' }), [])

  const value = useMemo(
    () => ({
      state,
      goTo,
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
      assignRecipeToDay,
      clearDay,
      goToIngredient,
    }),
    [
      state,
      goTo,
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
      assignRecipeToDay,
      clearDay,
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
