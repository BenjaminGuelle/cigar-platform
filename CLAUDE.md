# CLAUDE.md

# Cigar Platform - Instructions pour Claude Code

## Contexte projet

Application de dégustation de cigares pour clubs. Permet aux membres d'un club de :

- Rejoindre/gérer leur club
- Participer à des events (soirées dégustation)
- Évaluer les cigares dégustés
- Voir les évaluations des autres membres en temps réel

**Scope MVP** : Users, Clubs, Events club, Evaluations, Cigars (créés par users)

## Stack technique

| Couche              | Technologie                                      |
| ------------------- | ------------------------------------------------ |
| **Monorepo**        | NX                                               |
| **Frontend**        | Angular 20+ PWA (standalone components, signals) |
| **Backend**         | NestJS                                           |
| **ORM**             | Prisma                                           |
| **Database**        | PostgreSQL (via Supabase)                        |
| **Auth**            | Supabase Auth (Email + Google + Apple)           |
| **Realtime**        | Supabase Realtime                                |
| **Hébergement API** | Render / Railway / Fly.io                        |
| **Hébergement PWA** | Vercel / Netlify                                 |

## Documentation

- [Modèle de données](./docs/DATA_MODEL.md)
- [Specs fonctionnelles MVP](./docs/FEATURES.md)
- [Conventions TypeScript](./docs/TYPESCRIPT_CONVENTIONS.md)

## Structure du projet (NX)

```
cigar-platform/
├── apps/
│   ├── web/                      # Angular PWA
│   │   └── src/app/
│   │       ├── core/
│   │       ├── shared/
│   │       └── features/
│   │           ├── auth/
│   │           ├── club/
│   │           ├── event/
│   │           ├── evaluation/
│   │           └── cigar/
│   └── api/                      # NestJS
│       └── src/
│           ├── auth/
│           ├── club/
│           ├── event/
│           ├── evaluation/
│           └── cigar/
├── shared/
│   ├── types/                    # Interfaces, DTOs partagés
│   ├── constants/                # TASTES, AROMAS, enums...
│   └── utils/                    # Helpers communs
├── prisma/
├── docs/
└── CLAUDE.md
```

## Commandes de développement

### Installation

```bash
npm install
npm run prisma:generate
```

### Développement

```bash
# Frontend Angular PWA
npm run web:serve          # http://localhost:4200

# Backend NestJS API
npm run api:serve          # http://localhost:3000
```

### Build

```bash
npm run web:build          # Build Angular
npm run api:build          # Build NestJS
npm run build:all          # Build tout
```

### Base de données (Prisma)

```bash
npm run prisma:migrate     # Créer/appliquer migrations
npm run prisma:generate    # Générer client Prisma
npm run prisma:studio      # UI pour explorer la DB
```

### Tests & Qualité

```bash
npm run web:test           # Tests Angular
npm run api:test           # Tests API (e2e)
npm run test:all           # Tous les tests
npm run lint:all           # Lint tout
npm run format             # Format code (Prettier)
```

### NX

```bash
nx affected -t build       # Build projets affectés
nx affected -t test        # Test projets affectés
nx graph                   # Visualiser dépendances
```

## Conventions Angular

- **Standalone components** uniquement (pas de NgModules)
- **Signals** pour le state management
- **Control flow** : `@if`, `@for`, `@switch` (pas de `*ngIf`, `*ngFor`)
- **Inject function** : `inject(Service)` (pas de constructor injection)
- **Typed reactive forms** avec validation

## Conventions TypeScript

> **Documentation complète** : [TYPESCRIPT_CONVENTIONS.md](./docs/TYPESCRIPT_CONVENTIONS.md)

### Règles Absolues

1. **Typage strict** : Params, returns, variables explicites - JAMAIS `any`
2. **Null safety** : Utiliser `?.` et `??` - Éviter `!` sauf validation
3. **Exhaustiveness** : Switch avec `never` pour gérer tous les cas
4. **Immutabilité** : `as const`, `readonly`, pas de mutation

### Patterns Obligatoires

- **Type Guards** : Pour narrowing et error handling
- **Discriminated Unions** : Pour state management (loading, success, error)
- **Generic Constraints** : `<T extends HasId>` pour code réutilisable

### Organisation

- **DTOs** = `class` + decorators (`class-validator`, `class-transformer`)
- **Interfaces** = structures simples
- **Types** = unions/intersections
- **Exports** centralisés via `index.ts`

## Conventions de commit Git

**IMPORTANT** : Ne JAMAIS inclure les mentions auto-générées (Co-Authored-By, Generated with Claude Code).

### Format

```
<type>(#CIG-XXX): <emoji> <description> --duration=XX
```

Sans ticket :

```
<type>: <emoji> <description> --duration=XX
```

### Types et emojis

| Type       | Emoji | Usage                                   |
| ---------- | ----- | --------------------------------------- |
| `feat`     | 🚀    | Nouvelle fonctionnalité                 |
| `fix`      | 🔧    | Correction de bug                       |
| `refactor` | ♻️    | Refactoring sans changement fonctionnel |
| `chore`    | 📦    | Maintenance, dépendances                |
| `test`     | 🧪    | Ajout/modification de tests             |
| `docs`     | 📝    | Documentation                           |
| `hotfix`   | 🚨    | Correction urgente                      |

### Exemples

```
feat(#CIG-001): 🚀 implement cigar evaluation form --duration=45
fix(#CIG-012): 🔧 fix realtime sync on evaluation list --duration=20
chore: 📦 update angular to v19.1 --duration=15
```

### Règles

- Description en anglais, courte et précise
- Maximum ~80 caractères
- **TOUJOURS présenter le commit à l'utilisateur pour validation AVANT de commiter**

## Bonnes pratiques

**Code** :

- Principes SOLID et DRY
- Code clean, moderne, performant
- Simplicité > complexité (pas de sur-ingénierie)
- Relire avant de proposer

**Workflow** :

- Toujours lire les fichiers avant modification
- Utiliser les outils dédiés (Read, Edit, Write) plutôt que bash
- Ne pas créer de fichiers de documentation non sollicités

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
