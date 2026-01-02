# Tasting Observation Integration Guide

> **Status**: 🎯 Implementation Template
> **Date**: 2026-01-01
> **Context**: Connecting observation phase components to backend via observation.store

---

## 📋 Summary

This guide explains how to connect observation phase components (`PhasePresentationComponent`, `PhaseColdDrawComponent`, etc.) to the backend using the **observation.store** pattern.

**Key Pattern**: Observation data → Auto-save to backend → Store in `Observation.organoleptic` JSON field

---

## 🏗️ Architecture Overview

### Data Flow

```
┌──────────────────────┐
│  Phase Component     │ (e.g., PhasePresentationComponent)
│  - Emits dataChange  │
└──────────┬───────────┘
           │ { wrapperAspect, wrapperColor, touch }
           ▼
┌──────────────────────┐
│  Tasting Page        │ (TastingPageComponent)
│  - Handles event     │
│  - Calls store       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Observation Store   │ (observation.store.ts)
│  - upsertObservation │
└──────────┬───────────┘
           │ PUT /api/tastings/:tastingId/observations/presentation
           ▼
┌──────────────────────┐
│  Backend API         │ (ObservationController)
│  - Upsert by phase   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Database            │
│  observations.organoleptic = { presentation: {...}, coldDraw: {...} }
└──────────────────────┘
```

---

## 🔌 Step-by-Step Integration Pattern

### Step 1: Import observation store in TastingPageComponent

```typescript
import { injectObservationStore } from '../../../../core/stores/observation.store';

export class TastingPageComponent implements OnInit {
  private observationStore = injectObservationStore();

  // ... rest of component
}
```

### Step 2: Add phase to currentPhase signal type

```typescript
// Before
currentPhase = signal<'quick' | 'finale' | 'confirmation'>('quick');

// After
currentPhase = signal<
  'quick' |
  'presentation' |  // ← Add observation phase
  'cold_draw' |
  'first_third' |
  'second_third' |
  'final_third' |
  'conclusion' |
  'finale' |
  'confirmation'
>('quick');
```

### Step 3: Add phase component to template

```typescript
@case ('presentation') {
  <div class="phase-container">
    <app-phase-presentation
      (back)="goToQuick()"
      (next)="goToColdDraw()"
      (dataChange)="handlePresentationDataChange($event)"
    />
  </div>
}
```

### Step 4: Handle dataChange event

```typescript
/**
 * Handle presentation data change and save to observation store
 *
 * Pattern: Extract data → Call observationStore.upsertObservation → Save to organoleptic JSON
 */
handlePresentationDataChange(data: {
  wrapperAspect: CapeAspect[];
  wrapperColor: CapeColor | null;
  touch: CapeTouch[];
}): void {
  const tastingId = this.tastingIdParam();
  if (!tastingId) return;

  // Debounce auto-save (2s)
  if (this.observationSaveTimeoutId) {
    clearTimeout(this.observationSaveTimeoutId);
  }

  this.saveStatus.set('Sauvegarde...');

  this.observationSaveTimeoutId = setTimeout(async () => {
    try {
      // Upsert observation for 'presentation' phase
      await this.observationStore.upsertObservation.mutate({
        tastingId,
        phase: 'presentation',
        data: {
          organoleptic: {
            presentation: {
              wrapperAspect: data.wrapperAspect,
              wrapperColor: data.wrapperColor,
              touch: data.touch,
            },
          },
        },
      });

      this.saveStatus.set('Sauvegardé');

      setTimeout(() => {
        if (this.saveStatus() === 'Sauvegardé') {
          this.saveStatus.set('');
        }
      }, 2000);
    } catch (error) {
      this.saveStatus.set('Erreur');
    }
  }, 2000);
}
```

### Step 5: Add navigation methods

```typescript
goToPresentation(): void {
  this.currentPhase.set('presentation');
}

goToColdDraw(): void {
  this.currentPhase.set('cold_draw');
}

// ... etc for other phases
```

---

## 📝 Complete Example: Presentation Phase

### Component Setup

