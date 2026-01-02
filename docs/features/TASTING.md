# Feature: Tasting (Dégustation)

> **Status**: 🚧 MVP Development  
> **Priority**: Critical (Core feature)  
> **Effort**: L (4-6 sprints)

---

## 📋 Summary

Le Tasting est le **cœur de l'application**. Il permet à un utilisateur d'enregistrer sa dégustation de cigare, soit de manière rapide (Free), soit de manière approfondie avec observations par tiers (Premium).

**Philosophie UX** : Accompagner le fumeur, pas lui proposer un formulaire.

---

## 🎯 User Flows

### Flow Free — Quick Tasting (~2 min)

```
Phase 1 (Quick) → Phase Finale → Confirmation
```

### Flow Premium — Expert Tasting (temps réel)

```
Phase 1 → Présentation → Fumage à cru → Foin → Divin → Purin → Conclusion → Phase Finale → Confirmation
```

### Compagnon temporel

L'app suggère la progression basée sur le temps écoulé :
- "Vous approchez probablement du DIVIN"
- L'utilisateur peut naviguer librement entre les sections
- Pas de switch automatique

---

## 🔄 Contextes de dégustation

| Contexte | Stockage automatique |
|----------|---------------------|
| **Solo** | `user.tastings[]` |
| **Club** | `user.tastings[]` + `club.tastings[]` via `TastingOnClub` |
| **Event** | `user.tastings[]` + `club.tastings[]` + lié à `event` |

