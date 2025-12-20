# TypeScript Conventions - All Stars

Ce document définit les conventions TypeScript **niveau senior** pour le projet Cigar Platform. Ces conventions garantissent un code type-safe, maintenable et sans bugs runtime.

---

## 1️⃣ Les Non-Négociables

### Typage Obligatoire

**Règle** : Tous les paramètres, retours de fonctions/méthodes, et variables non-évidentes DOIVENT être typés.

```typescript
// ✅ CORRECT
async verifyToken(token: string): Promise<User | null> {
  const supabaseUser: User | null = await this.supabaseService.verifyToken(token);

  if (!supabaseUser) {
    return null;
  }

  return supabaseUser;
}

private extractTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.authorization;
  return authHeader?.split(' ')[1] ?? null;
}

// ❌ INCORRECT
async verifyToken(token) {  // ❌ Manque type paramètre
  const user = await this.service.verifyToken(token);  // ✅ Type inféré, OK
  return user;  // ❌ Manque type retour
}

private extractToken(request: any) {  // ❌ any interdit
  return request.headers.authorization?.split(' ')[1];  // ❌ Manque type retour
}
```

### Interdiction Absolue du Type `any`

**Règle** : JAMAIS utiliser `any`. Utiliser les types des librairies ou créer des types custom.

```typescript
// ✅ CORRECT - Utiliser les types des librairies
import { User } from '@supabase/supabase-js';
import { Request, Response } from 'express';

async canActivate(context: ExecutionContext): Promise<boolean> {
  const request: Request = context.switchToHttp().getRequest();
  const user: User | null = await this.verifyToken(request);
  return user !== null;
}

// ❌ INCORRECT
async canActivate(context: any): Promise<boolean> {  // ❌ any
  const request: any = context.switchToHttp().getRequest();  // ❌ any
  const user: any = await this.verifyToken(request);  // ❌ any
  return user !== null;
}

// ✅ Si vraiment inconnu - utiliser unknown + type guard
function processUnknownData(data: unknown): string {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  if (typeof data === 'object' && data !== null && 'toString' in data) {
    return data.toString();
  }
  return 'Unknown';
}
```

### Null Safety Strict

**Règle** : Utiliser `?.` (optional chaining) et `??` (nullish coalescing). Éviter `!` (non-null assertion) sauf si validation préalable.

```typescript
// ✅ CORRECT - Null safety explicite
const displayName =
  user.user_metadata?.full_name ??
  user.user_metadata?.name ??
  user.email?.split('@')[0] ??
  'Anonymous';

const avatarUrl = user.user_metadata?.avatar_url ?? null;

// Usage de ! UNIQUEMENT après validation
if (!user.email) {
  throw new Error('Email required');
}
// Ici on est sûr que email existe
const domain = user.email!.split('@')[1];

// ❌ INCORRECT - Non-null assertion dangereuse
const displayName = user.user_metadata!.full_name!;  // ❌ Crash si null/undefined
const domain = user.email!.split('@')[1];  // ❌ Pas de validation avant

// ❌ INCORRECT - Comparaison avec null/undefined
if (user.email != null) { }  // ❌ Utiliser !==
if (user.email == undefined) { }  // ❌ Utiliser ===

// ✅ CORRECT
if (user.email !== null && user.email !== undefined) { }
// ou plus simple avec optional chaining
if (user.email) { }
```

---

## 2️⃣ Type Safety Avancé

### Type Guards

**Règle** : Créer des type guards pour le narrowing et l'error handling type-safe.

