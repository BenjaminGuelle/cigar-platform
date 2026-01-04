# Feature : Events (Événements Club)

## Vue d'ensemble

Un **Event** est une rencontre organisée par un club : dégustation, repas, soirée sociale, ou mixte. Les membres peuvent confirmer leur présence (RSVP), et chaque participant peut créer sa propre dégustation liée à l'événement.

---

## Objectifs

- Permettre aux clubs d'organiser des événements
- Faciliter la gestion des inscriptions (RSVP)
- Lier les dégustations à un événement pour des stats collectives
- Favoriser la conversion d'invités externes en utilisateurs

---

## Modèle de données

### Event

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `clubId` | UUID | Club organisateur |
| `createdBy` | UUID | Créateur de l'event |
| `title` | String | Titre de l'événement |
| `description` | String? | Description libre |
| `type` | EventType | Type d'événement |
| `visibility` | EventVisibility | Qui peut voir l'event |
| `status` | EventStatus | Statut de l'event |
| `startAt` | DateTime | Date/heure de début |
| `endAt` | DateTime? | Date/heure de fin (optionnel) |
| `location` | String? | Lieu (adresse) |
| `cigarId` | UUID? | Cigare principal (optionnel) |
| `cigarSecret` | Boolean | Masquer le cigare jusqu'à révélation |
| `cigarRevealAt` | DateTime? | Date/heure de révélation auto (null = manuel) |
| `cigarRevealed` | Boolean | Cigare révélé (mode manuel) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de modification |

### EventAttendee

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `eventId` | UUID | Événement |
| `userId` | UUID | Utilisateur invité |
| `response` | RSVPResponse | Réponse (PENDING, YES, NO, MAYBE) |
| `respondedAt` | DateTime? | Date de réponse |
| `invitedBy` | UUID? | Qui a invité (pour externes) |

### Enums

```
EventType:
  - TASTING     (Dégustation)
  - DINNER      (Repas)
  - SOCIAL      (Social, pas de cigare)
  - MIXED       (Repas + Dégustation)

EventVisibility:
  - ALL_MEMBERS   (Visible par tous les membres du club)
  - INVITED_ONLY  (Visible uniquement par les invités)

EventStatus:
  - DRAFT       (Brouillon, non visible)
  - PUBLISHED   (Publié, visible)
  - CANCELLED   (Annulé)
  - COMPLETED   (Terminé)

RSVPResponse:
  - PENDING     (Pas encore répondu)
  - YES         (Participe)
  - NO          (Ne participe pas)
  - MAYBE       (Peut-être)
```

### Modification Tasting (existant)

Ajout du champ optionnel :

| Champ | Type | Description |
|-------|------|-------------|
| `eventId` | UUID? | Lien vers l'événement (optionnel) |

---

## Rôles & Permissions

| Action | Qui peut ? |
|--------|------------|
| Créer un event | Admin club / rôle autorisé |
| Modifier un event | Créateur / Admin club |
| Annuler un event | Créateur / Admin club |
| Supprimer un event | Admin club |
| Révéler le cigare (manuel) | Créateur / Admin club |
| Voir event ALL_MEMBERS | Tous les membres du club |
| Voir event INVITED_ONLY | Uniquement les invités |
| RSVP | Invités (membres ou externes) |
| Créer dégustation liée | Participants (response = YES) |

---

## Flows