```typescript
// tasting-page.component.ts
import { PhasePresentationComponent } from '../../components/phase-presentation/phase-presentation.component';

@Component({
  // ...
  imports: [
    CommonModule,
    PhaseQuickComponent,
    PhasePresentationComponent,  // ← Import phase component
    PhaseFinaleComponent,
    ConfirmationModalComponent,
  ],
})
export class TastingPageComponent implements OnInit {
  private observationStore = injectObservationStore();

  // Debounce timer for observations
  private observationSaveTimeoutId: ReturnType<typeof setTimeout> | null = null;

  currentPhase = signal<
    'quick' | 'presentation' | 'cold_draw' | 'finale' | 'confirmation'
  >('quick');

  // Template
  // Add case for presentation
  @switch (currentPhase()) {
    @case ('quick') {
      <app-phase-quick
        (next)="goToPresentation()"
        (dataChange)="handleQuickDataChange($event)"
      />
    }
    @case ('presentation') {
      <app-phase-presentation
        (back)="goToQuick()"
        (next)="goToColdDraw()"
        (dataChange)="handlePresentationDataChange($event)"
      />
    }
    @case ('finale') {
      <app-phase-finale
        (back)="goFromFinale()"
        (complete)="completeTasting()"
        (dataChange)="handleFinaleDataChange($event)"
      />
    }
  }

  // Handler
  handlePresentationDataChange(data: {
    wrapperAspect: CapeAspect[];
    wrapperColor: CapeColor | null;
    touch: CapeTouch[];
  }): void {
    const tastingId = this.tastingIdParam();
    if (!tastingId) return;

    if (this.observationSaveTimeoutId) {
      clearTimeout(this.observationSaveTimeoutId);
    }

    this.saveStatus.set('Sauvegarde...');

    this.observationSaveTimeoutId = setTimeout(async () => {
      try {
        await this.observationStore.upsertObservation.mutate({
          tastingId,
          phase: 'presentation',
          data: {
            organoleptic: {
              presentation: {
                wrapperAspect: data.wrapperAspect,
                wrapperColor: data.wrapperColor,
                touch: data.touch,
              },
            },
          },
        });

        this.saveStatus.set('Sauvegardé');
        setTimeout(() => {
          if (this.saveStatus() === 'Sauvegardé') {
            this.saveStatus.set('');
          }
        }, 2000);
      } catch (error) {
        this.saveStatus.set('Erreur');
      }
    }, 2000);
  }

  goToPresentation(): void {
    this.currentPhase.set('presentation');
  }

  goToColdDraw(): void {
    this.currentPhase.set('cold_draw');
  }
}
```

---

## 🔁 Pattern for All Observation Phases

### 1. **Presentation**
- **Phase ID**: `'presentation'`
- **Component**: `PhasePresentationComponent`
- **Data**:
  ```typescript
  {
    wrapperAspect: CapeAspect[];
    wrapperColor: CapeColor | null;
    touch: CapeTouch[];
  }
  ```
- **Organoleptic structure**:
  ```json
  {
    "presentation": {
      "wrapperAspect": ["bien_tendue", "grain_fin"],
      "wrapperColor": "maduro",
      "touch": ["ferme", "regulier"]
    }
  }
  ```

### 2. **Cold Draw (Fumage à cru)**
- **Phase ID**: `'cold_draw'`
- **Component**: `PhaseColdDrawComponent`
- **Data**:
  ```typescript
  {
    tastes: FlavorTag[];  // { id: 'boise', intensity: 2 }
    aromas: FlavorTag[];
    notes?: string;
  }
  ```
- **Organoleptic structure**:
  ```json
  {
    "coldDraw": {
      "tastes": [{ "id": "boise", "intensity": 2 }, { "id": "herbace", "intensity": 1 }],
      "aromas": [{ "id": "cafe", "intensity": 3 }],
      "notes": "Notes personnelles..."
    }
  }
  ```

### 3. **First Third (Foin)**
- **Phase ID**: `'first_third'`
- **Component**: `PhaseTierComponent` (reusable)
- **Props**: `tier="first"`, `label="Foin"`, `description="Premier tiers"`
- **Data**:
  ```typescript
  {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  }
  ```
- **Organoleptic structure**:
  ```json
  {
    "firstThird": {
      "tastes": [{ "id": "fruite", "intensity": 2 }],
      "aromas": [{ "id": "floral", "intensity": 1 }]
    }
  }
  ```

### 4. **Second Third (Divin)**
- **Phase ID**: `'second_third'`
- **Component**: `PhaseTierComponent` (reusable)
- **Props**: `tier="second"`, `label="Divin"`, `description="Deuxième tiers"`
- **Data**: Same as First Third
- **Organoleptic structure**:
  ```json
  {
    "secondThird": {
      "tastes": [...],
      "aromas": [...]
    }
  }
  ```

### 5. **Final Third (Purin)**
- **Phase ID**: `'final_third'`
- **Component**: `PhaseTierComponent` (reusable)
- **Props**: `tier="final"`, `label="Purin"`, `description="Troisième tiers"`
- **Data**: Same as First Third
- **Organoleptic structure**:
  ```json
  {
    "finalThird": {
      "tastes": [...],
      "aromas": [...]
    }
  }
  ```

