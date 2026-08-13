// -----------------------------------------------------------------------------
// dishPatterns.js
// Classe chaque ingrédient dans une grande catégorie culinaire (œuf,
// féculent, laitage liquide, fromage, aromate, légume frais, charcuterie,
// champignon, herbe, fruit, protéine, légumineuse en conserve...) et définit
// des archétypes de plats réalistes (omelette, gratin, salade, soupe,
// poêlée), chacun avec la liste des catégories qu'il peut plausiblement
// accueillir. Remplace l'ancien filet de secours qui jetait tous les
// ingrédients validés dans un même moule générique sans réfléchir à leur
// compatibilité (ex: du lait dans une poêlée) — voir buildSmartFallbackRecipes
// dans recipeEngine.js, qui choisit l'archétype le plus adapté à ce que
// l'utilisateur a réellement sous la main.
// -----------------------------------------------------------------------------

const CATEGORY_KEYWORDS = {
  egg: ['œuf', 'oeuf'],
  dairy_liquid: ['lait', 'crème', 'yaourt', 'fromage blanc', 'chantilly'],
  // Regroupe tout ce qui NE SE MANGE PAS CRU : féculents (pomme de terre,
  // riz, pâtes...) et légumes "durs" qu'on ne sert jamais tels quels dans
  // une salade froide (courge, aubergine, chou-fleur, brocoli...). Le nom
  // garde "starchy" pour des raisons historiques (utilisé tel quel dans les
  // archétypes ci-dessous) mais la propriété commune qui compte vraiment
  // pour tryDishPattern est "doit être cuit avant d'être mangé" — c'est ce
  // qui exclut ce groupe de salade-composee (aucune étape de cuisson) tout
  // en le gardant bienvenu dans gratin/soupe/poêlée (qui, eux, cuisent).
  starchy: [
    'pomme de terre', 'pommes de terre', 'patate douce', 'panais', 'topinambour', 'igname',
    'riz', 'pâtes', 'nouilles', 'nouille', 'quinoa', 'semoule', 'boulgour', 'polenta', 'farro', 'freekeh',
    'orzo', 'gnocchi', 'gnocchis', 'vermicelles', 'crozets', 'farfalle', 'macaronis', 'penne', 'rigatoni',
    'spaghetti', 'tortellini', 'ravioles', 'pâte à raviolis', 'lasagnes', 'coquillettes', 'tagliatelles', 'fusilli',
    'cannelloni', 'linguine', 'fettuccine', 'conchiglie', 'orecchiette', 'casarecce', 'bucatini',
    'pipe rigate', 'torsades',
    // Légumes durs à chair dense, jamais mangés crus (courge, aubergine) :
    'courge', 'courge butternut', 'butternut', 'potiron', 'citrouille', 'aubergine',
    // Légumes qu'on cuit systématiquement (vapeur/eau) avant de les servir,
    // par opposition aux jeunes pousses de `leafy` ci-dessous qu'on mange
    // volontiers crues en salade :
    'chou-fleur', 'brocoli', 'choux de bruxelles', 'haricots verts', 'petits pois',
  ],
  cheese: [
    'fromage', 'parmesan', 'gruyère', 'emmental', 'mozzarella', 'chèvre', 'feta', 'ricotta',
    'mascarpone', 'roquefort', 'bleu', 'raclette', 'halloumi', 'burrata', 'paneer', 'comté', 'cheddar',
    'brie', 'camembert',
  ],
  aromatic: ['oignon', 'ail', 'échalote', 'poireau', 'gingembre', 'citronnelle'],
  fresh_veg: [
    'tomate', 'concombre', 'avocat', 'radis', 'roquette', 'salade', 'chou rouge', 'poivron',
    'fenouil', 'maïs', 'edamame', 'carotte', 'betterave', 'céleri', 'courgette',
  ],
  cured_meat: ['jambon', 'lardons', 'bacon', 'chorizo', 'saucisson', 'charcuterie', 'merguez', 'saucisse'],
  herb: ['persil', 'basilic', 'ciboulette', 'coriandre', 'menthe', 'aneth', 'estragon', 'thym', 'romarin', 'sauge'],
  mushroom: ['champignon'],
  // Feuilles/choux qu'on mange volontiers crus en salade (jeunes pousses
  // d'épinard, kale, chou blanc/rouge en coleslaw) — à distinguer des
  // légumes systématiquement cuits (chou-fleur, brocoli...), classés dans
  // `starchy` ci-dessus.
  leafy: ['épinard', 'blette', 'chou kale', 'chou'],
  fruit: [
    'pomme', 'poire', 'banane', 'fraise', 'framboise', 'myrtille', 'cerise', 'pêche', 'abricot',
    'mangue', 'ananas', 'kiwi', 'raisin', 'orange', 'citron', 'pamplemousse', 'melon', 'figue', 'rhubarbe',
  ],
  legume_canned: ['thon', 'sardine', 'maquereau', 'pois chiche', 'haricots blancs', 'haricots rouges', 'haricots noirs', 'lentille'],
  protein: [
    'poulet', 'boeuf', 'bœuf', 'porc', 'viande', 'saumon', 'poisson', 'crevette', 'fruits de mer',
    'dinde', 'canard', 'agneau', 'veau', 'cabillaud', 'lieu', 'dorade', 'truite', 'sole', 'espadon',
    'rouget', 'lapin', 'poulpe', 'calamar', 'crabe', 'moules', 'palourdes', 'tofu', 'seitan', 'steak',
  ],
  // Ingrédients sucrés/pâtisserie : volontairement exclus de la liste
  // "allow" de tous les archétypes salés ci-dessous (aucun plat salé n'en a
  // besoin) — un ingrédient sucré présent finira donc systématiquement en
  // `unusedIngredients` plutôt que d'être injecté dans un plat salé (ex: du
  // chocolat dans un gratin de poisson).
  sweet: [
    'chocolat', 'sucre', 'cassonade', 'miel', 'vanille', 'caramel', 'confiture', 'pâte à tartiner',
    'biscuits', 'pépites de chocolat', 'praliné', 'pâte d\'arachide', 'beurre de cacahuète',
    'sirop d\'érable', 'glace vanille', 'pain d\'épices',
  ],
}

