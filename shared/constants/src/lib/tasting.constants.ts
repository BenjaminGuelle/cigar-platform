// ============================================
// TASTING CONSTANTS
// ALL STARS Architecture ⭐
// Code in English, labels in French
// ============================================

// ============================================
// PRESENTATION - Aspect de la cape
// ============================================
export const CAPE_ASPECTS = [
  { id: 'well_stretched', label: 'Bien tendue' },
  { id: 'relaxed', label: 'Relâchée' },
  { id: 'fine_grain', label: 'Grain fin et luisant' },
  { id: 'matte_aspect', label: 'Aspect mat' },
  { id: 'oily', label: 'Gras' },
  { id: 'dull', label: 'Terne' },
  { id: 'neutral', label: 'Neutre' },
  { id: 'veined', label: 'Nervurée' },
] as const;

export type CapeAspect = typeof CAPE_ASPECTS[number]['id'];

// ============================================
// PRESENTATION - Couleur de la cape
// ============================================
export const CAPE_COLORS = [
  { id: 'negro', label: 'Negro', description: 'Brun-noir' },
  { id: 'maduro', label: 'Maduro', description: 'Marron foncé' },
  { id: 'maduro_claro', label: 'Maduro Claro', description: 'Marron' },
  { id: 'colorado', label: 'Colorado', description: 'Brun rouge' },
  { id: 'colorado_claro', label: 'Colorado Claro', description: 'Marron clair, ocre, fauve' },
  { id: 'claro', label: 'Claro', description: 'Marron très clair, brun mordoré' },
  { id: 'clarrissimo', label: 'Clarrissimo', description: 'Clair' },
] as const;

export type CapeColor = typeof CAPE_COLORS[number]['id'];

// ============================================
// PRESENTATION - Toucher
// ============================================
export const CAPE_TOUCHES = [
  { id: 'rigid', label: 'Rigide' },
  { id: 'firm', label: 'Ferme' },
  { id: 'supple', label: 'Souple' },
  { id: 'regular', label: 'Régulier' },
  { id: 'irregular', label: 'Irrégulier' },
] as const;

export type CapeTouch = typeof CAPE_TOUCHES[number]['id'];

// ============================================
// GOÛTS (19) - Perçus en bouche
// ============================================
export const TASTES = [
  { id: 'herbaceous', label: 'Herbacé', description: 'Foin, herbe fraîche' },
  { id: 'floral', label: 'Fleuri', description: 'Notes florales délicates' },
  { id: 'woody', label: 'Boisé', description: 'Cèdre, chêne, bois précieux' },
  { id: 'earthy', label: 'Terreux', description: 'Terre humide, champignon' },
  { id: 'sweetish', label: 'Douceâtre', description: 'Sucré léger' },
  { id: 'spicy', label: 'Piquant', description: 'Poivre, épices vives' },
  { id: 'sweet', label: 'Sucré', description: 'Miel, caramel' },
  { id: 'fruity', label: 'Fruité', description: 'Fruits secs ou frais' },
  { id: 'honeyed', label: 'Mielleux', description: 'Miel prononcé' },
  { id: 'creamy', label: 'Onctueux', description: 'Texture crémeuse' },
  { id: 'matte', label: 'Mat', description: 'Sans éclat particulier' },
  { id: 'flat', label: 'Plat', description: 'Peu de relief' },
  { id: 'harsh', label: 'Âpre', description: 'Astringent, rugueux' },
  { id: 'full_bodied', label: 'Corsé', description: 'Puissant, intense' },
  { id: 'bland', label: 'Fade', description: 'Manque de caractère' },
  { id: 'tangy', label: 'Acidulé', description: 'Légèrement acide' },
  { id: 'bitter', label: 'Amer', description: 'Amertume prononcée' },
  { id: 'coating', label: 'Empâtant', description: 'Lourd en bouche' },
  { id: 'cocoa', label: 'Cacaoté', description: 'Cacao, chocolat noir' },
] as const;

export type TasteId = typeof TASTES[number]['id'];

// ============================================
// ARÔMES (16) - Perçus par le nez
// ============================================
export const AROMAS = [
  { id: 'herbaceous', label: 'Herbacé', description: 'Foin, thé vert' },
  { id: 'floral', label: 'Floral', description: 'Fleurs, parfum délicat' },
  { id: 'woody', label: 'Boisé', description: 'Cèdre, santal' },
  { id: 'earthy', label: 'Terreux', description: 'Humus, sous-bois' },
  { id: 'undergrowth', label: 'Sous-bois', description: 'Feuilles mortes, mousse' },
  { id: 'peppery', label: 'Poivré', description: 'Poivre noir, blanc' },
  { id: 'spiced', label: 'Épicé', description: 'Cannelle, clou de girofle' },
  { id: 'fruity', label: 'Fruité', description: 'Agrumes, fruits rouges' },
  { id: 'animal', label: 'Animal', description: 'Cuir, musc' },
  { id: 'coffee', label: 'Café', description: 'Café torréfié' },
  { id: 'cacao', label: 'Cacao', description: 'Fève de cacao' },
  { id: 'cream', label: 'Crème', description: 'Lactique, beurré' },
  { id: 'brioche', label: 'Brioché', description: 'Pâtisserie, beurre' },
  { id: 'pastry', label: 'Viennoiserie', description: 'Croissant, pain' },
  { id: 'caramel', label: 'Caramel', description: 'Sucre caramélisé' },
  { id: 'empyreumatic', label: 'Empyreumatique', description: 'Fumé, grillé, torréfié' },
] as const;