### Flow création d'event

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Admin/Créateur                                                │
│   │                                                             │
│   ├── 1. Remplit le formulaire                                  │
│   │      • Titre, description                                   │
│   │      • Type (tasting, dinner, social, mixed)                │
│   │      • Date/heure début (et fin optionnel)                  │
│   │      • Lieu                                                 │
│   │      • Cigare principal (optionnel)                         │
│   │        └── Option "Garder secret"                           │
│   │            └── Révélation auto (date/heure) ou manuelle     │
│   │      • Visibilité (tous membres / invités seulement)        │
│   │                                                             │
│   ├── 2. Si INVITED_ONLY : sélectionne les invités              │
│   │      • Membres du club                                      │
│   │      • Utilisateurs externes (par email/username)           │
│   │                                                             │
│   ├── 3. Enregistre en DRAFT ou publie directement              │
│   │                                                             │
│   └── 4. Publication → Event visible par les concernés          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow RSVP — Event ALL_MEMBERS

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. Créateur publie l'event                                    │
│                    ↓                                            │
│   2. Tous les membres du club voient l'event                    │
│      (sur le profil club, section "Événements")                 │
│                    ↓                                            │
│   3. Chaque membre répond : [Oui] [Peut-être] [Non]             │
│      → EventAttendee créé avec la réponse                       │
│                    ↓                                            │
│   4. Le membre peut changer sa réponse à tout moment            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow RSVP — Event INVITED_ONLY

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. Créateur publie l'event                                    │
│                    ↓                                            │
│   2. Créateur sélectionne les invités                           │
│      → EventAttendee créés avec response = PENDING              │
│                    ↓                                            │
│   3. Seuls les invités voient l'event                           │
│      • Membres → Profil Club, section "Événements"              │
│      • Externes → Profil Solo, section "Invitations"            │
│                    ↓                                            │
│   4. Chaque invité répond : [Oui] [Peut-être] [Non]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow invité externe

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. Créateur invite un externe (email/username)                │
│                    ↓                                            │
│   2. Si l'externe n'a pas de compte :                           │
│      → Reçoit invitation (email/SMS/WhatsApp du président)      │
│      → "Rejoins Cigar Platform pour confirmer ta venue"         │
│                    ↓                                            │
│   3. Externe crée un compte (FREE)                              │
│                    ↓                                            │
│   4. L'event apparaît dans Profil Solo > "Invitations"          │
│                    ↓                                            │
│   5. Externe peut RSVP                                          │
│                    ↓                                            │
│   6. Découvre l'app → potentielle conversion                    │
│      • Rejoint le club                                          │
│      • Passe Premium                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow cigare surprise

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Création de l'event :                                         │
│   ├── cigarId = "Cohiba Siglo VI"                               │
│   ├── cigarSecret = true                                        │
│   └── cigarRevealAt = "2026-01-31 22:30" (ou null = manuel)     │
│                                                                 │
│   Affichage pour les membres :                                  │
│   ├── Avant reveal → "🎁 Cigare surprise"                       │
│   └── Après reveal → "Cohiba Siglo VI"                          │
│                                                                 │
│   Révélation automatique :                                      │
│   └── À cigarRevealAt → cigarRevealed = true                    │
│                                                                 │
│   Révélation manuelle (si cigarRevealAt = null) :               │
│   └── Admin clique "Révéler le cigare"                          │
│       → cigarRevealed = true                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Affichage sur les Profils

### Profil Solo — Section "Invitations"

**Contenu :** Events où l'utilisateur est invité **sans être membre** du club.

**Visibilité :** Masquée si aucune invitation.

**RSVP :** Boutons actionnables (seul endroit pour répondre).

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📬 Invitations                                                │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  🗓️ Sam 15 Fév • 19h00                                  │  │
│   │  Dégustation Dominicains                                │  │
│   │  🏛️ Club Cigare Paris (invité par @jean)                │  │
│   │  📍 Le Fumoir, Paris                                    │  │
│   │                                                         │  │
│   │  [✓ Oui]  [? Peut-être]  [✗ Non]     ← ⏳ En attente    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Profil Club — Section "Événements"

**Contenu :** Events du club (utilisateur est membre).

**RSVP :** Boutons actionnables.

**Créer :** Bouton visible si admin/rôle autorisé.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📅 Événements à venir                                         │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  🗓️ Ven 31 Jan • 20h00                                  │  │
│   │  Soirée Cubains Vintage                                 │  │
│   │  📍 Le Comptoir, Caen                                   │  │
│   │  🚬 🎁 Cigare surprise                                  │  │
│   │                                                         │  │
│   │  👥 8 participants                                      │  │
│   │                                                         │  │
│   │  [✓ Oui]  [? Peut-être]  [✗ Non]     ← ✅ Je participe  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   [Voir tous les événements →]   [+ Créer un événement]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### États RSVP

| État | Affichage | Boutons |
|------|-----------|---------|
| `PENDING` | "⏳ En attente" | Tous actifs, aucun sélectionné |
| `YES` | "✅ Je participe" | "Oui" sélectionné (gold) |
| `MAYBE` | "❓ Peut-être" | "Peut-être" sélectionné |
| `NO` | "❌ Indisponible" | "Non" sélectionné |

---

## Pages & Routes

| Route | Description | Accès |
|-------|-------------|-------|
| `/clubs/:id/events` | Liste events du club | Membres |
| `/clubs/:id/events/new` | Créer un event | Admin/rôle |
| `/clubs/:id/events/:eventId` | Détail event | Invités |
| `/clubs/:id/events/:eventId/edit` | Modifier event | Créateur/Admin |

---

## Page Event — Détail

