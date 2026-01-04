# Tasting UX Vision : Le Compagnon de Fumée

> **Objectif** : Transformer le tasting d'un "formulaire à remplir" en un "compagnon qui accompagne le fumeur".

---

## 🎯 Philosophie fondamentale

### Ce qu'on veut

| Ressenti visé | Comment |
|---------------|---------|
| **Accompagnement** | L'app pose des questions, l'utilisateur répond s'il veut |
| **Plaisir** | Chaque interaction est optionnelle, jamais obligatoire |
| **Contrôle** | L'utilisateur peut avancer, revenir, sauter à tout moment |
| **Immersion** | Le cigare dicte le rythme, pas l'app |

### Ce qu'on évite

| ❌ Éviter | ✅ Préférer |
|-----------|-------------|
| "Formulaire médical" | "Conversation guidée" |
| "Sélectionnez les arômes" | "Quels goûts te viennent ?" |
| "Champ obligatoire" | Tout est optionnel |
| "Section 3/8" | "L'Éveil — Premier tiers" |
| "Valider" | "Poursuivre" |
| Scroll infini dans 8 sections | Questions une par une avec historique |

---

## 🏗️ Concept : Hybride Chat + Timeline

### Structure de l'écran

```
┌─────────────────────────────────────────┐
│ ← Le Rituel                    ◷ 12:34 │  ← Header sticky
├─────────────────────────────────────────┤
│                                         │
│   ● ─ ● ─ ◉ ─ ○ ─ ○             [3/5]  │  ← Timeline cliquable
│   │   │   │                             │
│  Entrée Présen. Éveil  Plénitude Verdict│
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ✓ Soir • Digestif • Rhum         │  │  ← Résumé (tap = éditer)
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ✓ Colorado • Tendue • Ferme      │  │  ← Résumé (tap = éditer)
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🔥 Premier Tercio : L'Éveil            │  ← Phase active
│                                         │
│  "La fumée est légère, les premiers     │
│   arômes se dessinent..."               │
│                                         │
│  Quels goûts te viennent ?              │  ← Question conversationnelle
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │Boisé│ │Épicé│ │Sucré│ │ + ▼ │       │  ← Sélection rapide
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
│  Une note ?  [___________________]      │  ← Optionnel
│                                         │
│              ┌─────────────────┐        │
│              │  Poursuivre →   │        │  ← Avancer
│              └─────────────────┘        │
│                                         │
│        ↓ Passer au verdict              │  ← Échappatoire toujours visible
│                                         │
└─────────────────────────────────────────┘
```

### Les 3 zones de l'écran

| Zone | Contenu | Comportement |
|------|---------|--------------|
| **Header** | Titre + Timer | Sticky, toujours visible |
| **Timeline** | Dots cliquables + progression | Sticky ou haut de page, navigation rapide |
| **Historique** | Résumés des phases complétées | Scrollable, tap pour éditer |
| **Phase active** | Question en cours | Focus principal, une question à la fois |
| **Footer** | "Poursuivre" + "Passer au verdict" | Toujours visible |

---

## 🔑 Principes de contrôle

### 1. Timeline cliquable

L'utilisateur peut taper sur n'importe quel dot pour naviguer :

```
   ● ─ ● ─ ◉ ─ ○ ─ ○
   │   │   │   │   │
   ↓   ↓   ↓   ↓   ↓
  Tap Tap  ─  Non  Non
  OK  OK      cliquable
```

**Règle** : Un dot est cliquable si :
- La phase est déjà visitée (completed)
- OU c'est la phase courante
- OU c'est la phase juste après la courante

### 2. Résumés éditables

Chaque phase complétée devient un résumé compact :

```
┌───────────────────────────────────┐
│ ✓ Soir • Digestif • Rhum     ✏️  │  ← État normal
└───────────────────────────────────┘

        ↓ Tap sur le résumé ↓

┌───────────────────────────────────┐
│ L'Instant                         │  ← Expanded
│ ┌─────┐ ┌─────┐ ┌─────┐          │
│ │Matin│ │Après│ │●Soir│          │
│ └─────┘ └─────┘ └─────┘          │
│                                   │
│ Les Noces                         │
│ ┌─────┐ ┌─────┐ ┌─────┐          │
│ │●Rhum│ │Whisk│ │Café │          │
│ └─────┘ └─────┘ └─────┘          │
│                                   │
│              [Replier ↑]          │
└───────────────────────────────────┘
```

