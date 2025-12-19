// ============================================
// TASTES (Goûts)
// ============================================

export const TASTES = [
  {
    key: 'herbaceous',
    label: 'Herbacé',
    description: 'Herbe fraîche, foin, thé vert',
  },
  { key: 'woody', label: 'Boisé', description: 'Cèdre, chêne, bois humide' },
  {
    key: 'earthy',
    label: 'Terreux',
    description: 'Terre, champignon, sous-bois',
  },
  { key: 'leathery', label: 'Cuir', description: 'Cuir tanné, cuir frais' },
  {
    key: 'spicy',
    label: 'Épicé',
    description: 'Poivre, cannelle, muscade, clou de girofle',
  },
  { key: 'sweet', label: 'Sucré', description: 'Miel, caramel, vanille' },
  {
    key: 'fruity',
    label: 'Fruité',
    description: 'Fruits secs, agrumes, fruits rouges',
  },
  { key: 'nutty', label: 'Noix', description: 'Amande, noisette, noix' },
  { key: 'cocoa', label: 'Cacaoté', description: 'Cacao, chocolat noir' },
  { key: 'coffee', label: 'Café', description: 'Café torréfié, expresso' },
  { key: 'creamy', label: 'Crémeux', description: 'Crème, lait, beurre' },
  {
    key: 'roasted',
    label: 'Grillé',
    description: 'Pain grillé, torréfaction',
  },
  { key: 'salty', label: 'Salé', description: 'Notes salines, minérales' },
  { key: 'bitter', label: 'Amer', description: 'Amertume, café noir' },
  {
    key: 'peppery',
    label: 'Poivré',
    description: 'Poivre noir, poivre blanc',
  },
] as const;

// ============================================
// AROMAS (Arômes)
// ============================================

export const AROMAS = [
  { key: 'floral', label: 'Floral', description: 'Rose, jasmin, violette' },
  {
    key: 'spicy',
    label: 'Épicé',
    description: 'Épices douces et chaudes',
  },
  { key: 'coffee', label: 'Café', description: 'Arôme de café frais' },
  {
    key: 'cocoa',
    label: 'Cacao',
    description: 'Fève de cacao, chocolat',
  },
  {
    key: 'caramel',
    label: 'Caramel',
    description: 'Caramel, sucre brûlé',
  },
  { key: 'vanilla', label: 'Vanille', description: 'Vanille douce' },
  { key: 'cedar', label: 'Cèdre', description: 'Bois de cèdre' },
  { key: 'leather', label: 'Cuir', description: 'Cuir fin' },
  { key: 'hay', label: 'Foin', description: 'Foin sec, paille' },
  { key: 'honey', label: 'Miel', description: "Miel, cire d'abeille" },
  {
    key: 'nuts',
    label: 'Fruits secs',
    description: 'Amande, noisette grillée',
  },
  { key: 'earth', label: 'Terre', description: 'Terre humide, humus' },
  { key: 'pepper', label: 'Poivre', description: 'Poivre, piquant' },
  { key: 'wood', label: 'Bois', description: 'Bois noble, chêne' },
  {
    key: 'tobacco',
    label: 'Tabac',
    description: 'Tabac blond, tabac séché',
  },
  {
    key: 'dried_fruit',
    label: 'Fruits séchés',
    description: 'Raisin sec, figue, datte',
  },
] as const;

// ============================================
// CAPE ASPECTS
// ============================================

export const CAPE_ASPECTS = [
  { key: 'tight', label: 'Bien tendue' },
  { key: 'loose', label: 'Relâchée' },
  { key: 'fine_grain', label: 'Grain fin' },
  { key: 'matte', label: 'Mat' },
  { key: 'oily', label: 'Gras' },
  { key: 'dull', label: 'Terne' },
  { key: 'veiny', label: 'Nervurée' },
] as const;

// ============================================
// CAPE COLORS
// ============================================