### Avant l'event

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ← Retour                                    [✏️ Modifier]     │
│                                                                 │
│   🗓️ Vendredi 31 Janvier 2026 — 20h00                          │
│                                                                 │
│   Soirée Cubains Vintage                                        │
│   🏛️ Club Tables et Cigares de Caen                             │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   📍 Lieu                                                       │
│   Le Comptoir, 12 rue du Port, Caen                             │
│                                                                 │
│   🚬 Cigare                                                     │
│   🎁 Surprise !                    [🔓 Révéler] (admin only)    │
│                                                                 │
│   📝 Description                                                │
│   Soirée dédiée aux cigares cubains vintage. Nous               │
│   dégusterons un cigare d'exception des années 90...            │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   👥 Participants (8)                                           │
│                                                                 │
│   ✅ Confirmés (5)                                              │
│   @ben, @jean, @marie, @paul, @sophie                           │
│                                                                 │
│   ❓ Peut-être (2)                                              │
│   @lucas, @anne                                                 │
│                                                                 │
│   ❌ Indisponibles (1)                                          │
│   @pierre                                                       │
│                                                                 │
│   ⏳ En attente (3)                                             │
│   @emma, @louis, @claire                                        │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   Ma réponse                                                    │
│   [✓ Oui]  [? Peut-être]  [✗ Non]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Après l'event — Bilan

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ← Retour                                                      │
│                                                                 │
│   🗓️ Vendredi 31 Janvier 2026 — 20h00          ✅ Terminé      │
│                                                                 │
│   Soirée Cubains Vintage                                        │
│   🏛️ Club Tables et Cigares de Caen                             │
│                                                                 │
│   📍 Le Comptoir, Caen                                          │
│   🚬 Cohiba Siglo VI                                            │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   📊 Bilan de la soirée                                         │
│                                                                 │
│   👥 Participants      8                                        │
│   🚬 Dégustations      6                                        │
│   ⭐ Note moyenne      4.2 / 5                                  │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   🌿 Signature de la soirée                                     │
│                                                                 │
│   Boisé    ████████████████░░░░  78%                            │
│   Épicé    ██████████████░░░░░░  62%                            │
│   Cuir     ████████░░░░░░░░░░░░  35%                            │
│   Terre    ██████░░░░░░░░░░░░░░  28%                            │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   🚬 Dégustations de la soirée                                  │
│                                                                 │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ @ben • Cohiba Siglo VI • ⭐ 4.5                       │     │
│   │ Boisé, Épicé, Cuir                                   │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                 │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ @marie • Cohiba Siglo VI • ⭐ 4.0                     │     │
│   │ Épicé, Terre, Cacao                                  │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                 │
│   [Voir toutes les dégustations →]                              │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   [+ Ajouter ma dégustation]  (si participant et pas encore)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lien Tasting ↔ Event

### Création de dégustation liée

Quand un participant crée une dégustation :
- `context: CLUB`
- `clubId: "xxx"`
- `eventId: "yyy"` ← **NOUVEAU**

### Calcul des stats

| Stats | Filtrage |
|-------|----------|
| Stats Club | Toutes tastings du club (inchangé) |
| Stats Event | Tastings filtrées par `eventId` |

### Endpoint stats event

```
GET /events/:id/stats

Response:
{
  participantsCount: 8,
  tastingsCount: 6,
  averageRating: 4.2,
  aromaSignature: [
    { aroma: "Boisé", percentage: 78 },
    { aroma: "Épicé", percentage: 62 },
    { aroma: "Cuir", percentage: 35 },
    { aroma: "Terre", percentage: 28 }
  ]
}
```

---

## API Endpoints

### Events

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/clubs/:clubId/events` | Liste events du club |
| `POST` | `/clubs/:clubId/events` | Créer un event |
| `GET` | `/events/:id` | Détail event |
| `PATCH` | `/events/:id` | Modifier event |
| `DELETE` | `/events/:id` | Supprimer event |
| `POST` | `/events/:id/publish` | Publier event |
| `POST` | `/events/:id/cancel` | Annuler event |
| `POST` | `/events/:id/complete` | Marquer comme terminé |
| `POST` | `/events/:id/reveal-cigar` | Révéler le cigare |
| `GET` | `/events/:id/stats` | Stats de l'event (bilan) |

### Attendees / RSVP

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/events/:id/attendees` | Liste participants |
| `POST` | `/events/:id/attendees` | Inviter (INVITED_ONLY) |
| `POST` | `/events/:id/rsvp` | Répondre (YES/NO/MAYBE) |
| `DELETE` | `/events/:id/attendees/:userId` | Retirer un invité |

