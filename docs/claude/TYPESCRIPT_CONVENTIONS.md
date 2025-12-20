# TypeScript Conventions - All Stars

This document defines **senior-level TypeScript conventions** for the Cigar Platform project. These conventions ensure type-safe, maintainable code without runtime bugs.

---

## 1️⃣ Non-Negotiables

### Mandatory Typing

**Rule**: ALL function/method parameters, return values, and non-obvious variables MUST be typed.

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
async verifyToken(token) {  // ❌ Missing param type
  const user = await this.service.verifyToken(token);  // ✅ Inferred type OK
  return user;  // ❌ Missing return type
}

private extractToken(request: any) {  // ❌ any forbidden
  return request.headers.authorization?.split(' ')[1];  // ❌ Missing return type
}
```

### Absolute Ban on `any` Type

**Rule**: NEVER use `any`. Use library types or create custom types.

```typescript
// ✅ CORRECT - Use library types
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

// ✅ If truly unknown - use unknown + type guard
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

### Strict Null Safety

**Rule**: Use `?.` (optional chaining) and `??` (nullish coalescing). Avoid `!` (non-null assertion) unless after explicit validation.

```typescript
// ✅ CORRECT - Explicit null safety
const displayName =
  user.user_metadata?.full_name ??
  user.user_metadata?.name ??
  user.email?.split('@')[0] ??
  'Anonymous';

const avatarUrl = user.user_metadata?.avatar_url ?? null;

// Use ! ONLY after validation
if (!user.email) {
  throw new Error('Email required');
}
// Here we're sure email exists
const domain = user.email!.split('@')[1];

// ❌ INCORRECT - Dangerous non-null assertion
const displayName = user.user_metadata!.full_name!;  // ❌ Crashes if null/undefined
const domain = user.email!.split('@')[1];  // ❌ No validation before

// ❌ INCORRECT - Comparison with null/undefined
if (user.email != null) { }  // ❌ Use !==
if (user.email == undefined) { }  // ❌ Use ===

// ✅ CORRECT
if (user.email !== null && user.email !== undefined) { }
// or simpler with optional chaining
if (user.email) { }
```

---

## 2️⃣ Advanced Type Safety

### Type Guards

**Rule**: Create type guards for narrowing and type-safe error handling.

```typescript
// Type guard for custom exceptions
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

// Usage in error handling
async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
  try {
    const { data, error } = await supabase.auth.signUp(dto);

    if (error) {
      throw new AccountCreationFailedException(error.message);
    }

    return this.mapToAuthResponse(data);
  } catch (error) {
    // Type narrowing with guards
    if (isAuthException(error)) {
      throw error; // Re-throw our typed exception
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

// Type guard for runtime validation
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

  // TypeScript knows entity.id exists and is a string
  console.log(entity.id.toUpperCase());
}
```

### Exhaustiveness Checking

**Rule**: Use `never` in switch statements to ensure all cases are handled. If a new case is added, TypeScript will error.

```typescript
// Union type
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
      // If 'facebook' is added to AuthProvider, TypeScript errors here
      const _exhaustive: never = provider;
      throw new Error(`Unhandled provider: ${_exhaustive}`);
  }
}

// Example with state machine
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

// ✅ Pattern for reducer (Angular/NgRx)
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

**Rule**: Use `as const` for constants and `readonly` for immutable properties.

```typescript
// ✅ CORRECT - as const for config arrays/objects
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

// ✅ Immutable config
export const API_CONFIG = {
  timeout: 5000,
  retries: 3,
  baseUrl: 'http://localhost:3000',
} as const;

// ❌ INCORRECT - Mutable
export const AUTH_PROVIDERS = ['email', 'google', 'apple']; // type: string[]
AUTH_PROVIDERS.push('facebook'); // ❌ Possible but not intended

// ✅ Readonly in classes
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly config = API_CONFIG; // Immutable reference

  constructor(
    private readonly supabaseService: SupabaseService, // readonly injection
    private readonly prismaService: PrismaService,
  ) {}
}

// ✅ Readonly arrays and objects
interface User {
  readonly id: string; // ID should never change
  email: string;
  readonly createdAt: Date;
  readonly roles: readonly string[]; // Immutable array
}

