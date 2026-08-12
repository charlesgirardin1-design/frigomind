// -----------------------------------------------------------------------------
// ingredientPlurals.js
// Formes singulier/pluriel des ingrédients comptés "à la pièce" (voir
// ingredientQuantities.js, unit: "pièce(s)") — pour afficher "6 ananas" ou
// "2 oignons" plutôt que l'étiquette générique "6 pièce(s) d'ananas"/"2
// pièce(s) d'oignon", qui n'est ni naturelle ni élégante. Uniquement les
// ~60 ingrédients réellement comptés à la pièce : les ingrédients pesés/
// mesurés (g, ml, c. à café...) n'ont pas besoin d'accorder leur nom au
// nombre, leur quantité se lit "500 g de bœuf" quel que soit le nombre de
// personnes.
// -----------------------------------------------------------------------------

export const PIECE_INGREDIENT_PLURALS = {
  ananas: { frSingular: 'ananas', frPlural: 'ananas', enSingular: 'pineapple', enPlural: 'pineapples' },
  asperges: { frSingular: 'asperge', frPlural: 'asperges', enSingular: 'asparagus spear', enPlural: 'asparagus spears' },
  aubergine: { frSingular: 'aubergine', frPlural: 'aubergines', enSingular: 'eggplant', enPlural: 'eggplants' },
  avocat: { frSingular: 'avocat', frPlural: 'avocats', enSingular: 'avocado', enPlural: 'avocados' },
  bagel: { frSingular: 'bagel', frPlural: 'bagels', enSingular: 'bagel', enPlural: 'bagels' },
  banane: { frSingular: 'banane', frPlural: 'bananes', enSingular: 'banana', enPlural: 'bananas' },
  'biscuits à la cuillère': {
    frSingular: 'biscuit à la cuillère',
    frPlural: 'biscuits à la cuillère',
    enSingular: 'ladyfinger',
    enPlural: 'ladyfingers',
  },
  blinis: { frSingular: 'blini', frPlural: 'blinis', enSingular: 'blini', enPlural: 'blinis' },
  brocoli: { frSingular: 'brocoli', frPlural: 'brocolis', enSingular: 'broccoli', enPlural: 'broccoli' },
  burrata: { frSingular: 'burrata', frPlural: 'burratas', enSingular: 'burrata', enPlural: 'burratas' },
  carotte: { frSingular: 'carotte', frPlural: 'carottes', enSingular: 'carrot', enPlural: 'carrots' },
  'champignons portobello': {
    frSingular: 'champignon portobello',
    frPlural: 'champignons portobello',
    enSingular: 'portobello mushroom',
    enPlural: 'portobello mushrooms',
  },
  chou: { frSingular: 'chou', frPlural: 'choux', enSingular: 'cabbage', enPlural: 'cabbages' },
  'chou rouge': { frSingular: 'chou rouge', frPlural: 'choux rouges', enSingular: 'red cabbage', enPlural: 'red cabbages' },
  'chou-fleur': { frSingular: 'chou-fleur', frPlural: 'choux-fleurs', enSingular: 'cauliflower', enPlural: 'cauliflowers' },
  citron: { frSingular: 'citron', frPlural: 'citrons', enSingular: 'lemon', enPlural: 'lemons' },
  'citron vert': { frSingular: 'citron vert', frPlural: 'citrons verts', enSingular: 'lime', enPlural: 'limes' },
  concombre: { frSingular: 'concombre', frPlural: 'concombres', enSingular: 'cucumber', enPlural: 'cucumbers' },
  'confit de canard': {
    frSingular: 'confit de canard',
    frPlural: 'confits de canard',
    enSingular: 'duck confit',
    enPlural: 'duck confits',
  },
  courgette: { frSingular: 'courgette', frPlural: 'courgettes', enSingular: 'zucchini', enPlural: 'zucchinis' },
  céleri: { frSingular: 'céleri', frPlural: 'céleris', enSingular: 'celery stalk', enPlural: 'celery stalks' },
  endives: { frSingular: 'endive', frPlural: 'endives', enSingular: 'endive', enPlural: 'endives' },
  falafel: { frSingular: 'falafel', frPlural: 'falafels', enSingular: 'falafel', enPlural: 'falafels' },
  fenouil: { frSingular: 'fenouil', frPlural: 'fenouils', enSingular: 'fennel bulb', enPlural: 'fennel bulbs' },
  figues: { frSingular: 'figue', frPlural: 'figues', enSingular: 'fig', enPlural: 'figs' },
  'galette de riz': { frSingular: 'galette de riz', frPlural: 'galettes de riz', enSingular: 'rice cake', enPlural: 'rice cakes' },
  'gâteaux de riz': { frSingular: 'gâteau de riz', frPlural: 'gâteaux de riz', enSingular: 'rice cake', enPlural: 'rice cakes' },
  kiwi: { frSingular: 'kiwi', frPlural: 'kiwis', enSingular: 'kiwi', enPlural: 'kiwis' },
  mangue: { frSingular: 'mangue', frPlural: 'mangues', enSingular: 'mango', enPlural: 'mangoes' },
  melon: { frSingular: 'melon', frPlural: 'melons', enSingular: 'melon', enPlural: 'melons' },
  'muffin anglais': { frSingular: 'muffin anglais', frPlural: 'muffins anglais', enSingular: 'English muffin', enPlural: 'English muffins' },
  'noix de saint-jacques': {
    frSingular: 'noix de saint-jacques',
    frPlural: 'noix de saint-jacques',
    enSingular: 'scallop',
    enPlural: 'scallops',
  },
  oignon: { frSingular: 'oignon', frPlural: 'oignons', enSingular: 'onion', enPlural: 'onions' },
  'oignon nouveau': { frSingular: 'oignon nouveau', frPlural: 'oignons nouveaux', enSingular: 'spring onion', enPlural: 'spring onions' },
  'oignon rouge': { frSingular: 'oignon rouge', frPlural: 'oignons rouges', enSingular: 'red onion', enPlural: 'red onions' },
  orange: { frSingular: 'orange', frPlural: 'oranges', enSingular: 'orange', enPlural: 'oranges' },
  pain: { frSingular: 'pain', frPlural: 'pains', enSingular: 'bread', enPlural: 'bread' },
  'pain burger': { frSingular: 'pain burger', frPlural: 'pains burger', enSingular: 'burger bun', enPlural: 'burger buns' },
  'pain pita': { frSingular: 'pain pita', frPlural: 'pains pita', enSingular: 'pita bread', enPlural: 'pita breads' },
  pamplemousse: { frSingular: 'pamplemousse', frPlural: 'pamplemousses', enSingular: 'grapefruit', enPlural: 'grapefruits' },
  'papaye verte': { frSingular: 'papaye verte', frPlural: 'papayes vertes', enSingular: 'green papaya', enPlural: 'green papayas' },
  'petits pains vapeur': {
    frSingular: 'petit pain vapeur',
    frPlural: 'petits pains vapeur',
    enSingular: 'steamed bun',
    enPlural: 'steamed buns',
  },
  piment: { frSingular: 'piment', frPlural: 'piments', enSingular: 'chili pepper', enPlural: 'chili peppers' },
  'piment chipotle': { frSingular: 'piment chipotle', frPlural: 'piments chipotle', enSingular: 'chipotle pepper', enPlural: 'chipotle peppers' },
  poire: { frSingular: 'poire', frPlural: 'poires', enSingular: 'pear', enPlural: 'pears' },
  poireau: { frSingular: 'poireau', frPlural: 'poireaux', enSingular: 'leek', enPlural: 'leeks' },
  poivron: { frSingular: 'poivron', frPlural: 'poivrons', enSingular: 'bell pepper', enPlural: 'bell peppers' },
  pomme: { frSingular: 'pomme', frPlural: 'pommes', enSingular: 'apple', enPlural: 'apples' },
  'pâte brisée': { frSingular: 'pâte brisée', frPlural: 'pâtes brisées', enSingular: 'shortcrust pastry', enPlural: 'shortcrust pastries' },
  'pâte feuilletée': { frSingular: 'pâte feuilletée', frPlural: 'pâtes feuilletées', enSingular: 'puff pastry', enPlural: 'puff pastries' },
  'pâte sablée': { frSingular: 'pâte sablée', frPlural: 'pâtes sablées', enSingular: 'sweet shortcrust pastry', enPlural: 'sweet shortcrust pastries' },
  'pâte à pizza': { frSingular: 'pâte à pizza', frPlural: 'pâtes à pizza', enSingular: 'pizza dough', enPlural: 'pizza doughs' },
  'pâte à raviolis': { frSingular: 'pâte à raviolis', frPlural: 'pâtes à raviolis', enSingular: 'ravioli wrapper', enPlural: 'ravioli wrappers' },
  pêche: { frSingular: 'pêche', frPlural: 'pêches', enSingular: 'peach', enPlural: 'peaches' },
  quenelles: { frSingular: 'quenelle', frPlural: 'quenelles', enSingular: 'quenelle', enPlural: 'quenelles' },
  radicchio: { frSingular: 'radicchio', frPlural: 'radicchios', enSingular: 'radicchio', enPlural: 'radicchios' },
  radis: { frSingular: 'radis', frPlural: 'radis', enSingular: 'radish', enPlural: 'radishes' },
  salade: { frSingular: 'salade', frPlural: 'salades', enSingular: 'lettuce', enPlural: 'lettuces' },
  tomate: { frSingular: 'tomate', frPlural: 'tomates', enSingular: 'tomato', enPlural: 'tomatoes' },
  tomates: { frSingular: 'tomate', frPlural: 'tomates', enSingular: 'tomato', enPlural: 'tomatoes' },
  tortilla: { frSingular: 'tortilla', frPlural: 'tortillas', enSingular: 'tortilla', enPlural: 'tortillas' },
  yaourt: { frSingular: 'yaourt', frPlural: 'yaourts', enSingular: 'yogurt', enPlural: 'yogurts' },
  'yaourt grec': { frSingular: 'yaourt grec', frPlural: 'yaourts grecs', enSingular: 'Greek yogurt', enPlural: 'Greek yogurts' },
  échalote: { frSingular: 'échalote', frPlural: 'échalotes', enSingular: 'shallot', enPlural: 'shallots' },
  œufs: { frSingular: 'œuf', frPlural: 'œufs', enSingular: 'egg', enPlural: 'eggs' },
  'œufs durs': { frSingular: 'œuf dur', frPlural: 'œufs durs', enSingular: 'hard-boiled egg', enPlural: 'hard-boiled eggs' },
  oeufs: { frSingular: 'oeuf', frPlural: 'oeufs', enSingular: 'egg', enPlural: 'eggs' },
}

// Renvoie le nom d'affichage correctement accordé (singulier si count===1,
// pluriel sinon) pour un ingrédient compté à la pièce. Retombe sur `null` si
// l'ingrédient n'est pas dans cette table (ingrédients pesés/mesurés, dont le
// nom ne s'accorde jamais au nombre — "500 g de bœuf" reste "bœuf").
export function getPluralForm(name, count, lang = 'fr') {
  const forms = PIECE_INGREDIENT_PLURALS[name]
  if (!forms) return null
  // <= 1 (pas seulement === 1) : "0,5 citron" ("half a lemon") se lit mieux
  // au singulier que "0,5 citrons", même si la règle grammaticale stricte
  // du pluriel démarre techniquement dès qu'on s'écarte de 1.
  const isSingular = count <= 1
  if (lang === 'en') return isSingular ? forms.enSingular : forms.enPlural
  return isSingular ? forms.frSingular : forms.frPlural
}
