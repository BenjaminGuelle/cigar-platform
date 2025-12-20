# Claude Code Instructions - Cigar Platform

> **Project**: Cigar club tasting platform (NestJS API + Angular PWA)
> **Context**: [Full Project Details](./docs/dev/PROJECT.md)
> **Stack**: NestJS + Angular 20 + Prisma + Supabase + NX Monorepo

---

## 1. Code Conventions

### TypeScript

📖 **Full Documentation**: [TypeScript Conventions](./docs/claude/TYPESCRIPT_CONVENTIONS.md)

**Critical Rules**:

1. **NEVER use `any`** → Use typed imports from libraries or `unknown` with type guards
2. **ALWAYS type** params, return values, and non-obvious variables
3. **Use `?.` and `??`** for null safety → Avoid `!` unless after explicit validation
4. **Prefer `readonly`** for class properties that don't change
5. **Use `as const`** for constant arrays/objects

**Example**:

```typescript
// ✅ CORRECT
import { User } from '@supabase/supabase-js';
import { Request } from 'express';

async verifyToken(token: string): Promise<User | null> {
  const user: User | null = await this.service.verifyToken(token);

  if (!user) {
    return null;
  }

  return user;
}

private extractHeader(request: Request): string | null {
  return request.headers.authorization?.split(' ')[1] ?? null;
}

// ❌ INCORRECT
async verifyToken(token: any) {  // ❌ any
  const user = await this.service.verifyToken(token);  // ✅ Inferred type OK
  return user;  // ❌ No return type
}

private extractHeader(request: any): string | null {  // ❌ any
  return request.headers.authorization!.split(' ')[1];  // ❌ Dangerous !
}
```

### NestJS Patterns

**Architecture**:
- **Controllers**: Route handling, HTTP status, validation (use DTOs)
- **Services**: Business logic only, no HTTP concerns
- **Guards**: Authentication & authorization
- **Interceptors**: Transform responses, logging
- **Filters**: Global error handling

**DTOs**:

```typescript
// ✅ CORRECT - Use class with decorators
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ example: 'SecurePass123!' })
  password: string;
}

// ❌ INCORRECT - Don't use interfaces for DTOs
export interface SignUpDto {
  email: string;
  password: string;
}
```

**Services**:

```typescript
// ✅ CORRECT
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);  // ✅ readonly

  constructor(
    private readonly supabaseService: SupabaseService,  // ✅ readonly
    private readonly prismaService: PrismaService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    try {
      // Business logic
    } catch (error) {
      // Type-safe error handling with guards
      if (isAuthException(error)) {
        throw error;
      }
      this.logger.error('Unexpected error', error);
      throw new InternalServerErrorException();
    }
  }
}
```

### Angular Patterns

**Components**:

```typescript
// ✅ CORRECT - Standalone component with signals
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (user(); as user) {
      <div>{{ user.displayName }}</div>
    } @else {
      <app-loading />
    }
  `
})
export class UserProfileComponent {
  private userService = inject(UserService);  // ✅ inject()

  user = this.userService.currentUser;  // ✅ signal

  updateProfile(data: UpdateProfileDto): void {
    this.userService.updateProfile(data);
  }
}

// ❌ INCORRECT
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'  // ❌ Should be standalone
})
export class UserProfileComponent implements OnInit {
  user: User;  // ❌ Should use signals

  constructor(private userService: UserService) {}  // ❌ Should use inject()

  ngOnInit(): void {
    // ❌ Old pattern
  }
}
```

**Control Flow**:

```typescript
// ✅ CORRECT - Use @if/@for/@switch
@Component({
  template: `
    @if (isLoading()) {
      <app-spinner />
    } @else if (error()) {
      <app-error [error]="error()" />
    } @else {
      <app-content [data]="data()" />
    }

    @for (item of items(); track item.id) {
      <app-item [item]="item" />
    }

    @switch (status()) {
      @case ('active') { <span class="active">Active</span> }
      @case ('pending') { <span class="pending">Pending</span> }
      @default { <span>Unknown</span> }
    }
  `
})

// ❌ INCORRECT - Don't use *ngIf/*ngFor/*ngSwitch
@Component({
  template: `
    <app-spinner *ngIf="isLoading" />  // ❌ Old syntax
    <div *ngFor="let item of items">   // ❌ Old syntax
      {{ item.name }}
    </div>
  `
})
```

---

## 2. Project Structure

```
apps/
  api/src/          # NestJS backend
    auth/           # Authentication module
    club/           # Club management
    event/          # Event management
    evaluation/     # Evaluation + realtime
    cigar/          # Cigar catalog
    common/         # Shared (filters, interceptors, exceptions)
    app/            # Bootstrap, config, Prisma

  web/src/app/      # Angular PWA
    core/           # Singleton services, guards
    shared/         # Reusable components, pipes, directives
    features/       # Business modules (auth, club, event, etc.)