```typescript
// Type guard pour exceptions custom
function isAuthException(error: unknown): error is AuthException {
  return error instanceof AuthException;
}

function isPrismaError(error: unknown): error is { code: string; meta?: any } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}

// Usage dans error handling
async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
  try {
    const { data, error } = await supabase.auth.signUp(dto);

    if (error) {
      throw new AccountCreationFailedException(error.message);
    }

    return this.mapToAuthResponse(data);
  } catch (error) {
    // Type narrowing avec guards
    if (isAuthException(error)) {
      throw error; // Re-throw notre exception typée
    }

    if (isPrismaError(error)) {
      this.logger.error('Prisma error', error.code, error.meta);
      throw new DatabaseException(error.code);
    }

    // Unknown error
    this.logger.error('Unexpected error', error);
    throw new InternalServerErrorException();
  }
}

// Type guard pour validation runtime
interface HasId {
  id: string;
}

function hasId(obj: unknown): obj is HasId {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as any).id === 'string'
  );
}

// Usage
function processEntity(entity: unknown): void {
  if (!hasId(entity)) {
    throw new Error('Entity must have an id');
  }

  // TypeScript sait que entity.id existe et est un string
  console.log(entity.id.toUpperCase());
}
```

### Exhaustiveness Checking

**Règle** : Utiliser `never` dans les switch pour garantir qu'on gère tous les cas. Si on ajoute un nouveau cas, TypeScript lèvera une erreur.

```typescript
// Type union
type AuthProvider = 'email' | 'google' | 'apple';

// ✅ CORRECT - Exhaustive switch
function getProviderName(provider: AuthProvider): string {
  switch (provider) {
    case 'email':
      return 'Email/Password';
    case 'google':
      return 'Google OAuth';
    case 'apple':
      return 'Apple OAuth';
    default:
      // Si on ajoute 'facebook' à AuthProvider, TypeScript erreur ici
      const _exhaustive: never = provider;
      throw new Error(`Unhandled provider: ${_exhaustive}`);
  }
}

// Exemple avec state machine
type RequestState = 'idle' | 'pending' | 'success' | 'error';

function handleState(state: RequestState): string {
  switch (state) {
    case 'idle':
      return 'Not started';
    case 'pending':
      return 'Loading...';
    case 'success':
      return 'Completed';
    case 'error':
      return 'Failed';
    default:
      const _exhaustive: never = state;
      throw new Error(`Unhandled state: ${_exhaustive}`);
  }
}

// ✅ Pattern pour reducer (Angular/NgRx)
type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> };

function reducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'CLEAR_USER':
      return { ...state, user: null };
    case 'UPDATE_PROFILE':
      return { ...state, user: { ...state.user!, ...action.payload } };
    default:
      const _exhaustive: never = action;
      throw new Error(`Unhandled action: ${_exhaustive}`);
  }
}
```

### Const Assertions & Readonly

**Règle** : Utiliser `as const` pour les constantes et `readonly` pour les propriétés immuables.

```typescript
// ✅ CORRECT - as const pour arrays/objects de config
export const AUTH_PROVIDERS = ['email', 'google', 'apple'] as const;
export type AuthProvider = typeof AUTH_PROVIDERS[number]; // 'email' | 'google' | 'apple'

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// ✅ Config immuable
export const API_CONFIG = {
  timeout: 5000,
  retries: 3,
  baseUrl: 'http://localhost:3000',
} as const;

// ❌ INCORRECT - Mutable
export const AUTH_PROVIDERS = ['email', 'google', 'apple']; // type: string[]
AUTH_PROVIDERS.push('facebook'); // ❌ Possible mais pas voulu

// ✅ Readonly dans les classes
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly config = API_CONFIG; // Référence immuable

  constructor(
    private readonly supabaseService: SupabaseService, // readonly injection
    private readonly prismaService: PrismaService,
  ) {}
}

// ✅ Readonly arrays et objets
interface User {
  readonly id: string; // ID ne doit jamais changer
  email: string;
  readonly createdAt: Date;
  readonly roles: readonly string[]; // Array immuable
}

// ❌ INCORRECT
interface User {
  id: string; // Pas readonly, on pourrait modifier l'ID
  roles: string[]; // Array mutable
}
```

---

## 3️⃣ Patterns Architecturaux

### Discriminated Unions (State Management)

**Règle** : Utiliser des discriminated unions pour gérer les états (loading, success, error) de manière type-safe.

