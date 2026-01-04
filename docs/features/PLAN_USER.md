# Feature : Système de Plans (Free / Premium)

## Vue d'ensemble

Cette feature gère les différents niveaux d'accès utilisateur dans l'application. Elle permet de distinguer les utilisateurs gratuits des utilisateurs premium, tout en supportant plusieurs sources d'accès (abonnement, essai, cadeau, beta, etc.).

---

## Phase 1 : Architecture du système de Plans

### Principes

#### Séparation Type / Source
- **Type** : L'accès effectif (`FREE` ou `PREMIUM`)
- **Source** : Comment l'utilisateur a obtenu cet accès

Cette séparation permet de savoir non seulement SI l'utilisateur a accès, mais aussi POURQUOI et JUSQU'À QUAND.

#### Expiration automatique
Les plans avec date d'expiration passent automatiquement en accès FREE. Pas besoin d'action manuelle.

#### Flexibilité admin
L'administrateur peut modifier, prolonger ou upgrader n'importe quel plan à tout moment.

---

### Modèle de données

#### UserPlan

| Champ | Type | Description |
|-------|------|-------------|
| `type` | `'FREE' \| 'PREMIUM'` | Type d'accès effectif |
| `source` | `PlanSource` | Origine de l'accès |
| `startedAt` | `Date` | Début du plan |
| `expiresAt` | `Date \| null` | Expiration (null = jamais) |
| `status` | `'ACTIVE' \| 'EXPIRED' \| 'CANCELLED'` | État du plan |
| `giftedBy` | `string?` | ID de l'admin si GIFT |
| `giftReason` | `string?` | Raison du cadeau/beta |
| `subscriptionId` | `string?` | ID Stripe si SUBSCRIPTION |

#### PlanSource

| Source | Description | Expiration |
|--------|-------------|------------|
| `DEFAULT` | Free par défaut | Jamais |
| `SUBSCRIPTION` | Abonnement payant (Stripe) | Selon abonnement |
| `TRIAL` | Essai gratuit | 7-14 jours |
| `BETA` | Beta tester | Fin de période beta |
| `GIFT` | Offert par admin | Définie par admin |
| `LIFETIME` | Accès à vie | Jamais |

---

### Logique d'accès Premium

Un utilisateur est considéré **Premium** si :
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   isPremium = TRUE si :                                         │
│                                                                 │
│   1. plan.type === 'PREMIUM'                                    │
│      ET                                                         │
│   2. plan.status === 'ACTIVE'                                   │
│      ET                                                         │
│   3. (plan.expiresAt === null OU plan.expiresAt > maintenant)   │
│                                                                 │
│   Sinon → isPremium = FALSE (traité comme FREE)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Service PlanService

#### Responsabilités

| Méthode/Computed | Description |
|------------------|-------------|
| `plan` | Signal du plan utilisateur actuel |
| `isPremium` | Computed : accès premium effectif |
| `isFree` | Computed : inverse de isPremium |
| `planLabel` | Computed : libellé pour l'UI |
| `daysRemaining` | Computed : jours restants avant expiration |
| `isExpiringSoon` | Computed : expire dans moins de 30 jours |

#### Intégration

Le service récupère le plan depuis `AuthStore.user().plan`. Si absent, retourne un plan FREE par défaut.

---

### Nomenclature UI

Les noms internes (`FREE`, `PREMIUM`) restent techniques. L'affichage utilise des noms thématiques :

| Type + Source | Affichage UI |
|---------------|--------------|
| FREE + DEFAULT | "Découverte" |
| PREMIUM + SUBSCRIPTION | "Premium" |
| PREMIUM + TRIAL | "Essai Premium" |
| PREMIUM + BETA | "Premium Beta" |
| PREMIUM + GIFT | "Premium Offert" |
| PREMIUM + LIFETIME | "Premium à Vie" |

---

### Affichage dans Settings

#### Section "Mon abonnement"

Cette section apparaît dans les paramètres utilisateur et affiche l'état actuel du plan.

---

