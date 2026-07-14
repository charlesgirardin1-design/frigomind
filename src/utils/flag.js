// -----------------------------------------------------------------------------
// flag.js
// Les recettes "cuisine du monde" ont leur drapeau pays intégré directement
// dans le texte du nom (ex: "Khao soi au poulet (Thaïlande du Nord) 🇹🇭"),
// ce qui le noie en fin de titre, potentiellement coupé si le titre passe à
// la ligne. extractCountryFlag() le repère (paire d'indicateurs régionaux
// Unicode) et le sépare du reste du nom, pour qu'il puisse être affiché
// comme badge dédié (voir RecipeCard / RecipeModal) plutôt qu'en texte brut.
// -----------------------------------------------------------------------------

const FLAG_REGEX = /\p{Regional_Indicator}{2}/u

export function extractCountryFlag(name) {
  if (!name) return { flag: null, cleanName: name }
  const match = name.match(FLAG_REGEX)
  if (!match) return { flag: null, cleanName: name }
  return { flag: match[0], cleanName: name.replace(match[0], '').trim() }
}