### 3. Échappatoire permanente

En bas de CHAQUE phase (sauf verdict), toujours afficher :

```
│              ┌─────────────────┐        │
│              │  Poursuivre →   │        │
│              └─────────────────┘        │
│                                         │
│        ↓ Passer au verdict              │
```

L'utilisateur n'est **jamais coincé**. Il peut toujours terminer rapidement.

### 4. Tout est optionnel

- Aucun champ "required"
- "Poursuivre" disponible même sans rien sélectionner
- Les questions sont des invitations, pas des obligations

---

## 🎭 Free vs Premium — Le moment de choix

### Après "L'Entrée en Matière"

```
┌─────────────────────────────────────────┐
│                                         │
│         L'entrée est posée.             │
│                                         │
│    Le décor est planté. Tu peux         │
│    sceller ce moment maintenant,        │
│    ou laisser le cigare te révéler      │
│    ses secrets au fil des tiers...      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │      ↓ Sceller le verdict         │  │  ← Tout le monde
│  │        (2 min)                    │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │    ✦ Explorer la chronique        │  │  ← Premium / Découverte
│  │        (temps du cigare)          │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Ce que l'utilisateur comprend

| Choix | Perception | Ressenti |
|-------|------------|----------|
| **Sceller le verdict** | "J'ai pas le temps, je note l'essentiel" | Rapide, efficace, satisfaisant |
| **Explorer la chronique** | "Je veux vivre l'expérience complète" | Immersif, profond, premium |

**Important** : Pas de mention "Free" ou "Premium". L'utilisateur choisit selon son ENVIE, pas son abonnement.

### Si un utilisateur Free clique "Explorer"

```
┌─────────────────────────────────────────┐
│                                         │
│        ✦ Mode Découverte                │
│                                         │
│    Explore la chronique complète.       │
│    Ces notes ne seront pas              │
│    sauvegardées, mais tu vas            │
│    découvrir la profondeur du rituel.   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      J'ai compris, explorer →     │  │
│  └───────────────────────────────────┘  │
│                                         │
│         Sceller le verdict              │  ← Retour possible
│                                         │
└─────────────────────────────────────────┘
```

**Pas de frustration** :
- Il peut explorer librement
- Il comprend la limite (pas sauvegardé)
- Il voit la valeur de la chronique
- Il peut revenir au verdict à tout moment

---

## 📊 Les deux parcours

### Parcours "Sceller" (Free ou Premium pressé)

```
Timeline:  ● ─ ─ ─ ─ ─ ─ ─ ─ ●
           │                 │
        Entrée            Verdict

Étapes :
1. L'Entrée en Matière (contexte, cigare, moment)
2. Le Verdict (note + commentaire)

Durée : ~2 min
Sauvegardé : ✅ Oui (Phase 1 + Verdict)
```

### Parcours "Explorer" (Premium ou Découverte)

```
Timeline:  ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ●
           │   │   │   │   │   │   │   │
        Entrée │  Cold │ Divin │ Concl │
             Prés.  Éveil   Intensité Verdict

Étapes :
1. L'Entrée en Matière
2. La Présentation (cape, toucher)
3. Le Fumage à Cru (cold draw)
4. Premier Tercio : L'Éveil
5. Deuxième Tercio : La Plénitude
6. Dernier Tercio : L'Intensité
7. La Conclusion (technique, corps)
8. Le Verdict (note + commentaire)

Durée : ~45-60 min (le temps du cigare)
Sauvegardé :
  - Premium : ✅ Tout
  - Découverte (Free) : ✅ Phase 1 + Verdict seulement
