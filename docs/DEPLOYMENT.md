# Deployment Guide

## Architecture

| Service | Plateforme | URL |
|---------|------------|-----|
| Frontend (Angular PWA) | Vercel | `https://cigar-club.vercel.app` |
| Backend (NestJS API) | Railway | `https://cigar-platform-api.up.railway.app` |
| Database (PostgreSQL) | Supabase | Déjà configuré |

---

## 1. Déploiement API sur Railway

### Étape 1 : Créer le projet Railway

1. Aller sur [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Sélectionner le repo `cigar-platform`

### Étape 2 : Configurer les variables d'environnement

Dans Railway → Settings → Variables, ajouter :

```env
DATABASE_URL=postgresql://postgres.[ref]:[pwd]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pwd]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
NODE_ENV=production
FRONTEND_URL=https://cigar-club.vercel.app
```

### Étape 3 : Configurer le domaine

1. Railway → Settings → Networking → Generate Domain
2. Noter l'URL générée (ex: `cigar-platform-api.up.railway.app`)

### Vérification

```bash
curl https://cigar-platform-api.up.railway.app/api/health
# Devrait retourner: {"status":"ok","timestamp":"..."}
```

---

## 2. Déploiement Frontend sur Vercel

### Étape 1 : Importer le projet

1. Aller sur [vercel.com](https://vercel.com)
2. "Add New" → "Project" → Importer depuis GitHub
3. Sélectionner le repo `cigar-platform`

### Étape 2 : Configuration automatique

Vercel détecte automatiquement la config via `vercel.json` :
- Build Command: `npx nx build web --configuration=production`
- Output Directory: `dist/apps/web/browser`

### Étape 3 : Mettre à jour l'URL de l'API

**IMPORTANT** : Avant le premier déploiement, mettre à jour l'URL de l'API Railway dans :

```typescript
// apps/web/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-RAILWAY-URL.up.railway.app/api', // ← Remplacer
  // ...
};
```

### Étape 4 : Déployer

```bash
git add .
git commit -m "chore: configure production API URL"
git push
```

Vercel déploie automatiquement à chaque push sur `main`.

---

## 3. Configuration CORS

L'API doit autoriser les requêtes du frontend Vercel.

Dans `apps/api/src/main.ts`, vérifier que CORS est configuré :

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
});
```

---

## 4. Post-déploiement

### Vérifications

- [ ] API Health Check : `https://api-url/api/health`
- [ ] Frontend accessible : `https://app-url`
- [ ] Login fonctionne
- [ ] PWA installable (Chrome DevTools → Application → Manifest)
- [ ] Service Worker actif

### Mise à jour de l'URL dans Railway

Ajouter/modifier la variable `FRONTEND_URL` avec l'URL Vercel finale.

---

## Troubleshooting

### Erreur CORS
- Vérifier que `FRONTEND_URL` dans Railway correspond exactement à l'URL Vercel
- Pas de slash final (`https://app.vercel.app` et non `https://app.vercel.app/`)

### Build échoue sur Vercel
- Vérifier les logs de build
- S'assurer que `npx nx build web` fonctionne localement

### API 502/503 sur Railway
- Vérifier les logs Railway
- Vérifier que `DATABASE_URL` est correct
- Vérifier que Prisma migrate a fonctionné

### PWA non installable
- Vérifier HTTPS (obligatoire pour Service Worker)
- Vérifier manifest dans DevTools → Application