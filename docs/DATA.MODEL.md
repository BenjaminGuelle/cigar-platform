# DATA_MODEL.md

# Modèle de données - Cigar Platform

## Vue d'ensemble des entités
```
User ─────┬───── ClubMember ─────── Club
          │
          ├───── Evaluation ────┬── Event (optionnel)
          │                     │
          └───── Cigar ─────────┘
```

---

## Entités

### User

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Identifiant unique |
| email | string | unique, not null | Email de connexion |
| displayName | string | not null | Nom affiché |
| avatarUrl | string | nullable | Photo de profil |
| createdAt | timestamp | not null | Date de création |

> Auth gérée par Supabase Auth, `password` non stocké dans cette table.

---

### Club

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Identifiant unique |
| name | string | not null | Nom du club |
| description | string | nullable | Description |
| imageUrl | string | nullable | Logo/photo du club |
| createdBy | uuid | FK → User | Créateur du club |
| createdAt | timestamp | not null | Date de création |

---

### ClubMember

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Identifiant unique |
| clubId | uuid | FK → Club | Club concerné |
| userId | uuid | FK → User | Membre |
| role | enum | not null | `admin` \| `member` |
| joinedAt | timestamp | not null | Date d'adhésion |

**Contrainte unique** : `(clubId, userId)`

---

### Event

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Identifiant unique |
| clubId | uuid | FK → Club | Club organisateur |
| cigarId | uuid | FK → Cigar, nullable | Cigare de la soirée (optionnel) |
| name | string | not null | Nom de l'event |
| description | string | nullable | Description |
| date | timestamp | not null | Date de l'event |
| createdBy | uuid | FK → User | Créateur |
| createdAt | timestamp | not null | Date de création |

---

### Cigar

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Identifiant unique |
| brand | string | not null | Marque (ex: Hoyo de Monterrey) |
| name | string | not null | Vitole (ex: Epicure No. 2) |
| origin | string | nullable | Pays d'origine |
| wrapper | string | nullable | Type de cape |
| createdBy | uuid | FK → User | Créateur de la fiche |
| createdAt | timestamp | not null | Date de création |

**Contrainte unique** : `(brand, name)` — évite les doublons exacts

---

### Evaluation

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Identifiant unique |
| userId | uuid | FK → User, not null | Évaluateur |
| cigarId | uuid | FK → Cigar, not null | Cigare évalué |
| eventId | uuid | FK → Event, nullable | Event associé (optionnel) |
| rating | integer | not null, 1-5 | Note globale (bagues) |
| photoUrl | string | nullable | Photo du cigare |
| date | timestamp | not null | Date de dégustation |
| duration | integer | nullable | Durée en minutes |
| comment | text | nullable | Opinion globale |
| createdAt | timestamp | not null | Date de création |

**Section Présentation (avant allumage)**

| Champ | Type | Description |
|-------|------|-------------|
| capeAspects | string[] | Aspects de la cape (multi-select) |
| capeColor | string | Couleur de la cape (single) |
| touch | string | Toucher (single) |

**Section Tirage à cru**

| Champ | Type | Description |
|-------|------|-------------|
| coldTastes | string[] | Goûts perçus à froid |
| coldAromas | string[] | Arômes perçus à froid |
| coldNotes | text | Notes libres |

**Section 1er tiers (FOIN)**

| Champ | Type | Description |
|-------|------|-------------|
| firstTastes | string[] | Goûts perçus |
| firstAromas | string[] | Arômes perçus |
| firstStrength | integer (1-5) | Puissance/Corps |
| firstNotes | text | Notes libres |

**Section 2e tiers (DIVIN)**

| Champ | Type | Description |
|-------|------|-------------|
| secondTastes | string[] | Goûts perçus |
| secondAromas | string[] | Arômes perçus |
| secondStrength | integer (1-5) | Puissance/Corps |
| secondNotes | text | Notes libres |

**Section 3e tiers (PURIN)**

| Champ | Type | Description |
|-------|------|-------------|
| thirdTastes | string[] | Goûts perçus |
| thirdAromas | string[] | Arômes perçus |
| thirdStrength | integer (1-5) | Puissance/Corps |
| thirdNotes | text | Notes libres |

**Section Bilan global**