```

---

## 💬 Ton conversationnel

### Textes par phase

| Phase | Titre | Accroche |
|-------|-------|----------|
| Entrée | L'Entrée en Matière | "Le décor est posé, le temps s'arrête..." |
| Présentation | La Présentation | "Avant l'allumage, observons..." |
| Fumage à cru | Le Fumage à Cru | "À froid, quels secrets se dévoilent ?" |
| 1er Tercio | L'Éveil | "La fumée est légère, les premiers arômes se dessinent..." |
| 2e Tercio | La Plénitude | "Le cigare est à son apogée. L'équilibre est parfait." |
| 3e Tercio | L'Intensité | "Le caractère s'affirme. La vitole livre ses derniers secrets." |
| Conclusion | La Conclusion | "Le bilan technique de cette expérience..." |
| Verdict | Le Dernier Mot | "Le feu s'éteint, l'expérience est gravée." |

### Questions (pas des labels)

| ❌ Label formulaire | ✅ Question compagnon |
|---------------------|----------------------|
| "Arômes détectés" | "Quels arômes te viennent ?" |
| "Note de dégustation" | "Une note à garder ?" |
| "Intensité" | "Quelle intensité ressens-tu ?" |
| "Commentaire" | "Tes impressions ?" |

---

## 🔄 Comportement du scroll

### Pas de scroll-snap forcé

Le scroll est libre. L'utilisateur contrôle son rythme.

### Focus naturel

La phase active est visuellement distincte :
- Opacité 100%, taille normale
- Les résumés au-dessus sont compacts
- Pas de blur ou d'effet trop marqué

### Auto-scroll doux

Quand l'utilisateur clique "Poursuivre" :
- Scroll smooth vers la phase suivante
- La nouvelle phase arrive au centre/haut de l'écran
- Animation douce (300-400ms)

---

## 🎨 Hiérarchie visuelle

```
┌─────────────────────────────────────────┐
│                                         │
│  Résumés compacts (phases passées)      │  ← Discret, fond zinc-900
│  ─────────────────────────────────────  │
│                                         │
│  ═══════════════════════════════════════│
│                                         │
│  PHASE ACTIVE                           │  ← Prominent, fond zinc-900/80
│  Question principale                    │     Bordure gold subtile
│  Sélections                             │
│  Boutons                                │
│                                         │
│  ═══════════════════════════════════════│
│                                         │
│  (espace pour scroll)                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist de validation

Avant de considérer l'UX comme réussie, vérifier :

- [ ] L'utilisateur peut terminer en 2 min s'il veut (verdict direct)
- [ ] L'utilisateur peut revenir sur n'importe quelle phase passée
- [ ] L'utilisateur n'est jamais bloqué (pas de champs obligatoires)
- [ ] Le choix Free/Premium est clair sans être frustrant
- [ ] Les textes sont conversationnels, pas administratifs
- [ ] La timeline reflète la progression réelle
- [ ] L'échappatoire "Passer au verdict" est toujours visible

---

## 🎯 Objectif final

> L'utilisateur doit avoir l'impression qu'un ami connaisseur
> lui pose des questions pendant qu'il fume, pas qu'il remplit
> un formulaire administratif.

Le cigare dure 45-60 minutes. L'app l'accompagne, suggère,
questionne... mais ne force jamais.

---

## 🎨 Conseils de finition (Rendu Premium)

### A. Transition "Collapse" (Accordéon fluide)

Quand on clique sur "Poursuivre" :
1. La phase actuelle "s'enroule" (réduction hauteur + opacité) → devient résumé compact
2. La nouvelle phase "éclot" (expansion) juste en dessous

```css
/* Technique : grid-template-rows pour transition hauteur parfaite */
.phase-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s ease-out;
}

.phase-content.expanded {
  grid-template-rows: 1fr;
}

.phase-content > div {
  overflow: hidden;
}
```

### B. Variation du ton (Pas répétitif)

Les questions doivent varier légèrement pour garder l'intérêt :

| Phase | Variation 1 | Variation 2 | Variation 3 |
|-------|-------------|-------------|-------------|
| Goûts | "Quels goûts te viennent ?" | "Des notes particulières s'invitent ?" | "Qu'est-ce que ton palais te murmure ?" |
| Arômes | "Quels arômes détectes-tu ?" | "Que te raconte la fumée ?" | "Les parfums du moment ?" |
| Notes | "Une note à garder ?" | "Quelque chose à retenir ?" | "Un détail à graver ?" |

### C. L'échappatoire poétique

"Passer au verdict" n'est PAS un bouton. C'est un lien poétique :

```
Style :
- Couleur : Gris discret (zinc-500)
- Font : Italique
- Icône : Petite bague ou plume
- Texte : "Je connais déjà l'issue, passer au verdict final"
- Position : Bas de l'écran, centré, discret
```

---

