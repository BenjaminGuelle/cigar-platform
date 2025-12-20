# Cigar Platform - Contexte Projet

## Vue d'ensemble

Application web de dégustation de cigares pour clubs. Permet aux membres d'un club de participer à des événements de dégustation, évaluer les cigares dégustés, et consulter les évaluations des autres membres en temps réel.

## Fonctionnalités principales

### Pour les membres
- **Rejoindre un club** : Inscription et adhésion à un club de cigares
- **Participer aux events** : S'inscrire aux soirées dégustation organisées par le club
- **Évaluer les cigares** : Noter et commenter les cigares dégustés lors des events
- **Voir les évaluations** : Consulter en temps réel les notes et avis des autres membres
- **Gérer son profil** : Avatar, historique de dégustations, cigares favoris

### Pour les administrateurs
- **Gérer le club** : Informations, membres, paramètres
- **Créer des events** : Organiser des soirées dégustation
- **Ajouter des cigares** : Constituer la cave virtuelle du club
- **Modérer** : Gérer les membres et les contenus

## Scope MVP

Le MVP se concentre sur les entités essentielles :

| Entité | Description | Priorité |
|--------|-------------|----------|
| **Users** | Membres du club avec profil et authentification | ⭐⭐⭐ |
| **Clubs** | Groupes de membres partageant des dégustations | ⭐⭐⭐ |
| **Events** | Soirées dégustation organisées par le club | ⭐⭐⭐ |
| **Cigars** | Cigares créés et évalués par les membres | ⭐⭐⭐ |
| **Evaluations** | Notes et commentaires sur les cigares | ⭐⭐⭐ |

**Fonctionnalités hors MVP** (Phase 2) :
- Gestion avancée des caves à cigares
- Messagerie entre membres
- Recommandations personnalisées
- Export des données
- Statistiques avancées

## Stack Technique

### Frontend

| Techno | Version | Choix |
|--------|---------|-------|
| **Framework** | Angular 20+ | Framework mature, TypeScript natif, PWA intégré |
| **Architecture** | Standalone Components | Nouvelle approche Angular (pas de NgModules) |
| **State Management** | Signals | Réactivité moderne, performance optimale |
| **Control Flow** | `@if/@for/@switch` | Nouvelle syntaxe Angular 17+ |
| **Forms** | Typed Reactive Forms | Type-safety, validation robuste |
| **UI** | À définir | Material, PrimeNG, ou custom |
| **PWA** | Angular PWA | Support offline, installation mobile |

### Backend

| Techno | Version | Choix |
|--------|---------|-------|
| **Framework** | NestJS | Architecture modulaire, TypeScript, DI |
| **API** | REST | CRUD simple, Swagger auto-généré |
| **Validation** | class-validator | Validation déclarative des DTOs |
| **Serialization** | class-transformer | Transformation automatique des réponses |
| **Documentation** | Swagger/OpenAPI | API docs interactive auto-générée |

### Base de données

| Techno | Version | Choix |
|--------|---------|-------|
| **Database** | PostgreSQL (Supabase) | Relationnel, robuste, gratuit en dev |
| **ORM** | Prisma | Type-safe, migrations, excellent DX |
| **Connection Pool** | Supabase Pooler | Optimisation connexions serverless |
| **Realtime** | Supabase Realtime | WebSocket pour évaluations live |

### Authentification

| Techno | Version | Choix |
|--------|---------|-------|
| **Provider** | Supabase Auth | Email + OAuth gratuit |
| **OAuth** | Google, Apple | Authentification sociale |
| **Session** | JWT | Stateless, scalable |
| **Security** | Row Level Security | Sécurité au niveau DB |

### Infrastructure

| Couche | Service | Choix |
|--------|---------|-------|
| **Monorepo** | NX | Gestion multi-apps, cache, affected builds |
| **API Hosting** | Render / Railway / Fly.io | À choisir selon budget |
| **PWA Hosting** | Vercel / Netlify | Déploiement auto, CDN, gratuit |
| **Database** | Supabase | PostgreSQL managé, gratuit jusqu'à 500MB |
| **Files** | Supabase Storage | Avatars, images cigares |

## Architecture Technique

### Monorepo NX

