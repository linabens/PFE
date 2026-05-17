/**
 * Customization config per category type.
 * category_type comes from the backend JOIN: 'coffee' | 'drink' | 'cold' | 'food' | 'dessert' | 'special'
 */

export const CATEGORY_CONFIGS = {

  // ─── ☕ Cafés ──────────────────────────────────────────────────────────────
  coffee: {
    sizes: [
      { id: 'S', label: 'S', mult: 1,    volume: '250ml' },
      { id: 'M', label: 'M', mult: 1.25, volume: '350ml' },
      { id: 'L', label: 'L', mult: 1.5,  volume: '450ml' },
    ],
    defaultSize: 'M',
    milkTypes: [
      { id: 'entier',  name: 'Lait entier', extra: 0 },
      { id: 'ecreme',  name: 'Lait écrémé', extra: 0 },
      { id: 'amande',  name: 'Amande',      extra: 1.5 },
      { id: 'avoine',  name: 'Avoine',      extra: 1.5 },
      { id: 'soja',    name: 'Soja',        extra: 1.0 },
    ],
    supplements: [
      { id: 'vanille',   name: 'Sirop de Vanille',    price: 1.5 },
      { id: 'caramel',   name: 'Caramel beurre salé', price: 1.5 },
      { id: 'noisette',  name: 'Sirop Noisette',       price: 1.5 },
      { id: 'shot',      name: "Shot d'espresso",      price: 2.0 },
      { id: 'chantilly', name: 'Crème Chantilly',      price: 1.0 },
    ],
    sugarLevels:   ['Sans sucre', '1 sucre', '2 sucres', '3 sucres'],
    temperatures:  ['Chaud', 'Tiède', 'Froid'],
  },

  // ─── 🍵 Thés & boissons chaudes ───────────────────────────────────────────
  drink: {
    sizes: [
      { id: 'S', label: 'S', mult: 1,    volume: '250ml' },
      { id: 'M', label: 'M', mult: 1.25, volume: '350ml' },
      { id: 'L', label: 'L', mult: 1.5,  volume: '450ml' },
    ],
    defaultSize: 'M',
    supplements: [
      { id: 'miel',      name: 'Miel',           price: 0.5 },
      { id: 'citron',    name: 'Citron',          price: 0.5 },
      { id: 'menthe',    name: 'Menthe fraîche',  price: 0.3 },
      { id: 'gingembre', name: 'Gingembre',       price: 0.8 },
    ],
    sugarLevels:   ['Sans sucre', 'Peu sucré', 'Moyennement sucré', 'Très sucré'],
    temperatures:  ['Chaud', 'Glacé'],
    steepingTimes: ['Léger (2 min)', 'Normal (3-4 min)', 'Fort (5+ min)'],
  },

  // ─── 🥤 Boissons froides / Smoothies / Milkshakes ─────────────────────────
  cold: {
    sizes: [
      { id: 'M', label: 'M', mult: 1,   volume: '350ml' },
      { id: 'L', label: 'L', mult: 1.3, volume: '500ml' },
    ],
    defaultSize: 'M',
    supplements: [
      { id: 'chia',      name: 'Graines de Chia', price: 1.5 },
      { id: 'miel',      name: 'Miel',            price: 0.5 },
      { id: 'protein',   name: 'Protéine Whey',   price: 3.0 },
      { id: 'spiruline', name: 'Spiruline',        price: 2.5 },
    ],
    iceLevels:      ['Sans glace', 'Peu de glace', 'Normale', 'Beaucoup'],
    sweetnessLevels: ['Sans sucre', '25%', '50%', '75%', '100%'],
    bases: [
      { id: 'lait',   name: 'Base lait',   extra: 0 },
      { id: 'yaourt', name: 'Base yaourt', extra: 0.5 },
      { id: 'coco',   name: 'Eau de coco', extra: 1.5 },
    ],
  },

  // ─── 🥪 Sandwichs / Wraps / Plats ─────────────────────────────────────────
  food: {
    sizes: null,
    breadTypes: [
      { id: 'blanc',    name: 'Pain blanc',      extra: 0 },
      { id: 'complet',  name: 'Pain complet',    extra: 0.5 },
      { id: 'cereales', name: 'Aux céréales',    extra: 0.5 },
      { id: 'tortilla', name: 'Tortilla',        extra: 0 },
    ],
    supplements: [
      { id: 'cheddar', name: 'Cheddar',  price: 1.0 },
      { id: 'avocat',  name: 'Avocat',   price: 2.0 },
      { id: 'bacon',   name: 'Bacon',    price: 2.5 },
      { id: 'oeuf',    name: 'Œuf',      price: 1.5 },
      { id: 'tomate',  name: 'Tomate',   price: 0.5 },
    ],
    sauces: [
      { id: 'mayo',     name: 'Mayonnaise',    price: 0 },
      { id: 'moutarde', name: 'Moutarde',      price: 0 },
      { id: 'bbq',      name: 'Sauce BBQ',     price: 0.5 },
      { id: 'piquante', name: 'Sauce piquante', price: 0.5 },
    ],
    toastedOptions: ['Non grillé', 'Légèrement grillé', 'Bien grillé'],
  },

  // ─── 🍰 Desserts & Pâtisseries ────────────────────────────────────────────
  dessert: {
    sizes: null,
    supplements: [
      { id: 'chantilly', name: 'Crème Chantilly', price: 1.0 },
      { id: 'glace',     name: 'Glace vanille',   price: 2.5 },
      { id: 'chocolat',  name: 'Sauce chocolat',  price: 0.8 },
      { id: 'caramel',   name: 'Sauce caramel',   price: 0.8 },
      { id: 'fruits',    name: 'Fruits frais',    price: 1.5 },
    ],
    warmingOptions: ['Froid', 'Température ambiante', 'Réchauffé'],
    servingStyles:  ['Sur place', 'À emporter'],
  },

  // ─── 🌟 Spécial / Saisonnier (fallback) ───────────────────────────────────
  special: {
    sizes: [
      { id: 'S', label: 'S', mult: 1,    volume: '250ml' },
      { id: 'M', label: 'M', mult: 1.25, volume: '350ml' },
      { id: 'L', label: 'L', mult: 1.5,  volume: '450ml' },
    ],
    defaultSize: 'M',
    supplements: [
      { id: 'vanille',   name: 'Sirop de Vanille', price: 1.5 },
      { id: 'chantilly', name: 'Crème Chantilly',  price: 1.0 },
    ],
    temperatures: ['Chaud', 'Froid'],
  },
};