| Champ | Type | Description |
|-------|------|-------------|
| startImpressions | string[] | Début (multi-select) |
| finalImpressions | string[] | Impression finale (multi-select) |
| persistence | string | Persistance aromatique (single) |
| draw | string | Tirage (single) |
| terroir | string | Terroir (single) |
| balance | string | Équilibre (single) |
| moment | string | Moment de dégustation (single) |
| ashNature | string | Nature de la cendre (single) |
| situation | string | Situation (single) |

---

## Constantes / Enums

### Goûts (TASTES)
```typescript
export const TASTES = [
  { key: 'herbaceous', label: 'Herbacé', description: 'Herbe fraîche, foin, thé vert' },
  { key: 'woody', label: 'Boisé', description: 'Cèdre, chêne, bois humide' },
  { key: 'earthy', label: 'Terreux', description: 'Terre, champignon, sous-bois' },
  { key: 'leathery', label: 'Cuir', description: 'Cuir tanné, cuir frais' },
  { key: 'spicy', label: 'Épicé', description: 'Poivre, cannelle, muscade, clou de girofle' },
  { key: 'sweet', label: 'Sucré', description: 'Miel, caramel, vanille' },
  { key: 'fruity', label: 'Fruité', description: 'Fruits secs, agrumes, fruits rouges' },
  { key: 'nutty', label: 'Noix', description: 'Amande, noisette, noix' },
  { key: 'cocoa', label: 'Cacaoté', description: 'Cacao, chocolat noir' },
  { key: 'coffee', label: 'Café', description: 'Café torréfié, expresso' },
  { key: 'creamy', label: 'Crémeux', description: 'Crème, lait, beurre' },
  { key: 'roasted', label: 'Grillé', description: 'Pain grillé, torréfaction' },
  { key: 'salty', label: 'Salé', description: 'Notes salines, minérales' },
  { key: 'bitter', label: 'Amer', description: 'Amertume, café noir' },
  { key: 'peppery', label: 'Poivré', description: 'Poivre noir, poivre blanc' },
  // À compléter avec ta liste complète
] as const;
```

### Arômes (AROMAS)
```typescript
export const AROMAS = [
  { key: 'floral', label: 'Floral', description: 'Rose, jasmin, violette' },
  { key: 'spicy', label: 'Épicé', description: 'Épices douces et chaudes' },
  { key: 'coffee', label: 'Café', description: 'Arôme de café frais' },
  { key: 'cocoa', label: 'Cacao', description: 'Fève de cacao, chocolat' },
  { key: 'caramel', label: 'Caramel', description: 'Caramel, sucre brûlé' },
  { key: 'vanilla', label: 'Vanille', description: 'Vanille douce' },
  { key: 'cedar', label: 'Cèdre', description: 'Bois de cèdre' },
  { key: 'leather', label: 'Cuir', description: 'Cuir fin' },
  { key: 'hay', label: 'Foin', description: 'Foin sec, paille' },
  { key: 'honey', label: 'Miel', description: 'Miel, cire d\'abeille' },
  { key: 'nuts', label: 'Fruits secs', description: 'Amande, noisette grillée' },
  { key: 'earth', label: 'Terre', description: 'Terre humide, humus' },
  { key: 'pepper', label: 'Poivre', description: 'Poivre, piquant' },
  { key: 'wood', label: 'Bois', description: 'Bois noble, chêne' },
  { key: 'tobacco', label: 'Tabac', description: 'Tabac blond, tabac séché' },
  { key: 'dried_fruit', label: 'Fruits séchés', description: 'Raisin sec, figue, datte' },
] as const;
```

### Aspect cape (CAPE_ASPECTS)
```typescript
export const CAPE_ASPECTS = [
  { key: 'tight', label: 'Bien tendue' },
  { key: 'loose', label: 'Relâchée' },
  { key: 'fine_grain', label: 'Grain fin' },
  { key: 'matte', label: 'Mat' },
  { key: 'oily', label: 'Gras' },
  { key: 'dull', label: 'Terne' },
  { key: 'veiny', label: 'Nervurée' },
] as const;
```

### Couleur cape (CAPE_COLORS)
```typescript
export const CAPE_COLORS = [
  { key: 'double_claro', label: 'Double Claro', description: 'Vert clair, séchage rapide' },
  { key: 'claro', label: 'Claro', description: 'Blond clair' },
  { key: 'colorado_claro', label: 'Colorado Claro', description: 'Brun clair doré' },
  { key: 'colorado', label: 'Colorado', description: 'Brun moyen, rougeâtre' },
  { key: 'colorado_maduro', label: 'Colorado Maduro', description: 'Brun foncé' },
  { key: 'maduro', label: 'Maduro', description: 'Très foncé, presque noir' },
  { key: 'oscuro', label: 'Oscuro/Negro', description: 'Noir' },
] as const;
```

