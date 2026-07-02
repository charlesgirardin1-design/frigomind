// Bonus "recette presque prête" : à partir des ingrédients cochés, propose
// des ingrédients complémentaires probables (ex : pâtes + jambon → petits
// pois, carotte...). L'utilisateur coche ce qu'il a réellement : l'ingrédient
// rejoint alors la liste principale ci-dessus et entre dans le calcul des
// recettes.
export default function IngredientSuggestions({ suggestions, onSelect }) {
  if (suggestions.length === 0) return null

  return (
    <div className="mt-4 card p-4">
      <p className="text-sm font-medium text-neutral-700">
        🧠 Avez-vous aussi l'un de ces ingrédients ? Cochez ce que vous avez pour affiner vos recettes.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((name) => (
          <label
            key={name}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-600 cursor-pointer transition hover:border-fresh-300 hover:bg-fresh-50 hover:text-fresh-700"
          >
            <input type="checkbox" checked={false} onChange={() => onSelect(name)} className="checkbox-fresh" />
            <span className="capitalize">{name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
