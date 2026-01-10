# Spécification - Profil Unifié (User & Club)

## Contexte

Refonte de la page profil pour unifier le profil public (vu par les visiteurs) et le profil privé (vu par le propriétaire) en un seul composant. L'objectif est d'avoir un design plus "social/Instagram-like" et moins "CRM/dashboard".

## Décisions clés

- **Un seul composant** pour user et club, avec un signal `isOwner` pour conditionner les actions, a discuter ensemble, il faut que le header-mobile affiche le button engrenage parametre si isOwner et un + avec action si isowner false.
- **Plus de différence free/premium** sur le profil (la valeur premium est dans l'expérience de dégustation, pas l'affichage)
- **Suppression de la Signature Aromatique** (mal comprise par les utilisateurs) ATTENTIONS bien remove partout et attention au regression, backend frontend, signal store ect.
- **Suppression de la section "Mon Journal" / "Journal du Club"**
- attention, actuellement, un profil publicuser ou club et partageable par url/slug, il faut conserver cette mecanique sur le nouveau composant. 

---

## Structure du profil

### 1. Header

A VALIDR en fonction de isOwner & isPublic et autre. 
| Élément | User                               | Club | Notes |
|---------|------------------------------------|------|-------|
| Avatar | ✅ user (pas pour owner)                            | ✅ Logo club (pas pour membre)| |
| Nom | ✅ | ✅ Nom du club | |
| @handle | ✅                                  | ✅ | |
| Ville | ✅ (optionnel)                      | ✅ (optionnel) | Si renseignée |
| Bio/Punchline | ✅ (optionnel)                      | ✅ (optionnel) | Texte libre court |

### 2. Top bar - Actions contextuelles

| Contexte | Icône droite        | Action                                                                   |
|----------|---------------------|--------------------------------------------------------------------------|
| Mon profil user | ⚙️ engrenage        | → Settings compte                                                        | 
| Mon profil club (admin) | ⚙️ engrenage        | → Settings club                                                          |
| Profil user visité | rien                | -  (future feat friendlist)                                              |
| Profil club visité (non membre) | Bouton + | → Demande adhésion → rejoindre avec un code → partager profil (copy url) |
| Profil club visité (membre non admin) | rien                | → partager profil (copy url)                                             |

### 3. Section Stats (sous le header)

Affichage horizontal, style compteurs sociaux.

| Stat | User | Club            | Comportement |
|------|------|-----------------|--------------|
| Dégustations | ✅ icon + nombre | ✅ icon + nombre        | Non cliquable (scroll vers grille) |
| Cigare préféré | ✅ icon + nom cigare | ✅icon +  nom cigare    | Cliquable → fiche cigare |
| Membres | ❌ | ✅ icon + nombre | Cliquable → page liste membres |

**Cigare préféré** = cigare avec la meilleure note. Si égalité, prendre le plus récent.

### 4. Grille des dégustations

Style Instagram : grille 3 colonnes, scroll vertical.

#### Format des cards

| Élément | Affichage | Notes |
|---------|-----------|-------|
| Photo cigare | ✅ Dominante | Ratio 1:1 ou 4:5. Si pas de photo → image placeholder |
| Nom cigare | ✅ | Overlay bas ou sous la photo |
| Note | ✅ | Étoile + valeur (ex: ★ 4.0) |
| Reste (marque, arômes, date...) | ❌ | Visible au tap sur la card |

#### Visibilité

- **Owner** : voit toutes ses dégustations
- **Visiteur** : voit uniquement les dégustations marquées publiques (conditionné chalmps degustations public User)

#### Interaction

- Tap sur card → navigation vers page détail dégustation
- on affiche les 9 derniers degustations pagginé et scroll affihce les 9 suivantes et ainsi de suite. 

---

## Wireframe ASCII

```
┌─────────────────────────────────────────┐
│ [Avatar]  Nom Complet                   │
│           @handle                       │
│           📍 Ville                      │
│           "Ma punchline ici"            │
├─────────────────────────────────────────┤
│                                         │
│   12           Cohiba          3        │
│   Dégustations   Préféré      Membres   │
│                                (club)   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │     │  │     │  │     │             │
│  │ IMG │  │ IMG │  │ IMG │             │
│  │     │  │     │  │     │             │
│  ├─────┤  ├─────┤  ├─────┤             │
│  │Name │  │Name │  │Name │             │
│  │★ 4  │  │★ 3.5│  │★ 4.5│             │
│  └─────┘  └─────┘  └─────┘             │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │     │  │     │  │     │             │
│  │ IMG │  │ IMG │  │ IMG │             │
│  │     │  │     │  │     │             │
│  ├─────┤  ├─────┤  ├─────┤             │
│  │Name │  │Name │  │Name │             │
│  │★ 3  │  │★ 4  │  │★ 5  │             │
│  └─────┘  └─────┘  └─────┘             │
│                                         │
│                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Considérations techniques

### Composant unifié

```typescript
// Signal pour déterminer le contexte
profileType = input<'user' | 'club'>('user');
profileId = input<string>();

isOwner = computed(() => {
  if (this.profileType() === 'user') {
    return this.profileId() === this.authService.currentUserId();
  }
  // Pour club : vérifier si admin
  return this.clubService.isAdmin(this.profileId());
});

isMember = computed(() => {
  if (this.profileType() === 'club') {
    return this.clubService.isMember(this.profileId());
  }
  return false;
});
```

### Image placeholder

Prévoir une image par défaut pour les dégustations sans photo. Suggestion : image de cigare générique avec overlay sombre, cohérent avec le thème.
Je vais l'ajouter dans public/images/tasting-default.png (a voir si retravailler ou autre) 
---

## Points à clarifier avant implémentation

1. **Animation** : effet au scroll ? Lazy loading des images ?
3. **Empty state** : que montrer si 0 dégustations ? CTA vers nouvelle dégustation ? un cadre vide ? 

---

## Hors scope MVP (features futures)

- Bouton "Ajouter ami" sur profil user visité
- Follow/unfollow
- Notifications