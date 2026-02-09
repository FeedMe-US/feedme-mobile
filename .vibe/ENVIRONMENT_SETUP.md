# Environment Separation Setup Guide

## Overview

The app now supports three environments:
- **development**: Local development with dev Supabase/API
- **preview**: TestFlight builds with test data
- **production**: App Store builds with production data

## Current Status

### Completed
- [x] Created `.env.development` and `.env.production` files
- [x] Updated `eas.json` with build profiles for each environment
- [x] Added `ALLOW_ANY_EMAIL` flag to backend (bypasses university check)
- [x] Created `src/config/environment.ts` for runtime environment detection

### Manual Steps Required

#### 1. Configure Supabase Redirect URLs

Go to: https://supabase.com/dashboard/project/oevitqyhyvzsgabngcgt/auth/url-configuration

Add these redirect URLs:
```
ucnutrition://auth/callback
exp://localhost:8081/--/auth/callback
```

The first is for production/TestFlight, the second is for Expo Go development.

#### 2. Create Development Supabase Project (Optional but Recommended)

1. Go to https://supabase.com/dashboard
2. Create new project named "feedme-dev"
3. Copy the URL and anon key to `.env.development`
4. Run migrations against dev database
5. Enable Google Auth provider with same OAuth credentials

#### 3. Create Development Railway Deployment (Optional)

1. In Railway dashboard, create new service from same repo
2. Set environment to use dev Supabase credentials
3. Set `ALLOW_ANY_EMAIL=true`
4. Update `.env.development` with the dev API URL

#### 4. Deploy Backend Changes

The backend now has `ALLOW_ANY_EMAIL` flag. To enable:

For Railway (production):
- Keep `ALLOW_ANY_EMAIL=false` or don't set it

For local development:
- Set `ALLOW_ANY_EMAIL=true` in your `.env`

## Testing Flow

### Local Development
```bash
cd feedme-mobile
npm run dev:clear  # Uses .env (defaults to development settings)
```

### Preview Build (TestFlight)
```bash
eas build --profile preview --platform ios
```

### Production Build
```bash
eas build --profile production --platform ios
```

## Environment Variables

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `EXPO_PUBLIC_ENV` | development | preview | production |
| `EXPO_PUBLIC_ALLOW_ANY_EMAIL` | true | true | false |
| `EXPO_PUBLIC_API_URL` | localhost:8000 | prod API | prod API |
| `EXPO_PUBLIC_SUPABASE_URL` | dev project | prod project | prod project |

## Verifying Environment

The app logs environment info at startup in dev mode. Check the Expo terminal for:
```
==================================================
[Environment] DEVELOPMENT
[Environment] API: http://localhost:8000
[Environment] Supabase: https://...
[Environment] Allow Any Email: true
==================================================
```
