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
import { getHistory, saveHistoryEntry, clearHistory } from '../utils/storage.js'

const AppStateContext = createContext(null)

const initialState = {
  view: 'home', // 'home' | 'upload' | 'validate' | 'results' | 'history'
  photo: null,
  isAnalyzing: false,
  ingredients: [], // [{id, name, confidence, alternatives, checked}]
  preferences: { maxTime: 'peu importe', cuisine: 'toutes', vegetarien: false },
  recipes: [],
  activeRecipeId: null,
  history: getHistory(),
  isSurprise: false,
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
    case 'RESET_SESSION':
      return { ...initialState, history: state.history }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const goTo = useCallback((view) => dispatch({ type: 'GO_TO', view }), [])

  const setPhoto = useCallback((photoDataUrl) => dispatch({ type: 'SET_PHOTO', photo: photoDataUrl }), [])

  const analyzePhoto = useCallback(async (photoDataUrl) => {
    dispatch({ type: 'START_ANALYSIS' })
    try {
      const result = await analyzeImage(photoDataUrl)
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
    ]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useApp doit être utilisé à l\'intérieur de <AppProvider>')
  return ctx
}