const ACCENTS_REGEX = /[̀-ͯ]/g
function normalize(str) {
  return str.trim().toLowerCase().normalize('NFD').replace(ACCENTS_REGEX, '')
}

// Caractère "de mot" pour nos besoins : lettre (y compris œ/æ, des ligatures
// que NFD ne décompose pas) ou chiffre. Sert à repérer les limites d'un mot.
const WORD_CHAR_REGEX = /[a-z0-9œæ]/
function isWordChar(char) {
  return !!char && WORD_CHAR_REGEX.test(char)
}

// Vrai si le caractère suivant la fin du mot-clé marque bien une limite de
// mot : fin de chaîne, caractère non-alphanumérique (espace, tiret...), ou
// un simple "s"/"x" de pluriel en toute fin de chaîne (pour reconnaître les
// pluriels non listés explicitement, ex: "carotte" -> "carottes").
function hasWordBoundaryAfter(text, index) {
  if (index >= text.length) return true
  const char = text[index]
  if (!isWordChar(char)) return true
  return (char === 's' || char === 'x') && index === text.length - 1
}

// Vrai si `keyword` apparaît dans `text` comme un mot (ou groupe de mots)
// entier, et pas comme simple fragment au milieu d'un autre mot. Un simple
// `.includes()` classait par erreur "bœuf" en 'egg' (contient "œuf") et
// "chorizo" en 'starchy' (contient "riz") — deux faux positifs qui
// faussaient le choix d'archétype de plat (ex: du bœuf traité comme un œuf
// pouvait déclencher à tort l'omelette).
function containsKeyword(text, keyword) {
  let searchFrom = 0
  let index = text.indexOf(keyword, searchFrom)
  while (index !== -1) {
    const boundaryBefore = index === 0 || !isWordChar(text[index - 1])
    const boundaryAfter = hasWordBoundaryAfter(text, index + keyword.length)
    if (boundaryBefore && boundaryAfter) return true
    searchFrom = index + 1
    index = text.indexOf(keyword, searchFrom)
  }
  return false
}

// Renvoie la première catégorie dont un mot-clé apparaît dans le nom
// d'ingrédient, ou 'other' si non reconnu. Un ingrédient non classé reste
// toujours traité comme "compatible" avec n'importe quel plat (voir
// tryDishPattern dans recipeEngine.js) plutôt que d'être exclu à tort faute
// de catégorisation.
export function categorizeIngredient(name) {
  const normalized = normalize(name)
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => containsKeyword(normalized, normalize(kw)))) return category
  }
  return 'other'
}

