model TastingSession {
id          String   @id @default(uuid()) @db.Uuid
name        String?  // "Soirée chez Ben" (optionnel)
cigarId     String?  @db.Uuid  // Cigare commun (optionnel)
date        DateTime @default(now())
location    String?

// Invitation
inviteCode  String   @unique @default(cuid())  // Code pour rejoindre

// Creator
createdBy   String   @db.Uuid
createdAt   DateTime @default(now())

// Relations
creator     User      @relation("CreatedSessions", fields: [createdBy], references: [id])
cigar       Cigar?    @relation(fields: [cigarId], references: [id])
tastings    Tasting[]

@@index([inviteCode])
@@map("tasting_sessions")
}

model Tasting {
// ... existing fields

sessionId String? @db.Uuid  // ← NOUVEAU : lien vers session groupe

session   TastingSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

@@index([sessionId])
}
```

---

## 🔄 Flow UX "Tasting Groupe"

### Créateur (Premium)
```
1. Click "Nouveau Tasting"
2. Choix "Groupe ✦"
3. [Premium check]
4. Créer session :
    - Nom (optionnel) : "Soirée cigares"
    - Cigare commun (optionnel) : [Autocomplete]
    - Lieu (optionnel)
5. → Génère un code/lien d'invitation
6. Partage aux potes (WhatsApp, SMS, etc.)
7. Commence son propre tasting (lié à la session)
```

### Invité (Free OK)
```
1. Reçoit le lien : cigar.app/session/ABC123
2. Ouvre l'app → "Tu as été invité à une session"
3. Rejoint (compte requis)
4. Fait son tasting (lié à la session)
5. Voit les notes des autres en temps réel ✦
```

---

## 🤔 Question : Qui peut voir les résultats ?

| Option | Accès aux résultats groupe |
|--------|---------------------------|
| **A - Créateur only** | Seul le premium voit l'agrégé |
| **B - Tous les participants** | Tout le monde voit (viral) |
| **C - Hybride** | Participants voient, mais créateur a des stats avancées |

**Ma reco** : Option B pour le viral. Le premium paie pour **créer** la session, pas pour voir les résultats.

---

## 💰 Business Model

| Action | Free | Premium |
|--------|------|---------|
| Tasting solo | ✅ | ✅ |
| Rejoindre une session | ✅ | ✅ |
| **Créer une session** | ❌ | ✅ |
| Observations détaillées | ❌ | ✅ |
| Voir résultats session | ✅ | ✅ |

---

## 📱 Écran résultats Session
```
┌─────────────────────────────────────────┐
│ 👥 Soirée chez Ben                      │
│ 🚬 Cohiba Siglo IV                      │
│ 📍 Chez @ben.music                      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⭐ Note moyenne : 4.2 / 5           │ │
│ │ 👥 4 participants                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Notes individuelles                     │
│ ┌─────────────────────────────────────┐ │
│ │ @ben.music        ⭐ 4.5            │ │
│ │ "Excellent tirage, finale longue"   │ │
│ ├─────────────────────────────────────┤ │
│ │ @jean.smoke       ⭐ 4.0            │ │
│ │ "Un peu serré au début"             │ │
│ ├─────────────────────────────────────┤ │
│ │ @marie.cigare     ⭐ 4.5            │ │
│ │ "Notes de café prononcées"          │ │
│ ├─────────────────────────────────────┤ │
│ │ @paul.aficionado  ⭐ 3.8            │ │
│ │ "Pas mon préféré"                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ 📤 Partager les résultats ]           │
└─────────────────────────────────────────┘