shared/
  types/src/        # Shared TypeScript types, DTOs, interfaces
  constants/src/    # Shared enums, constants (TASTES, AROMAS)
  utils/src/        # Shared utilities

prisma/
  schema.prisma     # Database schema
  migrations/       # Migration history

docs/
  claude/           # Conventions for Claude Code (prompts)
  dev/              # Developer documentation (human-readable)
```

**Key Files**:
- Database schema: `prisma/schema.prisma`
- API entry: `apps/api/src/main.ts`
- App entry: `apps/web/src/main.ts`
- Shared types: `shared/types/src/index.ts`

---

## 3. Git Workflow

### Commit Format

```
<type>: <emoji> <description> --duration=XX
```

**Rules**:
- **NEVER include**: "Co-Authored-By", "Generated with Claude Code"
- **ALWAYS present** commit message to user for validation BEFORE committing
- **English** description only
- **Max ~80 characters**

**Types & Emojis**:

| Type | Emoji | Usage |
|------|-------|-------|
| `feat` | 🚀 | New feature |
| `fix` | 🔧 | Bug fix |
| `refactor` | ♻️ | Refactoring (no functional change) |
| `chore` | 📦 | Maintenance, dependencies |
| `test` | 🧪 | Add/modify tests |
| `docs` | 📝 | Documentation |
| `hotfix` | 🚨 | Urgent fix |

**Examples**:

```bash
# ✅ CORRECT
feat: 🚀 implement OAuth auto-sync with strict typing --duration=35
fix: 🔧 resolve null pointer in user profile --duration=15
docs: 📝 add TypeScript conventions documentation --duration=25

# ❌ INCORRECT
feat: add oauth  # ❌ No emoji, no duration
Add OAuth support 🚀  # ❌ Capital letter, wrong format

feat: 🚀 implement OAuth auto-sync with strict typing --duration=35

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
# ❌ NEVER include auto-generated mentions
```

### Commit Process

1. **Make changes** using Read/Edit/Write tools
2. **Build & verify**: `npm run api:build` or `npm run build:all`
3. **Stage files**: `git add <files>`
4. **Draft commit** message following format
5. **PRESENT to user** for validation
6. **Commit** only after user approval
7. **Verify**: `git status && git log -1 --stat`

---

## 4. Development Workflow

### Before Editing Files

1. **ALWAYS read** file with Read tool before editing
2. **Understand** existing patterns and conventions
3. **Apply** project conventions (TypeScript, NestJS, Angular)
4. **Verify** types and imports

### Error Handling

**NestJS**:

```typescript
// ✅ CORRECT - Use typed custom exceptions
import { UserNotFoundException, InvalidTokenException } from '../common/exceptions';

async findUser(id: string): Promise<User> {
  const user = await this.prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new UserNotFoundException(id);  // ✅ Typed exception
  }

  return user;
}

// ❌ INCORRECT - Generic errors
async findUser(id: string): Promise<User> {
  const user = await this.prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new Error('User not found');  // ❌ Generic error
  }

  return user;
}
```

**Angular**:

```typescript
// ✅ CORRECT - Use discriminated unions for state
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

@Injectable()
export class UserService {
  private state = signal<LoadingState<User>>({ status: 'idle' });