// ❌ INCORRECT
interface User {
  id: string; // Not readonly, could modify ID
  roles: string[]; // Mutable array
}
```

---

## 3️⃣ Architectural Patterns

### Discriminated Unions (State Management)

**Rule**: Use discriminated unions to manage states (loading, success, error) in a type-safe manner.

```typescript
// ✅ CORRECT - Discriminated union for async state
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// Usage in Angular service
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

  // Computed signal with type narrowing
  userData = computed(() => {
    const state = this.userState();
    return state.status === 'success' ? state.data : null;
  });
}

// ✅ Type-safe component rendering
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

// ✅ Pattern for form validation state
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

// Type-safe usage
const result = validateForm(formData);
if (result.isValid) {
  // TypeScript knows errors is null
  await submit(formData);
} else {
  // TypeScript knows errors exists
  displayErrors(result.errors);
}

// ✅ Pattern for API responses
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
  console.log(response.data.displayName); // TypeScript knows data exists
} else {
  console.error(response.error.code, response.error.message);
}
```

### Generic Constraints

**Rule**: Use constraints on generics to guarantee presence of properties/methods.

```typescript
// ✅ CORRECT - Constraint on interface
interface HasId {
  id: string;
}

interface HasTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

// Generic with constraint
function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Generic with multiple constraints
function sortByDate<T extends HasTimestamps>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}

// Type-safe usage
const users: User[] = [/* ... */];
const user = findById(users, '123'); // ✅ User has id
const sorted = sortByDate(users); // ✅ User has createdAt/updatedAt

// ❌ Error if type doesn't have required properties
const names: string[] = ['Alice', 'Bob'];
findById(names, 'Alice'); // ❌ TypeScript error: string doesn't have 'id'

// ✅ Generic base service
abstract class BaseService<T extends HasId> {
  constructor(protected prisma: PrismaService) {}

