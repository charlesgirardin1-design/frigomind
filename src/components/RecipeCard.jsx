const LEVEL_STYLES = {
  facile: 'badge-fresh',
  moyen: 'badge-neutral',
}

// Carte compacte pour une recette, cliquable pour voir le détail complet.
export default function RecipeCard({ recipe, onOpen }) {
  return (
    <button
      onClick={() => onOpen(recipe.id)}
      className="card p-4 text-left w-full hover:shadow-cardHover hover:-translate-y-0.5 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl" aria-hidden>
          {recipe.emoji}
        </span>
        {recipe.antiGaspi && <span className="badge badge-zest whitespace-nowrap">♻️ anti-gaspi</span>}
      </div>

      <h3 className="mt-2 font-semibold text-neutral-900 leading-snug">{recipe.name}</h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="badge badge-neutral">⏱ {recipe.time} min</span>
        <span className={`badge ${LEVEL_STYLES[recipe.level] || 'badge-neutral'}`}>{recipe.level}</span>
        <span className="badge badge-neutral capitalize">{recipe.cuisine}</span>
      </div>

      {recipe.missingIngredients?.length > 0 && (
        <p className="mt-2 text-xs text-neutral-400">
          À prévoir en plus : {recipe.missingIngredients.join(', ')}
        </p>
      )}

      <p className="mt-3 text-xs font-medium text-fresh-600">Voir la recette →</p>
    </button>
  )
}