#### FREE (Default)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   💎 Mon abonnement                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Plan actuel : Découverte                              │  │
│   │                                                         │  │
│   │   Accédez à toutes les fonctionnalités avec Premium :   │  │
│   │   • Sauvegarde des analyses chroniques                  │  │
│   │   • Profil aromatique personnalisé                      │  │
│   │   • Statistiques détaillées                             │  │
│   │                                                         │  │
│   │   [Découvrir Premium →]                                 │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### PREMIUM (Subscription)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   💎 Mon abonnement                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Plan actuel : Premium ✨                              │  │
│   │   Abonnement mensuel                                    │  │
│   │                                                         │  │
│   │   Prochain renouvellement : 15 février 2026             │  │
│   │                                                         │  │
│   │   [Gérer mon abonnement →]                              │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### PREMIUM (Trial)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   💎 Mon abonnement                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Plan actuel : Essai Premium                           │  │
│   │                                                         │  │
│   │   ⏳ 5 jours restants                                   │  │
│   │                                                         │  │
│   │   Profitez de toutes les fonctionnalités Premium        │  │
│   │   pendant votre période d'essai.                        │  │
│   │                                                         │  │
│   │   [Passer Premium →]                                    │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### PREMIUM (Beta)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   💎 Mon abonnement                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Plan actuel : Premium Beta ✨                         │  │
│   │                                                         │  │
│   │   🎖️ Merci d'être parmi les premiers !                  │  │
│   │                                                         │  │
│   │   ⏳ Valide jusqu'au 31 décembre 2026                   │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### PREMIUM (Gift)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   💎 Mon abonnement                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Plan actuel : Premium Offert 🎁                       │  │
│   │                                                         │  │
│   │   "Merci pour ta contribution au club !"                │  │
│   │                                                         │  │
│   │   ⏳ Valide jusqu'au 15 mars 2026                       │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### PREMIUM (Lifetime)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   💎 Mon abonnement                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Plan actuel : Premium à Vie ✨                        │  │
│   │                                                         │  │
│   │   🎖️ Early Adopter                                      │  │
│   │                                                         │  │
│   │   Merci pour votre soutien depuis le début !            │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Plan expiré
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   💎 Mon abonnement                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Plan actuel : Découverte                              │  │
│   │                                                         │  │
│   │   ⚠️ Votre accès Premium a expiré le 31 déc. 2026       │  │
│   │                                                         │  │
│   │   Retrouvez vos avantages Premium :                     │  │
│   │   [Renouveler Premium →]                                │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Alerte expiration proche