// Archétypes de plats réalistes. `requires` : au moins un ingrédient de ces
// catégories doit être présent pour que l'archétype soit even envisagé.
// `allow` : catégories qu'il peut plausiblement accueillir en plus — un
// ingrédient d'une catégorie hors de cette liste est laissé de côté plutôt
// que forcé dans le plat (ex: pas de lait dans une poêlée). `maxIngredients` :
// nombre réaliste d'ingrédients pour CE plat précis — même un ingrédient de
// catégorie "allow" est laissé de côté (voir tryDishPattern dans
// recipeEngine.js) au-delà de cette limite, pour éviter une "omelette" à 11
// ingrédients simplement parce que chacun d'eux est individuellement
// compatible avec le principe de l'omelette.
export const DISH_PATTERNS = [
  {
    id: 'omelette-maison',
    requires: ['egg'],
    allow: ['egg', 'dairy_liquid', 'starchy', 'cheese', 'aromatic', 'cured_meat', 'mushroom', 'leafy', 'herb', 'fresh_veg'],
    maxIngredients: 5,
    emoji: '🍳',
    time: 15,
    level: 'facile',
    name: (list) => `Omelette maison (${list})`,
    nameEn: (list) => `Homemade omelette (${list})`,
    // Les œufs sont déjà couverts par "battre les œufs" : les ré-énumérer
    // dans "couper le reste de vos ingrédients" serait trompeur, donc cette
    // étape ne liste que ce qui n'est pas de la catégorie "egg" (voir
    // categorizeIngredient) — et disparaît complètement s'il ne reste rien
    // d'autre (juste des œufs).
    steps: (list, ingredients) => {
      const rest = ingredients.filter((ing) => categorizeIngredient(ing) !== 'egg').join(', ')
      return [
        'Battre les œufs dans un saladier avec une pincée de sel et de poivre.',
        ...(rest ? [`Couper finement le reste de vos ingrédients (${rest}) et les faire revenir 3 à 4 minutes à la poêle.`] : []),
        'Verser les œufs battus par-dessus (dans la poêle, sur les autres ingrédients si vous en avez).',
        "Cuire 4 à 5 minutes à feu moyen jusqu'à ce que l'omelette soit prise, plier en deux et servir.",
      ]
    },
    stepsEn: (list, ingredients) => {
      const rest = ingredients.filter((ing) => categorizeIngredient(ing) !== 'egg').join(', ')
      return [
        'Beat the eggs in a bowl with a pinch of salt and pepper.',
        ...(rest ? [`Finely chop the rest of your ingredients (${rest}) and sauté them for 3-4 minutes.`] : []),
        'Pour the beaten eggs over them (in the pan, over the other ingredients if you have any).',
        'Cook 4-5 minutes over medium heat until set, fold in half and serve.',
      ]
    },
  },
  {
    id: 'gratin-maison',
    requires: ['starchy'],
    allow: ['starchy', 'dairy_liquid', 'cheese', 'aromatic', 'cured_meat', 'mushroom', 'protein', 'leafy'],
    maxIngredients: 6,
    emoji: '🧀',
    time: 40,
    level: 'moyen',
    name: (list) => `Gratin maison (${list})`,
    nameEn: (list) => `Homemade gratin (${list})`,
    steps: (list) => [
      `Couper vos ingrédients (${list}) en morceaux réguliers et les précuire 10 minutes à l'eau bouillante si nécessaire.`,
      'Les disposer dans un plat à gratin.',
      'Napper de crème ou de lait, et couvrir de fromage râpé si vous en avez.',
      "Enfourner 25 à 30 minutes à 200°C jusqu'à ce que ce soit doré.",
    ],
    stepsEn: (list) => [
      `Cut your ingredients (${list}) into even pieces, parboiling starchy ones for 10 minutes if needed.`,
      'Arrange them in a baking dish.',
      'Cover with cream or milk, and top with grated cheese if you have some.',
      'Bake 25-30 minutes at 200°C (400°F) until golden.',
    ],
  },
  {
    id: 'salade-composee',
    requires: ['fresh_veg', 'cheese', 'cured_meat', 'fruit', 'legume_canned'],
    // PAS de 'starchy' ici (contrairement aux autres archétypes) : cet
    // archétype n'a aucune étape de cuisson, donc rien qui doive être cuit
    // avant d'être mangé (pomme de terre, courge, aubergine, chou-fleur...)
    // ne doit s'y retrouver — un ingrédient de cette catégorie rejoint
    // `unusedIngredients` plutôt que d'être servi cru et immangeable.
    allow: ['fresh_veg', 'cheese', 'cured_meat', 'fruit', 'legume_canned', 'herb', 'egg', 'dairy_liquid', 'leafy'],
    maxIngredients: 7,
    emoji: '🥗',
    time: 15,
    level: 'facile',
    name: (list) => `Salade composée (${list})`,
    nameEn: (list) => `Composed salad (${list})`,
    // Les œufs ne se "coupent" pas crus dans une salade : ils sont cuits
    // durs à part (comme une salade niçoise), d'où une étape dédiée plutôt
    // que de les mélanger à l'énumération générique — même logique que
    // omelette-maison qui sort déjà les œufs du "reste de vos ingrédients".
    steps: (list, ingredients) => {
      const eggs = ingredients.filter((ing) => categorizeIngredient(ing) === 'egg')
      const rest = ingredients.filter((ing) => categorizeIngredient(ing) !== 'egg').join(', ')
      return [
        ...(eggs.length
          ? [`Faire cuire ${eggs.join(', ')} à l'eau bouillante pendant 9 à 10 minutes pour les avoir durs, puis les écaler et les couper en quartiers.`]
          : []),
        `Couper ou préparer le reste de vos ingrédients (${rest || list}).`,
        'Les disposer ensemble dans un grand saladier.',
        'Préparer une vinaigrette avec huile, vinaigre (ou citron), sel et poivre.',
        'Mélanger et servir frais.',
      ]
    },
    stepsEn: (list, ingredients) => {
      const eggs = ingredients.filter((ing) => categorizeIngredient(ing) === 'egg')
      const rest = ingredients.filter((ing) => categorizeIngredient(ing) !== 'egg').join(', ')
      return [
        ...(eggs.length
          ? [`Boil ${eggs.join(', ')} for 9-10 minutes until hard-boiled, then peel and cut into quarters.`]
          : []),
        `Cut or prepare the rest of your ingredients (${rest || list}).`,
        'Arrange them together in a large bowl.',
        'Make a dressing with oil, vinegar (or lemon), salt and pepper.',
        'Toss and serve chilled.',
      ]
    },
  },
  {
    id: 'soupe-maison',
    requires: ['fresh_veg', 'starchy', 'leafy', 'aromatic', 'legume_canned'],
    allow: ['fresh_veg', 'starchy', 'leafy', 'aromatic', 'dairy_liquid', 'protein', 'legume_canned', 'herb', 'mushroom'],
    maxIngredients: 7,
    emoji: '🍲',
    time: 30,
    level: 'facile',
    name: (list) => `Soupe maison (${list})`,
    nameEn: (list) => `Homemade soup (${list})`,
    steps: (list) => [
      `Couper tous vos ingrédients (${list}).`,
      "Faire revenir l'oignon ou l'ail quelques minutes si vous en avez.",
      "Ajouter le reste des ingrédients et couvrir d'eau (ou de bouillon).",
      'Laisser mijoter 20 minutes, mixer pour un velouté ou servir tel quel.',
    ],
    stepsEn: (list) => [
      `Cut all your ingredients (${list}).`,
      'Sauté the onion or garlic for a few minutes if you have some.',
      'Add the rest of the ingredients and cover with water (or stock).',
      'Simmer 20 minutes, blend for a smooth soup or serve as is.',
    ],
  },
  {
    id: 'poelee-maison',
    requires: ['protein', 'fresh_veg', 'starchy', 'mushroom', 'leafy', 'cured_meat'],
    allow: ['protein', 'fresh_veg', 'starchy', 'mushroom', 'leafy', 'cured_meat', 'aromatic', 'herb', 'cheese'],
    maxIngredients: 6,
    emoji: '🥘',
    time: 20,
    level: 'facile',
    name: (list) => `Poêlée maison (${list})`,
    nameEn: (list) => `Homemade skillet (${list})`,
    steps: (list) => [
      `Couper tous vos ingrédients (${list}) en morceaux de taille similaire.`,
      "Faire chauffer un filet d'huile dans une poêle.",
      'Faire revenir en premier les ingrédients les plus longs à cuire, puis ajouter les autres.',
      'Cuire 8 à 10 minutes à feu moyen-vif, assaisonner et servir chaud.',
    ],
    stepsEn: (list) => [
      `Cut all your ingredients (${list}) into similarly sized pieces.`,
      'Heat a little oil in a pan.',
      'Sauté the longest-cooking ingredients first, then add the rest.',
      'Cook 8-10 minutes over medium-high heat, season and serve hot.',
    ],
  },
]