```typescript
// ✅ CORRECT - Discriminated union pour async state
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// Usage dans un service Angular
@Injectable()
export class UserService {
  private userState = signal<AsyncState<User>>({ status: 'idle' });

  async loadUser(id: string): Promise<void> {
    this.userState.set({ status: 'loading' });

    try {
      const user = await this.api.getUser(id);
      this.userState.set({ status: 'success', data: user });
    } catch (error) {
      this.userState.set({
        status: 'error',
        error: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }

  // Computed signal avec type narrowing
  userData = computed(() => {
    const state = this.userState();
    return state.status === 'success' ? state.data : null;
  });
}

// ✅ Rendu component type-safe
@Component({
  template: `
    @switch (userState().status) {
      @case ('idle') { <p>Not loaded</p> }
      @case ('loading') { <app-spinner /> }
      @case ('success') { <app-user [user]="userState().data" /> }
      @case ('error') { <app-error [error]="userState().error" /> }
    }
  `
})
export class UserComponent {
  userState = inject(UserService).userState;
}

// ✅ Pattern pour form validation state
type ValidationState =
  | { isValid: true; errors: null }
  | { isValid: false; errors: Record<string, string[]> };

function validateForm(data: FormData): ValidationState {
  const errors: Record<string, string[]> = {};

  if (!data.email) {
    errors.email = ['Email is required'];
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: null };
}

// Usage type-safe
const result = validateForm(formData);
if (result.isValid) {
  // TypeScript sait que errors est null
  await submit(formData);
} else {
  // TypeScript sait que errors existe
  displayErrors(result.errors);
}

// ✅ Pattern pour API responses
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  try {
    const user = await api.get(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Usage
const response = await fetchUser('123');
if (response.success) {
  console.log(response.data.displayName); // TypeScript sait que data existe
} else {
  console.error(response.error.code, response.error.message);
}
```

### Generic Constraints

**Règle** : Utiliser des constraints sur les generics pour garantir la présence de propriétés/méthodes.

```typescript
// ✅ CORRECT - Constraint sur interface
interface HasId {
  id: string;
}

interface HasTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

// Generic avec constraint
function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Generic avec multiple constraints
function sortByDate<T extends HasTimestamps>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}

// Usage type-safe
const users: User[] = [/* ... */];
const user = findById(users, '123'); // ✅ User a un id
const sorted = sortByDate(users); // ✅ User a createdAt/updatedAt

// ❌ Error si type n'a pas les propriétés requises
const names: string[] = ['Alice', 'Bob'];
findById(names, 'Alice'); // ❌ TypeScript error: string n'a pas 'id'

// ✅ Generic service de base
abstract class BaseService<T extends HasId> {
  constructor(protected prisma: PrismaService) {}

  async findById(id: string): Promise<T | null> {
    // TypeScript sait que T a un id
    return this.getModel().findUnique({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.getModel().delete({ where: { id } });
  }

  protected abstract getModel(): any;
}

// Implémentation concrète
@Injectable()
export class UserService extends BaseService<User> {
  protected getModel() {
    return this.prisma.user;
  }

  // Méthodes spécifiques à User
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

// ✅ Generic avec return type inference
function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// TypeScript infère le type de retour automatiquement
const response = createPaginatedResponse(users, 1, 10, 100);
// response: { data: User[], pagination: { ... } }

// ✅ Generic DTO mapper
class DtoMapper {
  static toDto<T, D>(
    entity: T,
    dtoClass: new () => D,
    transformer: (entity: T) => D
  ): D {
    return transformer(entity);
  }
}

// Usage
const userDto = DtoMapper.toDto(
  user,
  UserDto,
  (u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
  })
);
```

### DTOs, Interfaces et Types

**Règle** : Utiliser le bon outil pour le bon usage.