Quand un plan expire dans moins de 30 jours, afficher une alerte subtile :
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ⏳ Votre accès Premium expire dans 12 jours.                  │
│      [Renouveler →]                                    [✕]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Afficher en haut de page ou dans les settings
- Dismissable (l'utilisateur peut fermer)
- Réapparaît après quelques jours si pas d'action

---

### Points d'entrée Premium

| Endroit | Type | Description |
|---------|------|-------------|
| Settings | Section dédiée | État actuel + CTA upgrade |
| Profil Solo | Note discrète | "En savoir plus →" |
| Flow Tasting | Modal Discovery | Quand l'user veut explorer la chronique |
| Alerte | Banner | Si expiration proche |

---

### Navigation

| Action | Destination |
|--------|-------------|
| "Découvrir Premium" | `/premium` (page pricing) |
| "Passer Premium" | `/premium` |
| "Gérer mon abonnement" | Portail Stripe ou `/settings/subscription` |
| "En savoir plus" | `/premium` |

---

## Phase 2 : Programme Beta

### Règle Beta
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📅 PÉRIODE BETA                                               │
│                                                                 │
│   Début  : 1er Janvier 2026                                     │
│   Fin    : 30 Juin 2026 (23h59)                                 │
│                                                                 │
│   📦 RÉCOMPENSE                                                 │
│                                                                 │
│   Tout utilisateur inscrit pendant la période beta reçoit :     │
│   • Accès Premium gratuit                                       │
│   • Valide jusqu'au 31 Décembre 2026                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Constantes

| Constante | Valeur |
|-----------|--------|
| `BETA_START` | 1er Janvier 2026 |
| `BETA_END` | 1er Juillet 2026 |
| `BETA_PREMIUM_EXPIRES` | 31 Décembre 2026 |

---

### Logique d'attribution
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Nouvel utilisateur s'inscrit                                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Date d'inscription entre BETA_START et BETA_END ?     │  │
│   │                                                         │  │
│   │   OUI → Plan PREMIUM / BETA jusqu'au 31 déc. 2026       │  │
│   │                                                         │  │
│   │   NON → Plan FREE / DEFAULT                             │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Plan attribué aux Beta Users

| Champ | Valeur |
|-------|--------|
| `type` | `PREMIUM` |
| `source` | `BETA` |
| `startedAt` | Date d'inscription |
| `expiresAt` | 31 Décembre 2026 |
| `status` | `ACTIVE` |
| `giftReason` | `Beta Tester` |

---

### Actions admin fin 2026

En Décembre 2026, l'administrateur pourra décider pour chaque beta user :

| Action | Résultat |
|--------|----------|
| **Upgrade LIFETIME** | Accès Premium permanent |
| **Prolonger** | Nouvelle date d'expiration |
| **Ne rien faire** | Expiration automatique → FREE |

---

### Critères suggérés pour LIFETIME

| Critère | Description |
|---------|-------------|
| Activité | X dégustations complétées |
| Feedback | A participé aux retours beta |
| Contribution | A signalé des bugs, proposé des améliorations |
| Ambassadeur | A invité d'autres utilisateurs |

Ces critères sont indicatifs. La décision finale reste à l'administrateur.

---

### Interface Admin (future)

L'interface admin permettra de :

| Fonctionnalité | Description |
|----------------|-------------|
| Voir les users | Liste avec plan actuel, source, expiration |
| Filtrer | Par type, source, statut, expiration proche |
| Modifier un plan | Changer type, source, expiration |
| Actions en masse | Prolonger tous les beta, upgrade sélection |
| Historique | Voir les changements de plan d'un user |

**Note :** L'interface admin sera développée dans une phase ultérieure.

---

## Récap des types de plans
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   FREE                                                          │
│   ├── DEFAULT         Inscription après la beta                 │
│   └── (expiré)        Tout plan premium expiré                  │
│                                                                 │
│   PREMIUM                                                       │
│   ├── SUBSCRIPTION    Abonnement payant (Stripe)                │
│   ├── TRIAL           Essai gratuit (7-14 jours)                │
│   ├── BETA            Beta tester (jusqu'à fin 2026)            │
│   ├── GIFT            Offert par admin (durée définie)          │
│   └── LIFETIME        Accès permanent (early adopters, etc.)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture & Bonnes pratiques

### Respect de l'architecture projet
- Suivre les conventions définies dans `docs/ARCHITECTURE.md`
- Service injectable `PlanService` avec signals
- Computed pour toutes les dérivations (isPremium, planLabel, etc.)

### Icônes
- Utiliser la **directive icon custom** du projet (`IconDirective`)
- Icônes suggérées : `crown`, `gift`, `clock`, `star`, `check`

### UI Components
- Réutiliser les composants UI existants (cards, buttons, alerts)
- Respecter le design system (couleurs gold pour premium)

### Sécurité
- La vérification du plan doit aussi être faite côté backend
- Le frontend affiche l'UI en fonction du plan
- Le backend bloque les actions non autorisées

---

## Priorité d'implémentation

| Priorité | Tâche |
|----------|-------|
| P0 | Modèle UserPlan dans le backend |
| P0 | PlanService avec computed isPremium |
| P0 | Attribution auto plan BETA à l'inscription |
| P1 | Section "Mon abonnement" dans Settings |
| P1 | Affichage conditionnel selon isPremium |
| P2 | Alerte expiration proche |
| P3 | Interface admin |
| P3 | Intégration Stripe (SUBSCRIPTION) |