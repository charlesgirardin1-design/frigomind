// -----------------------------------------------------------------------------
// ingredientSubstitutes.js
// Suggestions de remplacement pour les ingrédients les plus couramment
// substitués en cuisine (pas exhaustif sur les 325 ingrédients de la base —
// uniquement ceux où une substitution a vraiment du sens). Purement
// informatif : ces suggestions ne sont pas vérifiées contre le vocabulaire
// exact de recipesDB.js, elles peuvent mentionner un terme générique.
// -----------------------------------------------------------------------------

export const INGREDIENT_SUBSTITUTES = {
  // Produits laitiers & matières grasses
  beurre: ["huile d'olive", 'margarine'],
  'beurre demi-sel': ['beurre + une pincée de sel'],
  crème: ['crème fraîche', 'lait concentré non sucré'],
  'crème fraîche': ['yaourt grec', 'fromage blanc'],
  lait: ['lait de coco', 'crème fraîche allongée avec de l’eau'],
  yaourt: ['fromage blanc', 'crème fraîche'],
  'yaourt grec': ['yaourt', 'fromage blanc égoutté'],
  fromage: ['parmesan râpé', 'levure maltée'],
  mascarpone: ['crème fraîche épaisse', 'ricotta + un peu de crème'],
  ricotta: ['fromage blanc égoutté', 'mascarpone allégé'],
  parmesan: ['pecorino', 'fromage à raclette'],
  mozzarella: ['emmental', 'fromage à raclette'],
  'lait de coco': ['crème fraîche', 'lait'],
  'lait concentré': ['crème + sucre'],

  // Œufs & liants
  œufs: ['compote de pommes (pour les gâteaux)', 'graines de chia trempées'],
  'œufs durs': ['tofu ferme émietté'],

  // Féculents & farines
  farine: ['farine complète', 'farine de riz'],
  'farine complète': ['farine'],
  'farine de sarrasin': ['farine de riz', 'farine complète'],
  chapelure: ["flocons d'avoine mixés", 'biscottes émiettées'],
  riz: ['quinoa', 'boulgour'],
  'riz basmati': ['riz', 'quinoa'],
  pâtes: ['riz', 'quinoa'],
  quinoa: ['boulgour', 'riz'],
  boulgour: ['quinoa', 'semoule'],
  semoule: ['boulgour', 'quinoa'],

  // Sucres
  sucre: ['miel', 'cassonade'],
  cassonade: ['sucre + un peu de miel'],
  miel: ["sirop d'érable", 'cassonade'],
  vanille: ['extrait de vanille', 'cannelle'],

  // Acides & condiments
  citron: ['vinaigre', 'citron vert'],
  'citron vert': ['citron'],
  vinaigre: ['citron'],
  moutarde: ['raifort (petite quantité)'],
  mayonnaise: ['yaourt grec + une pointe de moutarde'],
  huile: ["huile d'olive", 'beurre fondu'],
  "huile d'olive": ['huile de tournesol', 'beurre fondu'],
  'sauce soja': ['sel + un peu de bouillon'],

  // Herbes & épices
  basilic: ['persil', 'origan'],
  persil: ['coriandre fraîche', 'ciboulette'],
  'coriandre fraîche': ['persil'],
  thym: ['romarin', 'herbes de provence'],
  romarin: ['thym'],
  cannelle: ['muscade (petite quantité)'],
  gingembre: ['citronnelle'],
  ail: ['échalote'],
  oignon: ['échalote', 'oignon rouge'],
  échalote: ['oignon'],

  // Protéines
  'boeuf haché': ['porc haché', 'agneau haché'],
  'porc haché': ['boeuf haché'],
  poulet: ['dinde', 'tofu (version végétarienne)'],
  crevettes: ['poulpe', 'tofu ferme (version végétarienne)'],
  lardons: ['bacon', 'poitrine de porc fumée'],
  bacon: ['lardons'],
  jambon: ['jambon cru', 'poitrine de porc'],
  'pois chiches': ['haricots blancs', 'lentilles'],
  lentilles: ['pois chiches', 'haricots rouges'],
  'haricots blancs': ['pois chiches', 'haricots rouges'],
  'haricots rouges': ['haricots noirs', 'pois chiches'],

  // Fruits à coque
  amandes: ['noix', 'pistaches'],
  noix: ['amandes', 'pistaches'],
  'beurre de cacahuète': ['tahini'],
  tahini: ['beurre de cacahuète'],

  // Légumes
  courgette: ['aubergine', 'concombre'],
  aubergine: ['courgette', 'champignons'],
  champignons: ['aubergine'],
  épinards: ['blette', 'chou kale'],
  'chou-fleur': ['brocoli'],
  brocoli: ['chou-fleur', 'choux de bruxelles'],
  'pomme de terre': ['patate douce', 'panais'],
  'pommes de terre': ['patate douce', 'panais'],
  'patate douce': ['pomme de terre', 'potiron'],
  carotte: ['panais', 'patate douce'],

  // Liquides de cuisson
  'vin blanc': ['bouillon + un trait de vinaigre'],
  'vin rouge': ['bouillon + un trait de vinaigre'],
  bouillon: ['eau + herbes de provence'],

  // Chocolat & pâtisserie
  chocolat: ['pépites de chocolat', 'cacao + beurre'],
  'pépites de chocolat': ['chocolat cassé en morceaux'],
}

export function getSubstitutes(name) {
  return INGREDIENT_SUBSTITUTES[name] || null
}
