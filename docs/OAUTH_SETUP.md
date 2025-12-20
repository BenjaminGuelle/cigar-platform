# OAuth Setup Guide

This guide explains how to configure OAuth providers (Google, Apple) in Supabase for the Cigar Platform API.

## How OAuth Works in Our Application

### Architecture Overview

1. **Frontend (Angular PWA)** initiates OAuth login via Supabase client
2. **Supabase Auth** handles the OAuth flow and creates user in `auth.users`
3. **Frontend** receives JWT token from Supabase
4. **Frontend** calls our API with JWT in `Authorization: Bearer <token>` header
5. **API Guard** verifies token and **auto-syncs** user to Prisma database on first access

### Auto-Sync Implementation

Our `JwtAuthGuard` automatically creates users in the Prisma database when they first access any protected route:

```typescript
// apps/api/src/auth/guards/jwt-auth.guard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  // ... token verification ...

  // Check if user exists in Prisma
  let dbUser = await this.prismaService.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!dbUser) {
    // Auto-create user from Supabase metadata
    dbUser = await this.prismaService.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        displayName: supabaseUser.user_metadata?.full_name ||
                     supabaseUser.user_metadata?.name ||
                     supabaseUser.email?.split('@')[0] ||
                     'User',
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
      },
    });
  }

  request.user = { ...supabaseUser, dbUser };
  return true;
}
```

**Benefits:**
- Works for **all OAuth providers** (Google, Apple, Facebook, etc.)
- No manual SQL triggers or migrations needed
- Transparent to users
- Can add new providers without backend code changes

---

## Google OAuth Setup

### 1. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure OAuth consent screen if not done:
   - User Type: **External**
   - App name: **Cigar Platform**
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Cigar Platform Web**
   - Authorized JavaScript origins:
     - `http://localhost:4200` (development)
     - `https://your-production-domain.com` (production)
   - Authorized redirect URIs:
     - `https://your-supabase-project.supabase.co/auth/v1/callback`

7. Save your **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Providers**
3. Find **Google** and click to enable
4. Enter your credentials:
   - **Client ID**: From Google Console
   - **Client Secret**: From Google Console
5. Click **Save**

### 3. Test Google OAuth

#### Frontend Implementation (Angular)

```typescript
// Example: auth.service.ts
async signInWithGoogle(): Promise<void> {
  const { data, error } = await this.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}
```

#### Auth Callback Route (Angular)

```typescript
// Example: auth-callback.component.ts
async ngOnInit() {
  // Supabase automatically handles the callback
  const { data: { session } } = await this.supabase.auth.getSession();

  if (session) {
    // User is authenticated, redirect to app
    this.router.navigate(['/dashboard']);
  }
}
```

---

## Apple OAuth Setup

### 1. Create Apple Service ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create **App ID**:
   - Description: **Cigar Platform**
   - Bundle ID: `com.cigarplatform.app` (or your domain)
   - Enable **Sign in with Apple**
4. Create **Services ID**:
   - Description: **Cigar Platform Web**
   - Identifier: `com.cigarplatform.web`
   - Enable **Sign in with Apple**
   - Configure:
     - Primary App ID: Select the App ID created above
     - Domains: `your-supabase-project.supabase.co`
     - Return URLs: `https://your-supabase-project.supabase.co/auth/v1/callback`

### 2. Create Private Key

1. In Apple Developer Portal, go to **Keys**
2. Create new key:
   - Name: **Cigar Platform Sign in with Apple Key**
   - Enable **Sign in with Apple**
   - Configure: Select your Primary App ID
3. Download the `.p8` key file (you can only download once!)
4. Note your **Key ID** and **Team ID**

### 3. Configure in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Providers**
3. Find **Apple** and click to enable
4. Enter your credentials:
   - **Services ID**: Your Services ID (e.g., `com.cigarplatform.web`)
   - **Team ID**: From Apple Developer Portal
   - **Key ID**: From the key you created
   - **Private Key**: Contents of your `.p8` file
5. Click **Save**

### 4. Test Apple OAuth

Frontend implementation is similar to Google:

```typescript
async signInWithApple(): Promise<void> {
  const { data, error } = await this.supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}
```

---

## Testing OAuth Flow

### 1. Test Email Signup First

Ensure basic auth works:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { "accessToken": "...", ... }
  }
}
```

### 2. Test OAuth User Auto-Sync

1. Sign in with Google/Apple via frontend
2. Get JWT token from Supabase
3. Call any protected API endpoint:

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

4. Check API logs for auto-sync message:
```
[JwtAuthGuard] Auto-creating user user@gmail.com from OAuth/Supabase
[JwtAuthGuard] User user@gmail.com auto-created successfully
```

5. Verify user exists in database:
```bash
npm run prisma:studio
# Check Users table - OAuth user should appear
```

---

## Troubleshooting

### Google OAuth Issues

**Error: redirect_uri_mismatch**
- Ensure redirect URI in Google Console matches exactly: `https://your-project.supabase.co/auth/v1/callback`
- Check for trailing slashes

**Error: invalid_client**
- Double-check Client ID and Secret in Supabase dashboard
- Ensure credentials are from the correct Google Cloud project

### Apple OAuth Issues

**Error: invalid_client**
- Verify Services ID matches exactly
- Check Team ID and Key ID are correct
- Ensure `.p8` private key content is copied correctly (including BEGIN/END lines)

**Error: invalid_grant**
- Services ID domain and return URL must match Supabase project URL exactly

### Auto-Sync Issues

**User not created in Prisma database**
- Check API logs for auto-sync messages
- Verify JWT token is valid
- Ensure `JwtAuthGuard` is applied to the route
- Check Prisma connection (test with `npm run prisma:studio`)

**Missing user metadata (displayName, avatarUrl)**
- Some providers don't return all metadata
- Check Supabase dashboard > Authentication > Users to see available metadata
- Our guard falls back to email-based displayName if metadata is missing

---

## Environment Variables

Ensure these are set in `.env`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend URL for CORS
FRONTEND_URL=http://localhost:4200
```

---

## Production Checklist

- [ ] Update Google OAuth redirect URIs with production domain
- [ ] Update Apple OAuth domains and return URLs with production domain
- [ ] Enable email confirmation in Supabase (currently disabled for MVP)
- [ ] Configure proper CORS settings
- [ ] Set up rate limiting on auth endpoints
- [ ] Review OAuth scopes requested (minimize to email, profile only)
- [ ] Add monitoring for auto-sync failures
- [ ] Consider adding webhook for Supabase auth events

---

## Adding More Providers

To add Facebook, GitHub, or other OAuth providers:

1. Enable provider in Supabase dashboard
2. Configure OAuth app in provider's developer portal
3. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Update frontend with provider-specific button

**No backend changes needed!** Our auto-sync guard works for all providers.