Le contexte est déterminé par :
- `eventId` présent → EVENT (club déduit de l'event)
- `sharedClubs[]` rempli sans event → CLUB
- Rien → SOLO

---

## 💾 Data Model

### Modifications Prisma requises

```prisma
// Ajouter l'enum TastingStatus
enum TastingStatus {
  DRAFT
  COMPLETED
}

// Ajouter l'enum TastingMoment
enum TastingMoment {
  MATIN
  APRES_MIDI
  SOIR
}

// Ajouter l'enum TastingSituation
enum TastingSituation {
  APERITIF
  COCKTAIL
  DIGESTIF
}

// Ajouter l'enum PairingType
enum PairingType {
  WHISKY
  RHUM
  COGNAC
  CAFE
  THE
  EAU
  VIN
  BIERE
  AUTRE
}

// Modifier le model Tasting
model Tasting {
  id      String  @id @default(uuid()) @db.Uuid
  userId  String  @db.Uuid
  cigarId String  @db.Uuid
  eventId String? @db.Uuid

  // Status
  status TastingStatus @default(DRAFT)

  // Phase 1 - Quick
  date      DateTime        @default(now())
  moment    TastingMoment?
  situation TastingSituation?
  pairing   PairingType?
  pairingNote String?       // Précision sur la boisson
  location  String?         // Pour tasting solo uniquement
  photoUrl  String?
  
  // Durée (auto-calculée ou manuelle)
  duration  Int?            // Minutes

  // Phase Finale
  rating   Float            // 0.5-5 par pas de 0.5
  comment  String?  @db.Text

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  cigar        Cigar           @relation(fields: [cigarId], references: [id], onDelete: Cascade)
  event        Event?          @relation(fields: [eventId], references: [id], onDelete: SetNull)
  observations Observation[]
  sharedClubs  TastingOnClub[]

  @@index([userId])
  @@index([cigarId])
  @@index([eventId])
  @@index([status])
  @@map("tastings")
}

// Modifier le model Event (ajouter location)
model Event {
  // ... existing fields ...
  location String?  // "Bar Le Fumoir" ou "Chez @membre"
}
```

### Structure Observation (JSON organoleptic)

Le champ `Observation.organoleptic` stocke les données détaillées en JSON :

**⚠️ IMPORTANT**: Toutes les clés sont en ANGLAIS, seules les valeurs d'affichage sont en français.

```typescript
interface TastingObservations {
  // Section 1 - Présentation (avant allumage)
  presentation?: {
    wrapperAspect: CapeAspect[];      // Multi-select
    wrapperColor: CapeColor;          // Single-select
    touch: CapeToucher[];             // Multi-select
  };

  // Section 2 - Fumage à cru
  coldDraw?: {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
    notes?: string;
  };

  // Section 3 - Foin (Premier tiers)
  firstThird?: {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  };

  // Section 4 - Divin (Deuxième tiers)
  secondThird?: {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  };

  // Section 5 - Purin (Troisième tiers)
  finalThird?: {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  };

  // Section 6 - Conclusion
  conclusion?: {
    // Technique
    draw: 'difficult' | 'correct' | 'too_easy';
    ashNature: 'regular' | 'irregular' | 'clean';
    balance: 'good' | 'rough' | 'smooth';
    terroir: 'strong' | 'noticeable' | 'absent';

    // Corps
    power: number;  // 1-10
    variety: number;    // 1-10

    // Impression finale
    mouthImpression: ImpressionBouche[];
    persistence: 'short' | 'medium' | 'long';
  };
}

interface FlavorTag {
  id: string;           // 'boise', 'herbace', etc.
  intensity: 1 | 2 | 3; // Faible / Moyen / Fort
}
```

---

## 📊 Constantes & Enums

### Fichier: `libs/shared/constants/src/lib/tasting.constants.ts`

ATTENTION !! j'ai fait en FR mais le code c'est anglais TOUJOURS, transformer les noms, hors value d'affichage en fr. 

```typescript
// ============================================
// PRÉSENTATION - Aspect de la cape
// ============================================
export const CAPE_ASPECTS = [
  { id: 'bien_tendue', label: 'Bien tendue' },
  { id: 'relachee', label: 'Relâchée' },
  { id: 'grain_fin', label: 'Grain fin et luisant' },
  { id: 'aspect_mat', label: 'Aspect mat' },
  { id: 'gras', label: 'Gras' },
  { id: 'terne', label: 'Terne' },
  { id: 'neutre', label: 'Neutre' },
  { id: 'nervuree', label: 'Nervurée' },
] as const;

export type CapeAspect = typeof CAPE_ASPECTS[number]['id'];

// ============================================
// PRÉSENTATION - Couleur de la cape
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
// PRÉSENTATION - Toucher
// ============================================
export const CAPE_TOUCHERS = [
  { id: 'rigide', label: 'Rigide' },
  { id: 'ferme', label: 'Ferme' },
  { id: 'souple', label: 'Souple' },
  { id: 'regulier', label: 'Régulier' },
  { id: 'irregulier', label: 'Irrégulier' },
] as const;

export type CapeToucher = typeof CAPE_TOUCHERS[number]['id'];

// ============================================
// GOÛTS (19) - Perçus en bouche
// ============================================
export const GOUTS = [
  { id: 'herbace', label: 'Herbacé', description: 'Foin, herbe fraîche' },
  { id: 'fleuri', label: 'Fleuri', description: 'Notes florales délicates' },
  { id: 'boise', label: 'Boisé', description: 'Cèdre, chêne, bois précieux' },
  { id: 'terreux', label: 'Terreux', description: 'Terre humide, champignon' },
  { id: 'douceatre', label: 'Douceâtre', description: 'Sucré léger' },
  { id: 'piquant', label: 'Piquant', description: 'Poivre, épices vives' },
  { id: 'sucre', label: 'Sucré', description: 'Miel, caramel' },
  { id: 'fruite', label: 'Fruité', description: 'Fruits secs ou frais' },
  { id: 'mielleux', label: 'Mielleux', description: 'Miel prononcé' },
  { id: 'onctueux', label: 'Onctueux', description: 'Texture crémeuse' },
  { id: 'mat', label: 'Mat', description: 'Sans éclat particulier' },
  { id: 'plat', label: 'Plat', description: 'Peu de relief' },
  { id: 'apre', label: 'Âpre', description: 'Astringent, rugueux' },
  { id: 'corse', label: 'Corsé', description: 'Puissant, intense' },
  { id: 'fade', label: 'Fade', description: 'Manque de caractère' },
  { id: 'acidule', label: 'Acidulé', description: 'Légèrement acide' },
  { id: 'amer', label: 'Amer', description: 'Amertume prononcée' },
  { id: 'empatant', label: 'Empâtant', description: 'Lourd en bouche' },
  { id: 'cacaote', label: 'Cacaoté', description: 'Cacao, chocolat noir' },
] as const;

export type GoutId = typeof GOUTS[number]['id'];

// ============================================
// ARÔMES (16) - Perçus par le nez
// ============================================
export const AROMES = [
  { id: 'herbace', label: 'Herbacé', description: 'Foin, thé vert' },
  { id: 'floral', label: 'Floral', description: 'Fleurs, parfum délicat' },
  { id: 'boise', label: 'Boisé', description: 'Cèdre, santal' },
  { id: 'terreux', label: 'Terreux', description: 'Humus, sous-bois' },
  { id: 'sous_bois', label: 'Sous-bois', description: 'Feuilles mortes, mousse' },
  { id: 'poivre', label: 'Poivré', description: 'Poivre noir, blanc' },
  { id: 'epice', label: 'Épicé', description: 'Cannelle, clou de girofle' },
  { id: 'fruite', label: 'Fruité', description: 'Agrumes, fruits rouges' },
  { id: 'animal', label: 'Animal', description: 'Cuir, musc' },
  { id: 'cafe', label: 'Café', description: 'Café torréfié' },
  { id: 'cacao', label: 'Cacao', description: 'Fève de cacao' },
  { id: 'creme', label: 'Crème', description: 'Lactique, beurré' },
  { id: 'brioche', label: 'Brioché', description: 'Pâtisserie, beurre' },
  { id: 'viennoiserie', label: 'Viennoiserie', description: 'Croissant, pain' },
  { id: 'caramel', label: 'Caramel', description: 'Sucre caramélisé' },
  { id: 'empyreumatique', label: 'Empyreumatique', description: 'Fumé, grillé, torréfié' },
] as const;

export type AromeId = typeof AROMES[number]['id'];

// ============================================
// TECHNIQUE - Tirage
// ============================================
export const TIRAGES = [
  { id: 'difficile', label: 'Difficile' },
  { id: 'correct', label: 'Correct' },
  { id: 'trop_aise', label: 'Trop aisé' },
] as const;

export type Tirage = typeof TIRAGES[number]['id'];

// ============================================
// TECHNIQUE - Nature de la cendre
// ============================================
export const NATURE_CENDRES = [
  { id: 'reguliere', label: 'Régulière' },
  { id: 'irreguliere', label: 'Irrégulière' },
  { id: 'nette', label: 'Nette' },
] as const;

export type NatureCendre = typeof NATURE_CENDRES[number]['id'];

// ============================================
// TECHNIQUE - Équilibre
// ============================================
export const EQUILIBRES = [
  { id: 'bon', label: 'Bon' },
  { id: 'heurte', label: 'Heurté' },
  { id: 'fondu', label: 'Fondu' },
] as const;

export type Equilibre = typeof EQUILIBRES[number]['id'];

// ============================================
// TECHNIQUE - Terroir
// ============================================
export const TERROIRS = [
  { id: 'accuse', label: 'Accusé' },
  { id: 'sensible', label: 'Sensible' },
  { id: 'inexistant', label: 'Inexistant' },
] as const;

export type Terroir = typeof TERROIRS[number]['id'];

// ============================================
// IMPRESSION FINALE EN BOUCHE
// ============================================
export const IMPRESSIONS_BOUCHE = [
  { id: 'plenitude', label: 'Plénitude' },
  { id: 'lourdeur', label: 'Lourdeur' },
  { id: 'secheresse', label: 'Sécheresse' },
  { id: 'platitude', label: 'Platitude' },
  { id: 'legerete', label: 'Légèreté' },
  { id: 'fraicheur', label: 'Fraîcheur' },
] as const;

export type ImpressionBouche = typeof IMPRESSIONS_BOUCHE[number]['id'];

// ============================================
// PERSISTANCE AROMATIQUE
// ============================================
export const PERSISTANCES = [
  { id: 'courte', label: 'Courte' },
  { id: 'moyenne', label: 'Moyenne' },
  { id: 'longue', label: 'Longue' },
] as const;

export type Persistance = typeof PERSISTANCES[number]['id'];

// ============================================
// CORPS - Échelles
// ============================================
export const PUISSANCE_LABELS = [
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

export const VARIETE_LABELS = [
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
  { id: 'fumage_cru', label: 'Fumage à cru', description: 'Tirage à froid' },
  { id: 'foin', label: 'Foin', description: 'Premier tiers' },
  { id: 'divin', label: 'Divin', description: 'Deuxième tiers' },
  { id: 'purin', label: 'Purin', description: 'Troisième tiers' },
  { id: 'conclusion', label: 'Conclusion', description: 'Bilan technique' },
] as const;

export type TastingPhase = typeof TASTING_PHASES[number]['id'];
```

---

## 🎖️ Système de notation "Bagues"

La note utilise une échelle de 0.5 à 5, par pas de 0.5, visualisée avec des bagues de cigare.

**Notes possibles** : 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5

**Affichage** :
- ◉ = Bague pleine (1 point)
- ◐ = Demi-bague (0.5 point)
- ○ = Bague vide

**Exemple pour 3.5/5** : ◉ ◉ ◉ ◐ ○

---

## 🔌 API Endpoints

### TastingController

```typescript
@Controller('tastings')
@ApiTags('tastings')
@UseGuards(JwtAuthGuard)
export class TastingController {

  // Créer un tasting (DRAFT)
  @Post()
  @ApiOperation({ summary: 'Create a new tasting (draft)' })
  create(@Body() dto: CreateTastingDto, @CurrentUser() user): Promise<TastingResponseDto>

  // Mettre à jour (auto-save)
  @Patch(':id')
  @ApiOperation({ summary: 'Update tasting (auto-save)' })
  update(@Param('id') id: string, @Body() dto: UpdateTastingDto): Promise<TastingResponseDto>

  // Finaliser le tasting
  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete tasting (DRAFT → COMPLETED)' })
  complete(@Param('id') id: string, @Body() dto: CompleteTastingDto): Promise<TastingResponseDto>

  // Récupérer un tasting
  @Get(':id')
  @ApiOperation({ summary: 'Get tasting by ID' })
  findOne(@Param('id') id: string): Promise<TastingResponseDto>

  // Mes tastings
  @Get('me')
  @ApiOperation({ summary: 'Get my tastings' })
  findMine(@Query() query: FilterTastingDto, @CurrentUser() user): Promise<PaginatedResponse<TastingResponseDto>>

  // Tastings d'un cigare
  @Get('cigar/:cigarId')
  @ApiOperation({ summary: 'Get tastings for a cigar' })
  findByCigar(@Param('cigarId') cigarId: string, @Query() query: FilterTastingDto): Promise<PaginatedResponse<TastingResponseDto>>

  // Tastings d'un club
  @Get('club/:clubId')
  @ApiOperation({ summary: 'Get tastings shared with a club' })
  findByClub(@Param('clubId') clubId: string, @Query() query: FilterTastingDto): Promise<PaginatedResponse<TastingResponseDto>>

  // Supprimer
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tasting' })
  remove(@Param('id') id: string): Promise<void>
}
```

### ObservationController (nested)

```typescript
@Controller('tastings/:tastingId/observations')
@ApiTags('observations')
@UseGuards(JwtAuthGuard)
export class ObservationController {

  // Créer/Mettre à jour une observation pour une phase
  @Put(':phase')
  @ApiOperation({ summary: 'Upsert observation for a phase' })
  upsert(
    @Param('tastingId') tastingId: string,
    @Param('phase') phase: TastingPhase,
    @Body() dto: UpsertObservationDto
  ): Promise<ObservationResponseDto>

  // Récupérer toutes les observations d'un tasting
  @Get()
  @ApiOperation({ summary: 'Get all observations for a tasting' })
  findAll(@Param('tastingId') tastingId: string): Promise<ObservationResponseDto[]>

  // Supprimer une observation
  @Delete(':phase')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete observation for a phase' })
  remove(@Param('tastingId') tastingId: string, @Param('phase') phase: TastingPhase): Promise<void>
}
```

---

## 📱 Frontend Structure

```
apps/web/src/app/features/tasting/
├── tasting.routes.ts
├── pages/
│   ├── tasting-page/              # Page principale (mode focus)
│   │   ├── tasting-page.component.ts
│   │   ├── tasting-page.component.html
│   │   └── tasting-page.component.scss
│   └── tasting-detail-page/       # Vue lecture seule
│       └── ...
├── components/
│   ├── tasting-header/            # Header mode focus
│   ├── tasting-progress/          # Indicateur de progression
│   ├── tasting-timer/             # Compagnon temporel
│   ├── phase-quick/               # Phase 1
│   ├── phase-presentation/        # Observation: Présentation
│   ├── phase-fumage-cru/          # Observation: Fumage à cru
│   ├── phase-tier/                # Observation: Foin/Divin/Purin (réutilisable)
│   ├── phase-conclusion/          # Observation: Conclusion
│   ├── phase-finale/              # Phase finale (note + commentaire)
│   ├── flavor-picker/             # Sélecteur de goûts/arômes
│   ├── flavor-wheel/              # Roue des saveurs (V1 Premium)
│   ├── rating-bagues/             # Notation bagues cigare
│   └── confirmation-modal/        # Modal de fin
├── stores/
│   └── tasting.store.ts
└── guards/
    └── tasting-draft.guard.ts     # Protection si draft non sauvegardé
```

---

## 🔒 Permissions & Business Rules

### Règle fondamentale

**Un tasting appartient à son créateur (userId).**

Les rôles club (admin/member) n'ont AUCUN impact sur la création/modification.
Ils impactent uniquement la VISIBILITÉ.

### Création / Modification / Suppression

| Action | Permission |
|--------|-----------|
| Créer un tasting | Tout user authentifié |
| Modifier son tasting (DRAFT) | Auteur uniquement |
| Modifier son tasting (COMPLETED) | ❌ Interdit |
| Supprimer son tasting | Auteur uniquement |

### Lecture (Visibilité)

| Visibilité | Auteur | Membres clubs liés | Autres users |
|------------|:------:|:------------------:|:------------:|
| PUBLIC | ✅ | ✅ | ✅ |
| CLUB_ONLY | ✅ | ✅ | ❌ |
| PRIVATE | ✅ | ❌ | ❌ |

### Règles métier

1. Un tasting DRAFT peut être modifié librement
2. Un tasting COMPLETED ne peut plus être modifié (sauf suppression)
3. La durée est calculée automatiquement (createdAt → completedAt) mais éditable
4. Le rating est obligatoire pour compléter un tasting
5. Les observations sont optionnelles (Premium)
6. Le partage dans les clubs est automatique selon le contexte

---

## 🚀 Implementation Roadmap

### Session 1 — Prisma + Constantes

- [ ] Migration Prisma (TastingStatus, enums, location)
- [ ] Créer fichier constantes `tasting.constants.ts`
- [ ] Exporter depuis `@cigar-platform/shared/constants`

### Session 2 — Backend Tasting

- [ ] TastingModule, TastingService, TastingController
- [ ] DTOs: Create, Update, Complete, Response, Filter
- [ ] Validation avec @IsSecureText sur comment
- [ ] Tests endpoints

### Session 3 — Backend Observation

- [ ] ObservationModule (nested sous Tasting)
- [ ] Upsert par phase
- [ ] Validation du JSON organoleptique

### Session 4 — Generate API + Frontend Store

- [ ] `npm run generate:api`
- [ ] tasting.store.ts avec reactive getters
- [ ] Mutations: create, update, complete, delete

### Session 5 — Frontend Phase 1 + Finale

- [ ] Page tasting (mode focus)
- [ ] Composant phase-quick
- [ ] Composant phase-finale
- [ ] Composant rating-bagues
- [ ] Confirmation modal

### Session 6 — Frontend Observations (Premium)

- [ ] Composants pour chaque section
- [ ] Flavor picker (Quick Tags)
- [ ] Timer/Compagnon temporel
- [ ] Navigation entre phases

### Session 7 — Flavor Wheel (V1)

- [ ] Composant roue des saveurs SVG
- [ ] Interactions tap/drag
- [ ] Intégration dans les phases tier

---

## 📝 Notes importantes

### Auto-save

Le tasting passe en DRAFT dès la création et s'auto-save à chaque modification.
Pattern: Debounce 2s sur les inputs, puis PATCH automatique.

### Mode Focus

La page tasting masque la bottom tab et affiche un header minimal :
- Bouton retour (avec confirmation si non sauvegardé)
- Titre "Nouvelle dégustation"
- (Optionnel) Indicateur de progression

### Bouton Share (Préparation V1)

Un bouton "Partager" est affiché dans la confirmation modal mais désactivé :
```html
<button disabled class="share-btn">
  📤 Partager
  <span class="badge">Bientôt</span>
</button>
```

---

## 🔗 Dépendances

### Requises
- ✅ Cigar CRUD (existant)
- ✅ Club system (existant)
- ✅ Event system (à créer en parallèle ou après)
- ✅ Auth system (existant)

### Optionnelles
- Premium subscription system (pour activer observations)
- Feed/POST system (V1)

---

## 🎨 UX / Produit – Design Decisions

### Mode Focus (Mobile)
- Le tasting se déroule dans une **page dédiée plein écran**
- Bottom tab et header global **masqués**
- Header minimal avec :
    - Bouton retour explicite
    - Confirmation si draft non complété
- Objectif : immersion, concentration, rituel

### Phases & Accessibilité
- Phase 1 (Quick) et Phase Finale toujours accessibles (Free)
- Phases d'observation intermédiaires :
    - Enrichissement de l'expérience
    - Support du Premium sans bloquer le Free
- Éviter toute mention agressive du mot *Premium* pendant le flow  
  → Privilégier "Approfondir ce moment", "Analyse avancée"

### Compagnon temporel
- Affiche le temps écoulé depuis le début
- Suggère la phase probable : "Vous approchez du Divin"
- **Non bloquant** : l'utilisateur navigue librement entre les phases
- Objectif : accompagner, pas contraindre

### Observations
- Structurées par phase (JSON `organoleptique`)
- **Notes libres autorisées dans toutes les phases**, même sans tags
- Auto-save silencieux à chaque interaction

### Notation Bagues
- Échelle : 0.5 à 5, par pas de 0.5
- Visualisation : bagues de cigare (◉ ◐ ○)
- Référence : style Havanoscope
- Utilisé sur : notation tasting, moyenne cigare

### Modèle de données
- Le tasting appartient toujours à l'utilisateur
- Le contexte (solo / club / event) définit uniquement la visibilité
- Ajout recommandé :
```ts
  completedAt?: Date  // Transition DRAFT → COMPLETED
```

### Philosophie Premium
- Les fonctionnalités Free ne sont jamais bloquées visuellement
- Les phases à forte valeur sont signalées comme :
    - "Approfondir ce moment"
    - "Analyse avancée"
    - "Fonctionnalité à venir" (si pas encore dispo)
- **Aucun usage du mot "Premium"** tant que l'abonnement n'est pas actif
- Pas de cadenas, pas de blocage dur, pas de frustration

### UX des marqueurs
- Signal doux : icône discrète, texte secondaire, opacité légère
- Toujours accompagné d'un accès possible (lecture / saisie libre)
- Le marqueur **informe**, il ne **contraint** pas

### Objectifs produit
- Valoriser la profondeur sans pénaliser les utilisateurs pressés
- Préparer naturellement la monétisation future
- Maintenir une expérience fluide et respectueuse

TEXT DE LA FEATURES : 
1. Le Header (Titre de la Page):
Titre principal (Doré + font display) : Le Rituel 
Sous-titre (Gris) : Chronique d'un instant sacré
2. Phase 1 : L'installation (Context)
      Titre : L'Entrée en Matière
      Accroche : "Le décor est posé, le temps s'arrête..."
      Labels revisités :
      Lieu : Le Refuge
      Accompagnement : Les Noces (L'alliance du cigare et de la boisson)
3. Les Trois Tercios (Le cœur de l'expertise)
      On utilise les termes officiels, mais avec un adjectif qui donne du relief.
      1er tiers : Le Premier Tercio : L'Éveil (Foin)
      Texte : "La fumée est légère, les premiers arômes se dessinent."
      2ème tiers : Le Deuxième Tercio : La Plénitude (Divin)
      Texte : "Le cigare est à son apogée. L'équilibre est parfait."
      3ème tiers : Le Dernier Tercio : L'Intensité (Purin)
      Texte : "Le caractère s'affirme. La vitole livre ses derniers secrets."
4. Phase Finale : Le Verdict (Conclusion)
   Titre : Le Dernier Mot
   Accroche : "Le feu s'éteint, l'expérience est gravée."
   Note (Bagues) : Le Sceau de l'Excellence
   Commentaire : Notes Personnelles
# Update UX Tasting — Vision "Journal de Dégustation"

Lis `docs/features/TASTING.md` — il contient toute la spec mise à jour.

## Résumé des décisions UX validées

### Layout
- **Scroll vertical unique** (pas de pages séparées)
- **Scroll snap** avec `proximity` (pas `mandatory`)
- **Ligne de vie dorée** (SVG vertical) reliant les sections
- **Header sticky** : nom cigare + timer optionnel

### Flow après Phase 1 — Deux CTAs
```
Phase 1 validée
     │
     ├── CTA A: "Passer au verdict"
     │   → Scroll direct vers Phase Finale
     │   → Sections observations JAMAIS affichées dans le DOM
     │
     └── CTA B: "Approfondir la chronique"
         │
         ├── Si Premium → Affiche sections + scroll vers Présentation
         │
         └── Si Free → Bottom sheet "Mode Découverte"
```

### Mode Découverte (User Free clique CTA B)

1. Bottom sheet s'affiche :
    - Titre : "Mode Découverte"
    - Message : "Ces analyses ne seront pas sauvegardées"
    - CTA : "J'ai compris, explorer →"
    - CTA secondaire : "Passer au verdict"

2. Si "J'ai compris" → Sections affichées, user peut explorer
3. À la sauvegarde → **Seuls Phase 1 + Verdict persistés en DB**
4. Toast post-save : "Découvrir l'offre complète →"

### Sauvegarde en DB

| User | Choix | Observations sauvegardées |
|------|-------|---------------------------|
| Free | CTA A (Verdict) | ❌ Non |
| Free | CTA B (Découverte) | ❌ Non (local only) |
| Premium | CTA A (Verdict) | ❌ Non |
| Premium | CTA B (Chronique) | ✅ Oui (auto-save) |

### Nommage des sections

- Phase 1 : "L'Entrée en Matière"
- Premier Tercio : "L'Éveil" (Foin)
- Deuxième Tercio : "La Plénitude" (Divin)
- Dernier Tercio : "L'Intensité" (Purin)
- Phase Finale : "Le Dernier Mot"

### Clés JSON en ANGLAIS

Dans le schéma Observation, toutes les clés sont en anglais :
- `firstThird`, `secondThird`, `finalThird` (pas foin/divin/purin)
- `coldDraw` (pas fumageACru)
- `wrapperAspect`, `wrapperColor`, `touch`
- `tastes`, `aromas` (pas gouts/aromes)
- `draw`, `ashNature`, `balance`, `power`, `variety`, `mouthFeel`, `persistence`