export const CAPE_COLORS = [
  {
    key: 'double_claro',
    label: 'Double Claro',
    description: 'Vert clair, séchage rapide',
  },
  { key: 'claro', label: 'Claro', description: 'Blond clair' },
  {
    key: 'colorado_claro',
    label: 'Colorado Claro',
    description: 'Brun clair doré',
  },
  {
    key: 'colorado',
    label: 'Colorado',
    description: 'Brun moyen, rougeâtre',
  },
  {
    key: 'colorado_maduro',
    label: 'Colorado Maduro',
    description: 'Brun foncé',
  },
  {
    key: 'maduro',
    label: 'Maduro',
    description: 'Très foncé, presque noir',
  },
  { key: 'oscuro', label: 'Oscuro/Negro', description: 'Noir' },
] as const;

// ============================================
// TOUCHES (Toucher)
// ============================================

export const TOUCHES = [
  { key: 'rigid', label: 'Rigide' },
  { key: 'firm', label: 'Ferme' },
  { key: 'supple', label: 'Souple' },
  { key: 'regular', label: 'Régulier' },
  { key: 'irregular', label: 'Irrégulier' },
] as const;

// ============================================
// START IMPRESSIONS (Impressions début)
// ============================================

export const START_IMPRESSIONS = [
  { key: 'pungent', label: 'Piquant' },
  { key: 'bitter', label: 'Amertume' },
  { key: 'dry', label: 'Sécheresse' },
  { key: 'pleasant', label: 'Agréable' },
  { key: 'irritation', label: 'Irritation' },
] as const;

// ============================================
// FINAL IMPRESSIONS (Impressions finales)
// ============================================

export const FINAL_IMPRESSIONS = [
  { key: 'fullness', label: 'Plénitude' },
  { key: 'heaviness', label: 'Lourdeur' },
  { key: 'dryness', label: 'Sécheresse' },
  { key: 'flatness', label: 'Platitude' },
  { key: 'lightness', label: 'Légèreté' },
  { key: 'freshness', label: 'Fraîcheur' },
] as const;

// ============================================
// PERSISTENCE (Persistance aromatique)
// ============================================

export const PERSISTENCE = [
  { key: 'long', label: 'Longue' },
  { key: 'medium', label: 'Moyenne' },
  { key: 'short', label: 'Courte' },
] as const;

// ============================================
// DRAW (Tirage)
// ============================================

export const DRAW = [
  { key: 'difficult', label: 'Difficile' },
  { key: 'correct', label: 'Correct' },
  { key: 'too_easy', label: 'Trop aisé' },
] as const;

// ============================================
// TERROIR
// ============================================

export const TERROIR = [
  { key: 'pronounced', label: 'Accusé' },
  { key: 'noticeable', label: 'Sensible' },
  { key: 'none', label: 'Inexistant' },
] as const;

// ============================================
// BALANCE (Équilibre)
// ============================================

export const BALANCE = [
  { key: 'good', label: 'Bon' },
  { key: 'jarring', label: 'Heurté' },
  { key: 'blended', label: 'Fondu' },
] as const;

// ============================================
// MOMENT (Moment de dégustation)
// ============================================

export const MOMENT = [
  { key: 'morning', label: 'Matin' },
  { key: 'afternoon', label: 'Après-midi' },
  { key: 'evening', label: 'Soir' },
] as const;

// ============================================
// ASH NATURE (Nature de la cendre)
// ============================================

export const ASH_NATURE = [
  { key: 'regular', label: 'Régulière' },
  { key: 'irregular', label: 'Irrégulière' },
  { key: 'clean', label: 'Nette' },
] as const;

// ============================================
// SITUATION
// ============================================

export const SITUATION = [
  { key: 'aperitif', label: 'Apéritif' },
  { key: 'cocktail', label: 'Cocktail' },
  { key: 'digestif', label: 'Digestif' },
] as const;

// ============================================
// CLUB ROLES
// ============================================

export const CLUB_ROLES = [
  { key: 'admin', label: 'Administrateur' },
  { key: 'member', label: 'Membre' },
] as const;