```
cigar-platform/
├── apps/
│   ├── web/                      # Angular PWA
│   │   └── src/app/
│   │       ├── core/             # Services singleton, guards
│   │       ├── shared/           # Components, pipes, directives partagés
│   │       └── features/         # Modules métier
│   │           ├── auth/         # Authentification
│   │           ├── club/         # Gestion clubs
│   │           ├── event/        # Events dégustation
│   │           ├── evaluation/   # Évaluations cigares
│   │           └── cigar/        # Catalogue cigares
│   └── api/                      # NestJS API
│       └── src/
│           ├── auth/             # Auth, JWT, OAuth
│           ├── club/             # CRUD clubs
│           ├── event/            # CRUD events
│           ├── evaluation/       # CRUD evaluations + realtime
│           ├── cigar/            # CRUD cigares
│           ├── common/           # Filters, interceptors, exceptions
│           └── app/              # Bootstrap, config, Prisma
├── shared/
│   ├── types/                    # DTOs, interfaces TypeScript partagés
│   ├── constants/                # TASTES, AROMAS, STRENGTHS enums
│   └── utils/                    # Helpers communs (validators, etc.)
├── prisma/
│   ├── schema.prisma            # Schéma base de données
│   └── migrations/              # Historique migrations
└── docs/
    ├── claude/                  # Conventions pour Claude Code
    ├── dev/                     # Documentation développeurs
    └── OAUTH_SETUP.md          # Guide setup OAuth
```

### Flux de données

```
┌─────────────┐
│  Angular   │ ←─── PWA, Signals, Standalone Components
│     PWA     │
└──────┬──────┘
       │ HTTP/REST + JWT
       ↓
┌─────────────┐
│   NestJS   │ ←─── Controllers, Services, Guards
│     API     │
└──────┬──────┘
       │ Prisma ORM
       ↓
┌─────────────┐
│  Supabase  │ ←─── PostgreSQL + Realtime + Auth
│  Postgres   │
└─────────────┘
```

### Patterns appliqués

- **Frontend** : Smart/Dumb Components, Signals pour state, Services pour business logic
- **Backend** : Layered Architecture (Controller → Service → Repository)
- **Database** : Single source of truth, migrations versionnées
- **Auth** : OAuth + JWT, auto-sync Supabase → Prisma
- **Validation** : DTOs avec class-validator côté API, Reactive Forms côté Angular
- **Error Handling** : Exceptions typées, codes d'erreur standardisés, messages utilisateur

## Workflow de développement

### Environnement local

1. **Installation** :
   ```bash
   npm install
   npm run prisma:generate
   ```

2. **Développement** :
   ```bash
   # Terminal 1 - API
   npm run api:serve

   # Terminal 2 - PWA
   npm run web:serve

   # Terminal 3 - Prisma Studio (optionnel)
   npm run prisma:studio
   ```

3. **Tests** :
   ```bash
   npm run test:all
   npm run lint:all
   ```

4. **Build** :
   ```bash
   npm run build:all
   ```

### Git workflow

- **Branches** : `main` (production), `develop` (dev), feature branches
- **Commits** : Format strict `<type>: <emoji> <description> --duration=XX`
- **Reviews** : Validation avant merge
- **CI/CD** : Tests auto, deploy auto sur merge

## Roadmap

### Phase 1 - MVP (Current)
- ✅ Setup projet NX + NestJS + Angular
- ✅ Setup Prisma + Supabase
- ✅ Authentication (Email + OAuth Google/Apple)
- ✅ Error handling professionnel
- ✅ Response transformation
- ⏳ CRUD Users
- ⏳ CRUD Clubs
- ⏳ CRUD Events
- ⏳ CRUD Cigars
- ⏳ CRUD Evaluations + Realtime
- ⏳ UI/UX basique
- ⏳ PWA setup

### Phase 2 - Amélioration
- Gestion avancée caves
- Recommandations IA
- Statistiques avancées
- Export données
- Notifications push
- UI/UX polish

### Phase 3 - Scale
- Multi-langues
- Performance optimization
- Mobile native (Capacitor)
- Analytics avancés

## Contacts & Ressources

- **Repository** : [À définir]
- **Documentation** : `docs/`
- **API Docs** : `http://localhost:3000/api/docs` (Swagger)
- **Prisma Studio** : `http://localhost:5555`
- **Supabase Dashboard** : [Lien projet Supabase]

---

**Dernière mise à jour** : 20 Décembre 2024