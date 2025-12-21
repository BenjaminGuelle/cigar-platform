# Angular Conventions & Best Practices

## TypeScript Typing Rules

### ✅ ALWAYS Type Explicitly

1. **Function return types** - Always specify
2. **Function parameters** - Always specify
3. **Class properties** - Always specify
4. **Service injections** - `const service: ServiceName = inject(ServiceName)`
5. **HTTP calls results** - `const response: ResponseType = await http.get(...)`
6. **Null/undefined variables** - `const user: User | null = null`
7. **Empty arrays/objects** - `const items: string[] = []`
8. **Complex signals** - `signal<User | null>(null)`

### ❌ Inference OK (Obvious Cases)

1. **Primitive literals** - `const count = 0`, `const name = 'John'`, `const isActive = true`
2. **Destructuring typed objects** - `const { id, name } = user` (if `user` is typed)
3. **Well-typed function results** - If `getUser(): User`, then `const user = getUser()` is OK
4. **Simple intermediate variables** - Short, obvious calculations

### Examples

```typescript
// ❌ Too verbose (unnecessary)
const count: number = 0;
const name: string = 'John';

// ✅ Inference OK
const count = 0;
const name = 'John';

// ❌ Not explicit enough
const authService = inject(AuthService);
const items = [];
const user = signal(null);

// ✅ Explicit typing required
const authService: AuthService = inject(AuthService);
const items: ClubResponseDto[] = [];
const user = signal<User | null>(null);
```

### Golden Rule

**If someone must "guess" the type or make mental effort → TYPE IT**
**If it's instantly obvious → Inference OK**

---

## Private Members

### Use `#` for JavaScript Native Private Fields

Angular modern (v14+) recommends using `#` for true private members instead of TypeScript's `private` keyword.

```typescript
// ✅ Recommended - JavaScript native private
class MyService {
  #privateField = 'value';

  constructor() {
    console.log(this.#privateField); // OK
  }
}

// ❌ Old style - TypeScript private (compile-time only)
class MyService {
  private oldStyleField = 'value';
}
```

### Why `#` is Better

- ✅ Truly private at **runtime** (not just compile-time)
- ✅ JavaScript standard (ES2022)
- ✅ Better performance
- ✅ Recommended by Angular Style Guide

### When to Use `private` Instead

- If you need to mock in tests (harder with `#`)
- Legacy code compatibility

### Rule

**Use `#` by default** for true internal private members.

---

## Other Angular Conventions

### Standalone Components Only

- No NgModules
- Use `imports: [...]` in component decorator

### Signals for State Management

**Always type signals explicitly** with their full type:

```typescript
// ❌ Not explicit enough
#count = signal(0);
#user = signal<User | null>(null);

// ✅ Explicitly typed
#count: WritableSignal<number> = signal(0);
#user: WritableSignal<User | null> = signal<User | null>(null);

// ✅ Readonly signals and computed
readonly currentUser: Signal<User | null> = this.#user.asReadonly();
readonly doubled: Signal<number> = computed(() => this.#count() * 2);
```

**No obvious comments** - Visual separation (blank lines) is enough:

```typescript
// ❌ Unnecessary comments
// Signals for reactive state
#count: WritableSignal<number> = signal(0);

// Computed signals
readonly doubled: Signal<number> = computed(() => this.#count() * 2);

// ✅ Clean - separation speaks for itself
#count: WritableSignal<number> = signal(0);

readonly doubled: Signal<number> = computed(() => this.#count() * 2);
```

### Modern Control Flow

```typescript
// ✅ Use new control flow
@if (user()) {
  <p>{{ user().name }}</p>
}

@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
}

// ❌ Avoid old directives
<p *ngIf="user()">{{ user().name }}</p>
<li *ngFor="let item of items(); trackBy: trackById">{{ item.name }}</li>
```

### Inject Function

```typescript
// ✅ Use inject() function
export class MyComponent {
  #authService: AuthService = inject(AuthService);
  #router: Router = inject(Router);
}

// ❌ Avoid constructor injection
export class MyComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
}
```

### Typed Reactive Forms

Always use typed forms with proper validation.

```typescript
const form = new FormGroup({
  email: new FormControl<string>('', { validators: [Validators.required, Validators.email] }),
  password: new FormControl<string>('', { validators: [Validators.required] }),
});
```

---

## Resources for HTTP Calls (Angular 19+)

### Use `resource()` Instead of RxJS Observables

Angular 19+ recommends using `resource()` for loading data instead of RxJS Observables.

```typescript
import { resource } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ❌ Old way - RxJS Observable + async pipe
export class ClubListComponent {
  #http: HttpClient = inject(HttpClient);
  clubs$: Observable<Club[]> = this.#http.get<Club[]>('/api/clubs');
}

// Template with async pipe
@if (clubs$ | async; as clubs) {
  @for (club of clubs; track club.id) {
    {{ club.name }}
  }
}

// ✅ New way - Resource
export class ClubListComponent {
  #http: HttpClient = inject(HttpClient);

  clubs = resource({
    loader: () => this.#http.get<Club[]>('/api/clubs')
  });
}

// Template - simpler, no async pipe needed
@if (clubs.value(); as clubs) {
  @for (club of clubs; track club.id) {
    {{ club.name }}
  }
}
```

### Benefits of Resources

- ✅ **Signal-based** - More performant, simpler to use
- ✅ **Auto loading/error state** - Built-in `isLoading()`, `error()`, `value()`
- ✅ **No async pipe needed** - Direct access to values
- ✅ **More declarative** - Cleaner, less boilerplate

### Resource with Parameters

```typescript
// Resource that reloads when signal changes
selectedClubId: WritableSignal<string | null> = signal(null);

clubDetails = resource({
  request: () => ({ id: this.selectedClubId() }),
  loader: ({ request }) => {
    if (!request.id) return null;
    return this.#http.get<Club>(`/api/clubs/${request.id}`);
  }
});

// Template
@if (clubDetails.isLoading()) {
  <p>Loading...</p>
}
@if (clubDetails.error()) {
  <p>Error: {{ clubDetails.error() }}</p>
}
@if (clubDetails.value(); as club) {
  <h1>{{ club.name }}</h1>
}
```

### Loading and Error States

```typescript
clubs = resource({
  loader: () => this.#http.get<Club[]>('/api/clubs')
});

// In template
@if (clubs.isLoading()) {
  <p>Loading clubs...</p>
}

@if (clubs.error(); as error) {
  <p>Error loading clubs: {{ error.message }}</p>
}

@if (clubs.value(); as clubList) {
  <div>Found {{ clubList.length }} clubs</div>
  @for (club of clubList; track club.id) {
    <div>{{ club.name }}</div>
  }
}
```

### Rule

**Use `resource()` for all HTTP data loading**. Only use RxJS Observables when you need complex stream operations (debounce, merge, etc.).