## 🏗️ Architecture technique (Store & Signals)

### Signaux requis

```typescript
// TastingStore
activePhase: signal<PhaseId>('entree');
highestVisitedPhase: signal<PhaseId>('entree');
phaseData: signal<Record<PhaseId, PhaseData>>({});

// Computed
history = computed(() => {
  // Retourne les phases complétées avant activePhase
  return this.getCompletedPhases().filter(p => p.index < this.activePhaseIndex());
});

isPhaseAccessible = (phaseId: PhaseId): boolean => {
  const targetIndex = this.getPhaseIndex(phaseId);
  const highestIndex = this.getPhaseIndex(this.highestVisitedPhase());
  return targetIndex <= highestIndex + 1;
};

// Actions
navigateToPhase(phaseId: PhaseId): void {
  if (this.isPhaseAccessible(phaseId)) {
    this.activePhase.set(phaseId);
    if (this.getPhaseIndex(phaseId) > this.getPhaseIndex(this.highestVisitedPhase())) {
      this.highestVisitedPhase.set(phaseId);
    }
  }
}
```

### États d'une phase

```typescript
type PhaseState = 'locked' | 'accessible' | 'active' | 'completed';

getPhaseState(phaseId: PhaseId): PhaseState {
  if (phaseId === this.activePhase()) return 'active';
  if (this.isPhaseCompleted(phaseId)) return 'completed';
  if (this.isPhaseAccessible(phaseId)) return 'accessible';
  return 'locked';
}
```

---

## 🚀 Master Prompt pour Claude Code

```markdown
Claude, on oublie tout le reste. Voici le Master Blueprint : "Le Compagnon de Fumée".

Lis d'abord docs/features/TASTING_UX_VISION.md pour comprendre la philosophie.

## Layout Hybride

Implémente un flux vertical composé de :
1. **Header sticky** : Titre "Le Rituel" + Timer
2. **Timeline cliquable** : Dots représentant les phases, navigation non-linéaire
3. **Historique** : Résumés compacts des phases passées (tap = expand pour éditer)
4. **Phase Active** : La question en cours, une seule à la fois
5. **Footer** : "Poursuivre" + "Passer au verdict" (toujours visible)

## Navigation Non-Linéaire

- La timeline est cliquable pour naviguer vers les phases déjà visitées ou la suivante
- Le footer propose TOUJOURS "Passer au verdict" pour accès direct à la fin
- L'utilisateur n'est jamais bloqué

## Résumés Éditables

- Chaque phase passée = Card/Pill résumée
- Tap dessus = ré-expand pour modification
- Animation Fold/Unfold fluide (grid-template-rows: 0fr → 1fr)

## Wording Conversationnel

- Questions, pas labels : "Quels arômes te viennent ?" au lieu de "Arômes"
- Varier les formulations pour éviter la répétition
- Textes poétiques selon TASTING.md

## Mode Découverte (Free)

- Si isFree et clique sur "Explorer la chronique" → Bottom Sheet "Mode Découverte"
- L'utilisateur peut saisir les données mais elles ne sont PAS envoyées au backend
- Seuls Phase 1 + Verdict sont sauvegardés

## Transitions

- Utilise des animations "Fold/Unfold" pour passage question → résumé
- Scroll smooth vers nouvelle phase
- Pas de scroll-snap forcé

## Feeling visé

Une conversation privée dans un club d'élite. L'app accompagne, suggère, 
questionne... mais ne force jamais.

Let's go All Stars ⭐
```

---

## ✅ Checklist de validation

Avant de considérer l'UX comme réussie, vérifier :

- [ ] L'utilisateur peut terminer en 2 min s'il veut (verdict direct)
- [ ] L'utilisateur peut revenir sur n'importe quelle phase passée
- [ ] L'utilisateur n'est jamais bloqué (pas de champs obligatoires)
- [ ] Le choix Free/Premium est clair sans être frustrant
- [ ] Les textes sont conversationnels, pas administratifs
- [ ] La timeline reflète la progression réelle
- [ ] L'échappatoire "Passer au verdict" est toujours visible
- [ ] Les transitions sont fluides (Fold/Unfold)
- [ ] Les résumés sont éditables (tap = expand)
- [ ] Le ton varie légèrement entre les questions

---

*Vision définie le 3 janvier 2026*