### 6. **Conclusion**
- **Phase ID**: `'conclusion'`
- **Component**: `PhaseConclusionComponent`
- **Data**:
  ```typescript
  {
    draw: 'difficult' | 'correct' | 'too_easy';
    ashNature: 'regular' | 'irregular' | 'clean';
    balance: 'good' | 'rough' | 'smooth';
    terroir: 'strong' | 'noticeable' | 'absent';
    power: number;  // 1-10
    variety: number;  // 1-10
    mouthImpression: ImpressionBouche[];
    persistence: 'short' | 'medium' | 'long';
  }
  ```
- **Organoleptic structure**:
  ```json
  {
    "conclusion": {
      "draw": "correct",
      "ashNature": "regular",
      "balance": "good",
      "terroir": "strong",
      "power": 7,
      "variety": 8,
      "mouthImpression": ["plenitude", "fraicheur"],
      "persistence": "long"
    }
  }
  ```

---

## 🎯 Quick Checklist for Adding a New Observation Phase

- [ ] Import phase component in TastingPageComponent
- [ ] Add phase component to `imports` array
- [ ] Add phase type to `currentPhase` signal union type
- [ ] Add `@case` in template switch statement
- [ ] Create `handleXxxDataChange()` method
- [ ] Call `observationStore.upsertObservation.mutate()` with debounce
- [ ] Create navigation methods (`goToXxx()`)
- [ ] Update back button logic in `handleBack()`
- [ ] Test auto-save functionality

---

## 🔥 Advanced: Reusable Observation Handler

For cleaner code, you can create a reusable handler:

```typescript
private async saveObservation(
  phase: string,
  organoleptData: Record<string, unknown>
): Promise<void> {
  const tastingId = this.tastingIdParam();
  if (!tastingId) return;

  if (this.observationSaveTimeoutId) {
    clearTimeout(this.observationSaveTimeoutId);
  }

  this.saveStatus.set('Sauvegarde...');

  this.observationSaveTimeoutId = setTimeout(async () => {
    try {
      await this.observationStore.upsertObservation.mutate({
        tastingId,
        phase,
        data: {
          organoleptic: {
            [phase]: organoleptData,
          },
        },
      });

      this.saveStatus.set('Sauvegardé');
      setTimeout(() => {
        if (this.saveStatus() === 'Sauvegardé') {
          this.saveStatus.set('');
        }
      }, 2000);
    } catch (error) {
      this.saveStatus.set('Erreur');
    }
  }, 2000);
}

// Usage
handlePresentationDataChange(data): void {
  this.saveObservation('presentation', {
    wrapperAspect: data.wrapperAspect,
    wrapperColor: data.wrapperColor,
    touch: data.touch,
  });
}

handleColdDrawDataChange(data): void {
  this.saveObservation('coldDraw', {
    tastes: data.tastes,
    aromas: data.aromas,
    notes: data.notes,
  });
}
```

---

## 🧪 Testing the Integration

1. **Create a tasting**: Navigate to `/tasting/new?cigarId=<UUID>`
2. **Fill Quick phase**: Date, moment, situation, pairing
3. **Navigate to observation phase**: Click "Approfondir" or navigate manually
4. **Fill observation data**: Select options (e.g., wrapper aspect, color, touch)
5. **Wait 2 seconds**: Auto-save should trigger ("Sauvegarde..." → "Sauvegardé")
6. **Check Network tab**: Verify `PUT /api/tastings/:id/observations/presentation`
7. **Refresh page**: Data should persist (loaded from backend)

---

## 📚 References

- **Observation Store**: `apps/web/src/app/core/stores/observation.store.ts`
- **Backend Controller**: `apps/api/src/observation/observation.controller.ts`
- **Backend Service**: `apps/api/src/observation/observation.service.ts`
- **DTOs**: `apps/api/src/observation/dto/upsert-observation.dto.ts`
- **Phase Components**: `apps/web/src/app/features/tasting/components/phase-*`
- **Constants**: `libs/shared/constants/src/lib/tasting.constants.ts`
- **Main Feature Doc**: `docs/features/TASTING.md`

---

## ✅ Next Steps

1. **Implement Premium flow**: Add all 6 observation phases to TastingPageComponent
2. **Add flow toggle**: Button to switch between Quick (Phase 1 → Finale) and Premium (All phases)
3. **Load existing observations**: When editing a tasting, pre-fill observation data from backend
4. **Add progress indicator**: Show which phases are completed
5. **Add temporal companion**: Suggest current phase based on elapsed time
6. **Implement flavor wheel**: Replace flavor picker with interactive SVG wheel (V1)

---

**Status**: ✅ **Pattern documented and ready for implementation**