  async findById(id: string): Promise<T | null> {
    // TypeScript knows T has id
    return this.getModel().findUnique({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.getModel().delete({ where: { id } });
  }

  protected abstract getModel(): any;
}

// Concrete implementation
@Injectable()
export class UserService extends BaseService<User> {
  protected getModel() {
    return this.prisma.user;
  }

  // User-specific methods
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

// ✅ Generic with return type inference
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

// TypeScript infers return type automatically
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

### DTOs, Interfaces and Types

**Rule**: Use the right tool for the right purpose.

```typescript
// ✅ DTOs = class with decorators (validation + serialization)
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

// ✅ Interface = simple data structure (no validation)
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

// ✅ Type = unions, intersections, utility types
export type AuthProvider = 'email' | 'google' | 'apple';

export type UserRole = 'member' | 'admin' | 'owner';

export type UserWithRole = User & { role: UserRole };

export type CreateUserPayload = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateUserPayload = Partial<Pick<User, 'displayName' | 'avatarUrl'>>;

// ✅ When to use what?

// Class DTO - For API requests/responses with validation
export class CreateClubDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  description: string;
}

// Interface - For internal types without validation
export interface ClubWithMembers {
  club: Club;
  members: User[];
  memberCount: number;
}

// Type - For unions and transformations
export type ClubStatus = 'active' | 'archived';
export type ClubWithStatus = Club & { status: ClubStatus };
```

---

## 4️⃣ Advanced Patterns (Optional)

### Branded Types (Type-Safe Primitives)

**Rule**: Use branded types to avoid confusion between primitives of the same type.

```typescript
// ✅ Branded types for IDs
export type UserId = string & { readonly __brand: 'UserId' };
export type ClubId = string & { readonly __brand: 'ClubId' };
export type EventId = string & { readonly __brand: 'EventId' };

// Helper to create branded types
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createClubId(id: string): ClubId {
  return id as ClubId;
}

// Usage in services
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

// ✅ Type-safe - Cannot mix IDs
const userId = createUserId('user-123');
const clubId = createClubId('club-456');

await userService.findById(userId); // ✅ OK
await clubService.findById(clubId); // ✅ OK

await userService.findById(clubId); // ❌ TypeScript error!
await clubService.findById(userId); // ❌ TypeScript error!

// ✅ Other branded type examples
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

### Advanced Utility Types

**Rule**: Use TypeScript utility types to transform types.

```typescript
// ✅ Partial - All fields optional
export class UpdateUserDto implements Partial<CreateUserDto> {
  displayName?: string;
  avatarUrl?: string;
  // email and password excluded
}

// ✅ Required - All fields required
type UserWithRequiredFields = Required<User>;

// ✅ Pick - Select specific fields
export type UserPublicProfile = Pick<User, 'id' | 'displayName' | 'avatarUrl'>;

export type UserCredentials = Pick<User, 'email'> & { password: string };

// ✅ Omit - Exclude specific fields
export type UserWithoutPassword = Omit<User, 'passwordHash'>;

export type CreateUserPayload = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// ✅ Record - Object with typed keys
export type UserRolePermissions = Record<UserRole, string[]>;

const permissions: UserRolePermissions = {
  member: ['read:events', 'create:evaluation'],
  admin: ['read:events', 'create:evaluation', 'manage:club'],
  owner: ['read:events', 'create:evaluation', 'manage:club', 'delete:club'],
};

// ✅ Exclude - Exclude types from union
type AllRoles = 'member' | 'admin' | 'owner' | 'guest';
type AuthenticatedRoles = Exclude<AllRoles, 'guest'>; // 'member' | 'admin' | 'owner'

// ✅ Extract - Extract types from union
type AdminRoles = Extract<AllRoles, 'admin' | 'owner'>; // 'admin' | 'owner'

// ✅ NonNullable - Exclude null and undefined
type MaybeUser = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>; // User

// ✅ ReturnType - Extract return type
async function fetchUser(id: string): Promise<User | null> {
  return null;
}
type FetchUserReturn = ReturnType<typeof fetchUser>; // Promise<User | null>

// ✅ Parameters - Extract parameter types
type FetchUserParams = Parameters<typeof fetchUser>; // [string]

// ✅ Awaited - Extract type from Promise
type UnwrappedUser = Awaited<ReturnType<typeof fetchUser>>; // User | null

// ✅ Advanced combinations
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Example: email optional, rest required
type UserWithOptionalEmail = PartialBy<User, 'email'>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Example: displayName required
type UserWithRequiredName = RequiredBy<User, 'displayName'>;
```

---

## Summary - All Stars Checklist

### ✅ TIER S - Critical
- [ ] All params/returns typed - NEVER `any`
- [ ] Null safety: `?.` and `??` - Avoid `!`
- [ ] Exhaustiveness checking with `never`
- [ ] Type guards for error handling

### ✅ TIER A - Essential
- [ ] `as const` and `readonly` for immutability
- [ ] Discriminated unions for state management
- [ ] Generic constraints for reusable code

### ✅ TIER B - Recommended
- [ ] DTOs (class) vs Interfaces vs Types used correctly
- [ ] Utility types (`Partial`, `Pick`, `Omit`, etc.)
- [ ] Branded types for IDs (optional but powerful)

---

## Real Project Examples

### Authentication Guard (jwt-auth.guard.ts)

```typescript
// ✅ Complete example of best practices
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { User } from '@supabase/supabase-js'; // ✅ Library type
import { Request } from 'express'; // ✅ Library type
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

  async canActivate(context: ExecutionContext): Promise<boolean> { // ✅ Explicit return type
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new InvalidTokenException('No authentication token provided');
    }

    // ✅ Explicit type with null union
    const supabaseUser: User | null = await this.supabaseService.verifyToken(token);

    if (!supabaseUser) {
      throw new InvalidTokenException();
    }

    // ✅ Null safety with ??
    const displayName =
      supabaseUser.user_metadata?.full_name ??
      supabaseUser.user_metadata?.name ??
      supabaseUser.email?.split('@')[0] ??
      'User';

    const avatarUrl = supabaseUser.user_metadata?.avatar_url ?? null;

    request.user = { ...supabaseUser, dbUser };
    return true;
  }

  private extractTokenFromHeader(request: Request): string | null { // ✅ Request type, explicit return
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
// ✅ Example of well-typed service
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'; // ✅ Typed imports

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {} // ✅ readonly

  onModuleInit(): void { // ✅ void return type
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be defined in environment variables'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient { // ✅ Explicit return type
    return this.supabase;
  }

  async verifyToken(token: string): Promise<User | null> { // ✅ Return type with null union
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

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [NestJS TypeScript Best Practices](https://docs.nestjs.com/)
- [Angular TypeScript Guide](https://angular.dev/guide/typescript)