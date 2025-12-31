# Claude Code Instructions - Cigar Platform

> **Project**: Cigar club tasting platform (NestJS API + Angular PWA)
> **Stack**: NestJS + Angular 20 + Prisma + Supabase + NX Monorepo

---

## 🎯 MAIN ARCHITECTURE GUIDE

**📖 READ THIS FIRST**: [Complete Architecture Guide](./docs/claude/ARCHITECTURE.md)

This document contains the **complete "ALL STARS ⭐" architecture** including:
- Frontend reactive patterns (Signals + Query Layer)
- Backend data pipeline (Prisma → NestJS → Orval → Angular)
- Code quality standards
- Real-world examples

**Follow this guide strictly for all implementations.**

---

## 📚 Additional Documentation

### For Claude Code (Technical Reference)
- [Architecture Guide](./docs/claude/ARCHITECTURE.md) - **Main reference**
- [TypeScript Conventions](./docs/claude/TYPESCRIPT_CONVENTIONS.md) - Detailed typing rules
- [NestJS Patterns](./docs/claude/NESTJS_PATTERNS.md) - Backend patterns
- [Permissions System](./docs/claude/PERMISSIONS.md) - Authorization patterns

### For Developers (Human-Readable)
- [Project Context](./docs/dev/PROJECT.md) - Project overview (FR)
- [Data Model](./docs/dev/DATA_MODEL.md) - Database schema
- [OAuth Setup](./docs/OAUTH_SETUP.md) - OAuth configuration

---

## 🚀 Quick Start Commands

| Task | Command |
|------|---------|
| Dev - API | `npm run api:serve` → http://localhost:3000 |
| Dev - Web | `npm run web:serve` → http://localhost:4200 |
| Build All | `npm run build:all` |
| Generate API Client | `npm run generate:api` |
| Prisma Studio | `npm run prisma:studio` |
| API Docs | http://localhost:3000/api/docs |

---

## ⚡ Critical Rules (TL;DR)

1. **Stores accept getters**: `(idGetter: () => string)`
2. **Components pass getters**: `() => this.id()`
3. **Never `inject()` in `computed()`** → Causes NG0203 error
4. **Always invalidate cache** after mutations
5. **Use `computed()` with fallbacks**: `data() ?? []`
6. **Zero `any`, zero `!`, zero `console.log`**
7. **Run `npm run generate:api`** after backend changes

---

## 🔧 Git Commit Format

```
<type>: <emoji> <description> --duration=XX
```

**Example**: `feat: 🚀 implement reactive getter pattern --duration=45`

**Types**: `feat` 🚀 | `fix` 🔧 | `refactor` ♻️ | `chore` 📦 | `test` 🧪 | `docs` 📝

---

## 📝 Before Each Commit

- [ ] Code builds: `npm run build:all`
- [ ] All types explicit (no `any`)
- [ ] No `!` non-null assertions
- [ ] No `console.log`
- [ ] Commit message follows format
- [ ] User approved commit message

---

**For complete implementation details, examples, and troubleshooting**:
👉 **[READ THE ARCHITECTURE GUIDE](./docs/claude/ARCHITECTURE.md)**

## Conventions Backend - Validation

### Sécurité des champs texte : @IsSecureText()

Tous les champs texte libres saisis par l'utilisateur et affichés dans l'UI doivent utiliser le decorator `@IsSecureText()` :
```typescript
import { IsSecureText } from '../common/validators/secure-text.validator';

@IsSecureText()
@IsString()
name: string;
```

**Champs à protéger :**
- `name`, `description`, `bio`, `comment`, `notes`, `message`, `reason`
- Tout champ texte libre affiché dans l'UI

**Champs à NE PAS protéger :**
- `email` → `@IsEmail()`
- `username`, `slug` → Pattern strict `@Matches()`
- `password` → Jamais affiché
- `UUIDs` → `@IsUUID()`
- `urls` → `@IsUrl()` + whitelist
- `enums` → `@IsEnum()`
- Valeurs numériques, dates, booleans