### User

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/users/me/invitations` | Mes invitations (externe) |

---

## Formulaire création/édition

### Champs

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `title` | Text | ✅ | Titre |
| `description` | Textarea | ❌ | Description |
| `type` | Select | ✅ | Type d'event |
| `startAt` | DateTime | ✅ | Date/heure début |
| `endAt` | DateTime | ❌ | Date/heure fin |
| `location` | Text | ❌ | Lieu |
| `cigarId` | Autocomplete | ❌ | Cigare principal |
| `cigarSecret` | Checkbox | ❌ | Garder secret |
| `cigarRevealAt` | DateTime | ❌ | Révélation auto |
| `visibility` | Radio | ✅ | Tous / Invités |

### UX cigare surprise

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🚬 Cigare principal (optionnel)                               │
│   [Rechercher un cigare...                              🔍]     │
│                                                                 │
│   ☑️ Garder le cigare secret jusqu'à révélation                 │
│                                                                 │
│   Révéler le cigare :                                           │
│   ○ Manuellement (pendant la soirée)                            │
│   ● À une date/heure précise :                                  │
│     [31/01/2026]  [22:30]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Empty States

### Profil Solo — Pas d'invitation

Section masquée (pas d'empty state).

### Profil Club — Pas d'event

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📅 Événements à venir                                         │
│                                                                 │
│   Aucun événement prévu pour le moment.                         │
│                                                                 │
│   [+ Créer le premier événement]  (si admin)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Page event — Pas de dégustation

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🚬 Dégustations de la soirée                                  │
│                                                                 │
│   Aucune dégustation enregistrée pour cet événement.            │
│                                                                 │
│   [+ Ajouter ma dégustation]                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Composants UI

| Composant | Description | Réutilisation |
|-----------|-------------|---------------|
| `EventCard` | Card event dans les listes | Profil Solo, Profil Club, Liste events |
| `EventDetail` | Page détail event | Page event |
| `EventForm` | Formulaire création/édition | Create, Edit pages |
| `RSVPButtons` | Boutons Oui/Peut-être/Non | EventCard, EventDetail |
| `AttendeesList` | Liste participants groupée | EventDetail |
| `EventStats` | Bilan de la soirée | EventDetail (après) |
| `CigarReveal` | Affichage cigare + bouton reveal | EventDetail |

---

## MVP vs V2+

| Feature | MVP | V2+ |
|---------|:---:|:---:|
| CRUD Event | ✅ | |
| Types (tasting, dinner, social, mixed) | ✅ | |
| Visibilité (all members / invited only) | ✅ | |
| Infos (titre, desc, lieu, date/heure) | ✅ | |
| Cigare principal + mode secret | ✅ | |
| Reveal auto (datetime) ou manuel | ✅ | |
| RSVP (Yes/No/Maybe) | ✅ | |
| Liste participants | ✅ | |
| Invités externes (doivent créer compte) | ✅ | |
| Section "Invitations" sur Profil Solo | ✅ | |
| Section "Événements" sur Profil Club | ✅ | |
| Lien Tasting → Event | ✅ | |
| Bilan event (participants, dégustations, note) | ✅ | |
| Signature aromatique event | ✅ | |
| Récurrence automatique | | ✅ |
| Photos post-event | | ✅ |
| Notifications push | | ✅ |
| Commentaires sur event | | ✅ |
| Partage event (lien public) | | ✅ |
| Export PDF du bilan | | ✅ |

---

## Priorité d'implémentation

| Phase | Tâches |
|-------|--------|
| **1. Backend** | Modèle Prisma, Enums, Migration |
| **2. Backend** | CRUD Events (endpoints) |
| **3. Backend** | RSVP (endpoints) |
| **4. Backend** | Stats event (endpoint) |
| **5. Frontend** | EventCard component |
| **6. Frontend** | RSVPButtons component |
| **7. Frontend** | Section Events sur Profil Club |
| **8. Frontend** | Section Invitations sur Profil Solo |
| **9. Frontend** | Page liste events |
| **10. Frontend** | Page détail event |
| **11. Frontend** | Page création event |
| **12. Frontend** | Page édition event |
| **13. Frontend** | Bilan event (stats + signature) |
| **14. Integration** | Lier Tasting → Event |

---

## Notes techniques

### Drapeaux (si nécessaire pour terroirs)

Utiliser `flag-icons` :

```bash
npm install flag-icons
```

```scss
// styles.scss
@import 'flag-icons/css/flag-icons.min.css';
```

```html
<span class="fi fi-cu"></span>  <!-- Cuba -->
```

### Signature aromatique

Réutiliser le calcul de `profile-stats` avec filtre `eventId` :

```typescript
// Même logique, filtre différent
getAromaSignature({ eventId: string })
```

### Index recommandés

```prisma
@@index([clubId, status, startAt])
@@index([userId]) // sur EventAttendee
```