```typescript
// ✅ DTOs = class avec decorators (validation + serialization)
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SignUpDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ example: 'SecurePassword123!' })
  password: string;
}

export class UserDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  displayName: string;

  @Expose()
  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}

// ✅ Interface = structure de données simple (pas de validation)
export interface AuthResponse {
  user: UserDto;
  session: SessionDto;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ✅ Type = unions, intersections, types utilitaires
export type AuthProvider = 'email' | 'google' | 'apple';

export type UserRole = 'member' | 'admin' | 'owner';

export type UserWithRole = User & { role: UserRole };

export type CreateUserPayload = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateUserPayload = Partial<Pick<User, 'displayName' | 'avatarUrl'>>;

// ✅ Quand utiliser quoi ?

// Class DTO - Pour API requests/responses avec validation
export class CreateClubDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  description: string;
}

// Interface - Pour types internes sans validation
export interface ClubWithMembers {
  club: Club;
  members: User[];
  memberCount: number;
}

// Type - Pour unions et transformations
export type ClubStatus = 'active' | 'archived';
export type ClubWithStatus = Club & { status: ClubStatus };
```

---

## 4️⃣ Patterns Avancés (Optionnel)

### Branded Types (Type-Safe Primitives)

**Règle** : Utiliser des branded types pour éviter les confusions entre primitives du même type.

```typescript
// ✅ Branded types pour IDs
export type UserId = string & { readonly __brand: 'UserId' };
export type ClubId = string & { readonly __brand: 'ClubId' };
export type EventId = string & { readonly __brand: 'EventId' };

// Helper pour créer des branded types
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createClubId(id: string): ClubId {
  return id as ClubId;
}

// Usage dans le service
@Injectable()
export class UserService {
  async findById(userId: UserId): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId as string }
    });
  }
}

@Injectable()
export class ClubService {
  async findById(clubId: ClubId): Promise<Club | null> {
    return this.prisma.club.findUnique({
      where: { id: clubId as string }
    });
  }
}

// ✅ Type-safe - Impossible de mélanger les IDs
const userId = createUserId('user-123');
const clubId = createClubId('club-456');

await userService.findById(userId); // ✅ OK
await clubService.findById(clubId); // ✅ OK

await userService.findById(clubId); // ❌ TypeScript error!
await clubService.findById(userId); // ❌ TypeScript error!

// ✅ Autres exemples de branded types
export type Email = string & { readonly __brand: 'Email' };
export type Url = string & { readonly __brand: 'Url' };
export type JwtToken = string & { readonly __brand: 'JwtToken' };

function sendEmail(to: Email, subject: string, body: string): void {
  // Implementation
}

// Type-safe email validation
function createEmail(value: string): Email {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error('Invalid email format');
  }
  return value as Email;
}

const email = createEmail('user@example.com');
sendEmail(email, 'Hello', 'World'); // ✅ OK

const rawString = 'not-an-email';
sendEmail(rawString, 'Hello', 'World'); // ❌ TypeScript error!
```

### Utility Types Avancés

**Règle** : Utiliser les utility types TypeScript pour transformer les types.

