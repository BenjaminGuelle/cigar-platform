# Cigar Platform

Application de dégustation de cigares pour clubs.

## Stack Technique

- **Monorepo**: NX
- **Frontend**: Angular 21 PWA (standalone components, signals)
- **Backend**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Styles**: Tailwind CSS

## Installation

```bash
npm install
```

## Configuration

1. Copier `.env` et remplir les variables d'environnement Supabase
2. Générer le client Prisma:

```bash
npm run prisma:generate
```

## Développement

### Frontend (Angular PWA)

```bash
npm run web:serve
# Ouvre http://localhost:4200
```

### Backend (NestJS API)

```bash
npm run api:serve
# Démarre sur http://localhost:3000
```

### Base de données (Prisma)

```bash
# Créer une migration
npm run prisma:migrate

# Ouvrir Prisma Studio
npm run prisma:studio
```

## Build

```bash
# Build frontend
npm run web:build

# Build backend
npm run api:build

# Build tout
npm run build:all
```

## Tests

```bash
# Tests frontend
npm run web:test

# Tests backend
npm run api:test

# Tests tout
npm run test:all
```

## Lint & Format

```bash
# Lint tout
npm run lint:all

# Format code
npm run format
```

## Structure du Projet

```
cigar-platform/
├── apps/
│   ├── web/                  # Angular PWA
│   └── api/                  # NestJS API
├── shared/
│   ├── types/                # Types partagés
│   ├── constants/            # Constantes (TASTES, AROMAS, etc.)
│   └── utils/                # Utilitaires
└── prisma/                   # Schéma et migrations
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Instructions pour Claude Code
- [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) - Modèle de données
- [docs/FEATURES.md](./docs/FEATURES.md) - Spécifications fonctionnelles