/** Returns the config for a given category_type, falling back to 'coffee'. */
export function getConfig(categoryType) {
  return CATEGORY_CONFIGS[categoryType] ?? CATEGORY_CONFIGS.coffee;
}

/** Build the initial state object from a config. */
export function buildInitialState(config) {
  const defaultSize = config.sizes?.find(s => s.id === config.defaultSize) ?? config.sizes?.[0] ?? null;
  return {
    size:        defaultSize,
    supplements: {},     // { [id]: supplement }
    sauces:      {},     // { [id]: sauce }      — food only
    milkType:    config.milkTypes?.[0]       ?? null,
    sugar:       config.sugarLevels?.[0]     ?? null,
    temperature: config.temperatures?.[0]    ?? null,
    steeping:    config.steepingTimes?.[1]   ?? null,
    iceLevel:    config.iceLevels?.[2]       ?? null,   // default 'Normale'
    sweetness:   config.sweetnessLevels?.[2] ?? null,   // default '50%'
    base:        config.bases?.[0]           ?? null,
    breadType:   config.breadTypes?.[0]      ?? null,
    toasted:     config.toastedOptions?.[0]  ?? null,
    warming:     config.warmingOptions?.[1]  ?? null,
    serving:     config.servingStyles?.[0]   ?? null,
  };
}

/** Compute the extra cost from a state object. */
export function computeExtras(state) {
  const suppTotal  = Object.values(state.supplements).reduce((s, x) => s + x.price, 0);
  const sauceTotal = Object.values(state.sauces).reduce((s, x) => s + x.price, 0);
  const milkExtra  = state.milkType?.extra  ?? 0;
  const baseExtra  = state.base?.extra      ?? 0;
  const breadExtra = state.breadType?.extra ?? 0;
  return suppTotal + sauceTotal + milkExtra + baseExtra + breadExtra;
}

/** Serialise state to a flat string array for the cart. */
export function buildOptionsArray(state, config) {
  const opts = [];
  if (state.size)        opts.push(state.size.label);
  if (state.milkType)    opts.push(state.milkType.name);
  if (state.sugar)       opts.push(state.sugar);
  if (state.temperature) opts.push(state.temperature);
  if (state.steeping)    opts.push(state.steeping);
  if (state.iceLevel)    opts.push(`Glace : ${state.iceLevel}`);
  if (state.sweetness)   opts.push(`Sucre : ${state.sweetness}`);
  if (state.base)        opts.push(state.base.name);
  if (state.breadType)   opts.push(state.breadType.name);
  if (state.toasted)     opts.push(state.toasted);
  if (state.warming)     opts.push(state.warming);
  if (state.serving)     opts.push(state.serving);
  Object.values(state.supplements).forEach(s => opts.push(s.name));
  Object.values(state.sauces).forEach(s => opts.push(s.name));
  return opts;
}