```typescript
// ✅ Partial - Tous les champs optionnels
export class UpdateUserDto implements Partial<CreateUserDto> {
  displayName?: string;
  avatarUrl?: string;
  // email et password exclus
}

// ✅ Required - Tous les champs obligatoires
type UserWithRequiredFields = Required<User>;

// ✅ Pick - Sélectionner certains champs
export type UserPublicProfile = Pick<User, 'id' | 'displayName' | 'avatarUrl'>;

export type UserCredentials = Pick<User, 'email'> & { password: string };

// ✅ Omit - Exclure certains champs
export type UserWithoutPassword = Omit<User, 'passwordHash'>;

export type CreateUserPayload = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// ✅ Record - Objet avec clés typées
export type UserRolePermissions = Record<UserRole, string[]>;

const permissions: UserRolePermissions = {
  member: ['read:events', 'create:evaluation'],
  admin: ['read:events', 'create:evaluation', 'manage:club'],
  owner: ['read:events', 'create:evaluation', 'manage:club', 'delete:club'],
};

// ✅ Exclude - Exclure des types d'une union
type AllRoles = 'member' | 'admin' | 'owner' | 'guest';
type AuthenticatedRoles = Exclude<AllRoles, 'guest'>; // 'member' | 'admin' | 'owner'

// ✅ Extract - Extraire des types d'une union
type AdminRoles = Extract<AllRoles, 'admin' | 'owner'>; // 'admin' | 'owner'

// ✅ NonNullable - Exclure null et undefined
type MaybeUser = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>; // User

// ✅ ReturnType - Extraire le type de retour
async function fetchUser(id: string): Promise<User | null> {
  return null;
}
type FetchUserReturn = ReturnType<typeof fetchUser>; // Promise<User | null>

// ✅ Parameters - Extraire les types des paramètres
type FetchUserParams = Parameters<typeof fetchUser>; // [string]

// ✅ Awaited - Extraire le type d'une Promise
type UnwrappedUser = Awaited<ReturnType<typeof fetchUser>>; // User | null

// ✅ Combinaisons avancées
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Exemple: email optionnel, reste obligatoire
type UserWithOptionalEmail = PartialBy<User, 'email'>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Exemple: displayName obligatoire
type UserWithRequiredName = RequiredBy<User, 'displayName'>;
```

---

## Résumé - Checklist All Stars

### ✅ TIER S - Critique
- [ ] Tous les params/returns typés - JAMAIS `any`
- [ ] Null safety : `?.` et `??` - Éviter `!`
- [ ] Exhaustiveness checking avec `never`
- [ ] Type guards pour error handling

### ✅ TIER A - Essentiel
- [ ] `as const` et `readonly` pour immutabilité
- [ ] Discriminated unions pour state management
- [ ] Generic constraints pour code réutilisable

### ✅ TIER B - Recommandé
- [ ] DTOs (class) vs Interfaces vs Types correctement utilisés
- [ ] Utility types (`Partial`, `Pick`, `Omit`, etc.)
- [ ] Branded types pour IDs (optionnel mais puissant)

---

## Exemples Réels du Projet

### Authentication Guard (jwt-auth.guard.ts)

```typescript
// ✅ Exemple complet de bonnes pratiques
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { User } from '@supabase/supabase-js'; // ✅ Type de la lib
import { Request } from 'express'; // ✅ Type de la lib
import { SupabaseService } from '../supabase.service';
import { PrismaService } from '../../app/prisma.service';
import { InvalidTokenException } from '../../common/exceptions';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name); // ✅ readonly

  constructor(
    private readonly supabaseService: SupabaseService, // ✅ readonly
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> { // ✅ Return type explicite
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new InvalidTokenException('No authentication token provided');
    }

    // ✅ Type explicite avec union null
    const supabaseUser: User | null = await this.supabaseService.verifyToken(token);

    if (!supabaseUser) {
      throw new InvalidTokenException();
    }

    // ✅ Null safety avec ??
    const displayName =
      supabaseUser.user_metadata?.full_name ??
      supabaseUser.user_metadata?.name ??
      supabaseUser.email?.split('@')[0] ??
      'User';

    const avatarUrl = supabaseUser.user_metadata?.avatar_url ?? null;

    request.user = { ...supabaseUser, dbUser };
    return true;
  }

  private extractTokenFromHeader(request: Request): string | null { // ✅ Type Request, return explicite
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
```

### Supabase Service

```typescript
// ✅ Exemple de service bien typé
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'; // ✅ Imports typés

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {} // ✅ readonly

  onModuleInit(): void { // ✅ Return type void
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be defined in environment variables'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient { // ✅ Return type explicite
    return this.supabase;
  }

  async verifyToken(token: string): Promise<User | null> { // ✅ Return type avec union null
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  }
}
```

---

## Ressources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [NestJS TypeScript Best Practices](https://docs.nestjs.com/)
- [Angular TypeScript Guide](https://angular.dev/guide/typescript)