### Toucher (TOUCHES)
```typescript
export const TOUCHES = [
  { key: 'rigid', label: 'Rigide' },
  { key: 'firm', label: 'Ferme' },
  { key: 'supple', label: 'Souple' },
  { key: 'regular', label: 'Régulier' },
  { key: 'irregular', label: 'Irrégulier' },
] as const;
```

### Impressions début (START_IMPRESSIONS)
```typescript
export const START_IMPRESSIONS = [
  { key: 'pungent', label: 'Piquant' },
  { key: 'bitter', label: 'Amertume' },
  { key: 'dry', label: 'Sécheresse' },
  { key: 'pleasant', label: 'Agréable' },
  { key: 'irritation', label: 'Irritation' },
] as const;
```

### Impressions finales (FINAL_IMPRESSIONS)
```typescript
export const FINAL_IMPRESSIONS = [
  { key: 'fullness', label: 'Plénitude' },
  { key: 'heaviness', label: 'Lourdeur' },
  { key: 'dryness', label: 'Sécheresse' },
  { key: 'flatness', label: 'Platitude' },
  { key: 'lightness', label: 'Légèreté' },
  { key: 'freshness', label: 'Fraîcheur' },
] as const;
```

### Persistance (PERSISTENCE)
```typescript
export const PERSISTENCE = [
  { key: 'long', label: 'Longue' },
  { key: 'medium', label: 'Moyenne' },
  { key: 'short', label: 'Courte' },
] as const;
```

### Tirage (DRAW)
```typescript
export const DRAW = [
  { key: 'difficult', label: 'Difficile' },
  { key: 'correct', label: 'Correct' },
  { key: 'too_easy', label: 'Trop aisé' },
] as const;
```

### Terroir (TERROIR)
```typescript
export const TERROIR = [
  { key: 'pronounced', label: 'Accusé' },
  { key: 'noticeable', label: 'Sensible' },
  { key: 'none', label: 'Inexistant' },
] as const;
```

### Équilibre (BALANCE)
```typescript
export const BALANCE = [
  { key: 'good', label: 'Bon' },
  { key: 'jarring', label: 'Heurté' },
  { key: 'blended', label: 'Fondu' },
] as const;
```

### Moment (MOMENT)
```typescript
export const MOMENT = [
  { key: 'morning', label: 'Matin' },
  { key: 'afternoon', label: 'Après-midi' },
  { key: 'evening', label: 'Soir' },
] as const;
```

### Nature de la cendre (ASH_NATURE)
```typescript
export const ASH_NATURE = [
  { key: 'regular', label: 'Régulière' },
  { key: 'irregular', label: 'Irrégulière' },
  { key: 'clean', label: 'Nette' },
] as const;
```

### Situation (SITUATION)
```typescript
export const SITUATION = [
  { key: 'aperitif', label: 'Apéritif' },
  { key: 'cocktail', label: 'Cocktail' },
  { key: 'digestif', label: 'Digestif' },
] as const;
```

### Rôles club (CLUB_ROLES)
```typescript
export const CLUB_ROLES = [
  { key: 'admin', label: 'Administrateur' },
  { key: 'member', label: 'Membre' },
] as const;
```

---

## Relations
```
User (1) ──── (N) ClubMember (N) ──── (1) Club
User (1) ──── (N) Evaluation
User (1) ──── (N) Cigar (created)
User (1) ──── (N) Event (created)
User (1) ──── (N) Club (created)

Club (1) ──── (N) Event
Club (1) ──── (N) ClubMember

Event (N) ──── (0..1) Cigar
Event (1) ──── (N) Evaluation

Cigar (1) ──── (N) Evaluation
```

---

## Index recommandés

- `Evaluation.userId` — récupérer les évals d'un user
- `Evaluation.eventId` — récupérer les évals d'un event
- `Evaluation.cigarId` — stats par cigare
- `ClubMember.userId` — clubs d'un user
- `ClubMember.clubId` — membres d'un club
- `Event.clubId` — events d'un club
- `Cigar(brand, name)` — recherche autocomplete