  async loadUser(id: string): Promise<void> {
    this.state.set({ status: 'loading' });

    try {
      const user = await this.api.getUser(id);
      this.state.set({ status: 'success', data: user });
    } catch (error) {
      this.state.set({
        status: 'error',
        error: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }
}
```

### Testing Before Commit

```bash
# Build projects
npm run api:build
npm run web:build

# Or build all
npm run build:all

# Lint
npm run lint:all

# Format
npm run format
```

---

## 5. Common Commands

| Task | Command |
|------|---------|
| **Dev - API** | `npm run api:serve` → http://localhost:3000 |
| **Dev - Web** | `npm run web:serve` → http://localhost:4200 |
| **Build All** | `npm run build:all` |
| **Build API** | `npm run api:build` |
| **Build Web** | `npm run web:build` |
| **Lint All** | `npm run lint:all` |
| **Format** | `npm run format` |
| **Test All** | `npm run test:all` |
| **Prisma Studio** | `npm run prisma:studio` → http://localhost:5555 |
| **Prisma Migrate** | `npm run prisma:migrate` |
| **Prisma Generate** | `npm run prisma:generate` |
| **NX Graph** | `nx graph` |

---

## 6. Code Quality Principles

### SOLID Principles
- **S**ingle Responsibility: One class/function = one responsibility
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable
- **I**nterface Segregation: Many specific interfaces > one general
- **D**ependency Inversion: Depend on abstractions, not concretions

### DRY (Don't Repeat Yourself)
- Extract common logic into shared functions/services
- Use inheritance/composition when appropriate
- Create reusable components/utilities

### Simplicity Over Complexity
- **NO over-engineering**: Only implement what's needed
- **NO premature optimization**: Optimize when proven necessary
- **NO unnecessary abstraction**: Keep it simple and readable
- **Clean code**: Self-documenting, clear variable names

### Read Before Proposing
- **ALWAYS read** files before editing them
- **Understand** context before making changes
- **Follow** existing patterns in the codebase
- **Verify** your changes don't break existing code

---

## 7. Documentation

### For Claude (Prompts & Conventions)
- [TypeScript Conventions](./docs/claude/TYPESCRIPT_CONVENTIONS.md)
- [NestJS Patterns](./docs/claude/NESTJS_PATTERNS.md) *(to be created)*
- [Angular Patterns](./docs/claude/ANGULAR_PATTERNS.md) *(to be created)*

### For Developers (Human-Readable)
- [Project Context](./docs/dev/PROJECT.md) - Vue d'ensemble projet (FR)
- [Data Model](./docs/dev/DATA_MODEL.md) - Schéma base de données
- [OAuth Setup](./docs/OAUTH_SETUP.md) - Configuration OAuth Google/Apple

### API Documentation
- **Swagger UI**: http://localhost:3000/api/docs
- **Endpoint**: http://localhost:3000/api

---

## 8. Special Patterns

### OAuth Auto-Sync

Users authenticated via OAuth (Google, Apple) are automatically created in Prisma database on first API access via `JwtAuthGuard`.

```typescript
// apps/api/src/auth/guards/jwt-auth.guard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  const supabaseUser: User | null = await this.supabaseService.verifyToken(token);

  // Auto-sync: create user in Prisma if doesn't exist
  let dbUser = await this.prismaService.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!dbUser) {
    dbUser = await this.prismaService.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        displayName:
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.user_metadata?.name ??
          supabaseUser.email?.split('@')[0] ??
          'User',
        avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
      },
    });
  }

  request.user = { ...supabaseUser, dbUser };
  return true;
}
```

### Error Handling Pattern

All errors use standardized custom exceptions with error codes:

```typescript
// Throw typed exceptions
throw new UserNotFoundException(userId);
throw new InvalidTokenException();
throw new EmailAlreadyExistsException(email);

// Global filter transforms to standardized response
{
  "success": false,
  "error": {
    "code": "AUTH_USER_NOT_FOUND",
    "message": "User not found",
    "details": "User with id 123 does not exist",
    "statusCode": 404,
    "timestamp": "2024-12-20T15:30:00.000Z",
    "path": "/api/users/123"
  }
}
```

### Response Transformation

All success responses are wrapped by `TransformInterceptor`:

```typescript
// API returns
return { id: '123', email: 'user@example.com' };

// Client receives
{
  "success": true,
  "data": {
    "id": "123",
    "email": "user@example.com"
  }
}
```

---

## 9. NX Workspace

### Guidelines

- **ALWAYS** run tasks through `nx` (not underlying tools directly)
- Use `nx run`, `nx run-many`, `nx affected` commands
- Leverage NX cache for faster builds

### Common NX Commands

```bash
# Run specific target
nx run api:serve
nx run web:build

# Run for affected projects
nx affected -t build
nx affected -t test
nx affected -t lint

# Visualize dependencies
nx graph
```

### MCP Tools Available

- `nx_workspace` - Get workspace architecture
- `nx_project_details` - Analyze specific project
- `nx_docs` - Get NX documentation (use instead of assuming)

---

## 10. Checklist

### Before Starting Work
- [ ] Read relevant files
- [ ] Understand existing patterns
- [ ] Check TypeScript conventions
- [ ] Review similar code in project

### Before Committing
- [ ] All params/returns typed
- [ ] No `any` usage
- [ ] Null safety (`?.` and `??`)
- [ ] Code builds successfully
- [ ] Follows project conventions
- [ ] Commit message validated by user

### For New Features
- [ ] Create DTOs with validation
- [ ] Add Swagger decorators
- [ ] Handle errors with typed exceptions
- [ ] Write tests (if applicable)
- [ ] Update documentation if needed

---

**Last Updated**: December 20, 2024