export type AromaId = typeof AROMAS[number]['id'];

// ============================================
// TECHNIQUE - Tirage
// ============================================
export const DRAWS = [
  { id: 'difficult', label: 'Difficile' },
  { id: 'correct', label: 'Correct' },
  { id: 'too_easy', label: 'Trop aisé' },
] as const;

export type Draw = typeof DRAWS[number]['id'];

// ============================================
// TECHNIQUE - Nature de la cendre
// ============================================
export const ASH_NATURES = [
  { id: 'regular', label: 'Régulière' },
  { id: 'irregular', label: 'Irrégulière' },
  { id: 'clean', label: 'Nette' },
] as const;

export type AshNature = typeof ASH_NATURES[number]['id'];

// ============================================
// TECHNIQUE - Équilibre
// ============================================
export const BALANCES = [
  { id: 'good', label: 'Bon' },
  { id: 'clashing', label: 'Heurté' },
  { id: 'blended', label: 'Fondu' },
] as const;

export type Balance = typeof BALANCES[number]['id'];

// ============================================
// TECHNIQUE - Terroir
// ============================================
export const TERROIRS = [
  { id: 'pronounced', label: 'Accusé' },
  { id: 'noticeable', label: 'Sensible' },
  { id: 'absent', label: 'Inexistant' },
] as const;

export type Terroir = typeof TERROIRS[number]['id'];

// ============================================
// IMPRESSION FINALE EN BOUCHE
// ============================================
export const MOUTH_IMPRESSIONS = [
  { id: 'fullness', label: 'Plénitude' },
  { id: 'heaviness', label: 'Lourdeur' },
  { id: 'dryness', label: 'Sécheresse' },
  { id: 'flatness', label: 'Platitude' },
  { id: 'lightness', label: 'Légèreté' },
  { id: 'freshness', label: 'Fraîcheur' },
] as const;

export type MouthImpression = typeof MOUTH_IMPRESSIONS[number]['id'];

// ============================================
// PERSISTANCE AROMATIQUE
// ============================================
export const PERSISTENCES = [
  { id: 'short', label: 'Courte' },
  { id: 'medium', label: 'Moyenne' },
  { id: 'long', label: 'Longue' },
] as const;

export type Persistence = typeof PERSISTENCES[number]['id'];

// ============================================
// CORPS - Échelles (Puissance)
// ============================================
export const STRENGTH_LABELS = [
  { value: 1, label: 'Inconsistant' },
  { value: 2, label: 'Creux' },
  { value: 3, label: 'Faible' },
  { value: 4, label: 'Mince' },
  { value: 5, label: 'Moyen' },
  { value: 6, label: 'Étoffé' },
  { value: 7, label: 'Plein' },
  { value: 8, label: 'Copieux' },
  { value: 9, label: 'Rassasiant' },
  { value: 10, label: 'Très rassasiant' },
] as const;

// ============================================
// CORPS - Échelles (Variété)
// ============================================
export const VARIETY_LABELS = [
  { value: 1, label: 'Indigent' },
  { value: 2, label: 'Très pauvre' },
  { value: 3, label: 'Pauvre' },
  { value: 4, label: 'Modeste' },
  { value: 5, label: 'Moyen' },
  { value: 6, label: 'Riche' },
  { value: 7, label: 'Généreux' },
  { value: 8, label: 'Opulent' },
  { value: 9, label: 'Capiteux' },
  { value: 10, label: 'Très capiteux' },
] as const;

// ============================================
// PHASES DE DÉGUSTATION (Tiers du cigare)
// ============================================
export const TASTING_PHASES = [
  { id: 'presentation', label: 'Présentation', description: 'Avant allumage' },
  { id: 'cold_draw', label: 'Fumage à cru', description: 'Tirage à froid' },
  { id: 'first_third', label: 'Foin', description: 'Premier tiers' },
  { id: 'second_third', label: 'Divin', description: 'Deuxième tiers' },
  { id: 'final_third', label: 'Purin', description: 'Troisième tiers' },
  { id: 'conclusion', label: 'Conclusion', description: 'Bilan technique' },
] as const;

export type TastingPhase = typeof TASTING_PHASES[number]['id'];

// ============================================
// PHASE 1 (QUICK) - Moment de la journée
// ============================================
export const TASTING_MOMENTS = [
  { id: 'morning', label: 'Matin' },
  { id: 'afternoon', label: 'Après-midi' },
  { id: 'evening', label: 'Soir' },
] as const;

export type TastingMoment = typeof TASTING_MOMENTS[number]['id'];

// ============================================
// PHASE 1 (QUICK) - Situation
// ============================================
export const TASTING_SITUATIONS = [
  { id: 'aperitif', label: 'Apéritif' },
  { id: 'cocktail', label: 'Cocktail' },
  { id: 'digestif', label: 'Digestif' },
] as const;

export type TastingSituation = typeof TASTING_SITUATIONS[number]['id'];

// ============================================
// PHASE 1 (QUICK) - Accompagnement (Pairing)
// ============================================
export const PAIRING_TYPES = [
  { id: 'whisky', label: 'Whisky' },
  { id: 'rum', label: 'Rhum' },
  { id: 'cognac', label: 'Cognac' },
  { id: 'coffee', label: 'Café' },
  { id: 'tea', label: 'Thé' },
  { id: 'water', label: 'Eau' },
  { id: 'wine', label: 'Vin' },
  { id: 'beer', label: 'Bière' },
  { id: 'other', label: 'Autre' },
] as const;

export type PairingType = typeof PAIRING_TYPES[number]['id'];
