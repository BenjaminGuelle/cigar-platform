# Permissions & Roles System

This document describes the permission system for the Cigar Platform.

## Role Types

The platform uses **two separate role systems**:

### 1. Project Roles (App-level)

**Enum:** `Role` (in User model)

```typescript
enum Role {
  ADMIN      // Project admin - full control
  MODERATOR  // Project moderator - manage users and content
  USER       // Standard user (default)
}
```

**Hierarchy:** `ADMIN > MODERATOR > USER`

**Storage:** `User.role` field in database

**Scope:** Global app permissions

---

### 2. Club Roles (Club-level)

**Enum:** `ClubRole` (in ClubMember model)

```typescript
enum ClubRole {
  admin   // Club admin - full control over the club
  member  // Club member - basic club access
}
```

**Storage:** `ClubMember.role` field (join table between User and Club)

**Scope:** Per-club permissions

**Important:** A user can have different roles in different clubs:
- Admin of "Cigars Paris" + Member of "Cigars Lyon"

---

## Permission Rules by Entity

### Club Entity

| Route | Method | Permission |
|-------|--------|------------|
| `/clubs` | GET | Any authenticated user |
| `/clubs/:id` | GET | Any authenticated user |
| `/clubs` | POST | Any authenticated user → auto admin of created club |
| `/clubs/:id` | PATCH | Club admin OR Project admin/moderator |
| `/clubs/:id` | DELETE | Club admin OR Project admin/moderator |

**Create Club Flow:**
1. User creates a club (POST /clubs)
2. Club created in DB
3. ClubMember created automatically with `role = admin`
4. User is now admin of their club

**Update/Delete Club:**
- Allowed if user is admin of THIS specific club
- OR user has Project Role = ADMIN or MODERATOR

---

## Guards Implementation

### JwtAuthGuard

**Location:** `apps/api/src/auth/guards/jwt-auth.guard.ts`

**Purpose:** Verify JWT token and load user

**Applied to:** All protected routes (controller-level or route-level)

**What it does:**
1. Extracts JWT from Authorization header
2. Verifies token with Supabase
3. Loads or creates user in Prisma DB
4. Attaches user to `request.user.dbUser`

**User object available after guard:**
```typescript
request.user.dbUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;  // ADMIN, MODERATOR, or USER
  // ...
}
```

---

### RolesGuard

**Location:** `apps/api/src/common/guards/roles.guard.ts`

**Purpose:** Check if user has required Project Role

**Usage:**
```typescript
@Roles(Role.ADMIN, Role.MODERATOR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin-only')
adminRoute() { }
```

**Logic:**
- Reads required roles from `@Roles()` decorator
- Checks if `user.role` is in the required roles list
- Returns 403 if user doesn't have permission

---

### ClubRolesGuard

**Location:** `apps/api/src/common/guards/club-roles.guard.ts`

**Purpose:** Check if user can modify a specific club

**Usage:**
```typescript
@UseGuards(JwtAuthGuard, ClubRolesGuard)
@Patch(':id')
updateClub() { }
```

**Logic:**
1. Extract `clubId` from `request.params.id`
2. Check if user is Project admin/moderator → Allow
3. Otherwise, query ClubMember table
4. Check if user has `ClubRole.admin` for this club
5. Returns 403 if user doesn't have permission

**SQL equivalent:**
```sql
SELECT * FROM club_members
WHERE club_id = :clubId
  AND user_id = :userId
  AND role = 'admin'
```

---

## Examples

### Example 1: Standard User Creates Club

**User:** `user@example.com` (Role = USER)

**Action:** POST /clubs `{ name: "Cigars Paris" }`

**Result:**
1. Club created with `id = club-123`
2. ClubMember created: `{ clubId: club-123, userId: user-id, role: admin }`
3. User can now UPDATE/DELETE club-123

---

### Example 2: User Tries to Delete Another User's Club

**User A:** `userA@example.com` (Role = USER)
- Admin of "Cigars Paris" (club-123)

**User B:** `userB@example.com` (Role = USER)
- Admin of "Cigars Lyon" (club-456)

**Action:** User B tries DELETE /clubs/club-123

**Result:** 403 Forbidden
- User B is not admin of club-123
- User B is not Project admin/moderator

---

### Example 3: Project Admin Deletes Any Club

**User:** `admin@example.com` (Role = ADMIN)

**Action:** DELETE /clubs/club-123

**Result:** 200 OK
- Project ADMIN can delete any club
- ClubRolesGuard allows Project admins

---

### Example 4: Moderator Updates Any Club

**User:** `moderator@example.com` (Role = MODERATOR)

**Action:** PATCH /clubs/club-123 `{ name: "New Name" }`

**Result:** 200 OK
- Project MODERATOR can update any club
- ClubRolesGuard allows Project moderators

---

## Adding Permissions to New Routes

### Step-by-step:

1. **Protect route with JwtAuthGuard** (always required for authenticated routes)
   ```typescript
   @UseGuards(JwtAuthGuard)
   @Get('my-route')
   ```

2. **Add Project Role restriction if needed**
   ```typescript
   @Roles(Role.ADMIN)
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Get('admin-only')
   ```

3. **Add Club-specific restriction if needed**
   ```typescript
   @UseGuards(JwtAuthGuard, ClubRolesGuard)
   @Patch(':id')
   updateClub(@Param('id') id: string) { }
   ```

4. **Document permissions in Swagger**
   ```typescript
   @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
   ```

---

## Future Considerations (Post-MVP)

### Multi-role Support

Currently: One role per user/member
```typescript
user.role = Role.USER  // Single role
clubMember.role = ClubRole.admin  // Single role
```

Future: Array of roles
```typescript
user.roles = [Role.USER, Role.MODERATOR]  // Multiple roles
clubMember.roles = [ClubRole.admin, ClubRole.treasurer]  // Multiple roles
```

**Migration path:**
1. Change schema: `role Role` → `roles Role[]`
2. Update guards: `user.role === X` → `user.roles.includes(X)`
3. Create migration script for existing data

### Additional Club Roles

Potential future roles:
- `treasurer` - Manage club finances
- `secretary` - Manage club events
- `moderator` - Moderate club content

### Permission Granularity

Current: Role-based (RBAC)
Future: Permission-based (e.g., `canDeleteClub`, `canManageMembers`)

---

## Troubleshooting

### User gets 403 on their own club

**Check:**
1. Is ClubMember record created? `SELECT * FROM club_members WHERE user_id = X AND club_id = Y`
2. Is role set to `admin`? `role = 'admin'` not `'member'`
3. Is ClubRolesGuard applied to the route?

### User can't create club

**Check:**
1. Is JwtAuthGuard applied? User must be authenticated
2. Are validation errors preventing creation? Check DTO validation
3. Is club name unique? ClubAlreadyExistsException

### Project admin can't modify clubs

**Check:**
1. Is `user.role` set correctly in DB? Should be `'ADMIN'` or `'MODERATOR'`
2. Is ClubRolesGuard checking project roles? See line with `user.role === Role.ADMIN`
3. Is JWT token valid and user loaded? Check `request.user.dbUser`