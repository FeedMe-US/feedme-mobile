# Current Work: Environment Separation

## Task
Implement proper prod/dev environment separation so account creation can be tested.

## Status: IN PROGRESS

## Changes Made

### Mobile App (`feedme-mobile`)
| File | Change |
|------|--------|
| `.env.production` | Created - production environment variables |
| `.env.development` | Created - development environment variables (needs Supabase dev project) |
| `eas.json` | Updated - added env vars per build profile |
| `src/config/environment.ts` | Created - runtime environment detection |
| `app/_layout.tsx` | Updated - logs environment at startup |
| `.vibe/ENVIRONMENT_SETUP.md` | Created - setup guide for remaining manual steps |

### Backend API (`feedme-api`)
| File | Change |
|------|--------|
| `src/routes/auth.py` | Added `ALLOW_ANY_EMAIL` flag - bypasses university check when true |
| `src/main.py` | Fixed .env file path (was pointing 4 dirs up, now 2) |
| `.env` | Added `ALLOW_ANY_EMAIL=true` for local development |

## Decisions
1. **ALLOW_ANY_EMAIL flag**: Added to backend to bypass university email requirement for testing. Disabled by default in production builds.
2. **EAS build profiles**: Each profile sets its own env vars. Preview and development allow any email; production does not.
3. **Environment logging**: App logs current environment at startup (dev mode only) for easier debugging.

## Remaining Manual Steps
See `.vibe/ENVIRONMENT_SETUP.md` for full details:

1. **Configure Supabase redirect URLs** - REQUIRED for auth to work
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add `ucnutrition://auth/callback`

2. **Create dev Supabase project** - OPTIONAL but recommended
   - Separate database for development/testing

3. **Deploy backend to Railway** - REQUIRED
   - Push changes so ALLOW_ANY_EMAIL is available

## Testing
- [ ] Restart Expo with `npm run dev:clear`
- [ ] Verify environment is logged as "development"
- [ ] Sign out if already authenticated
- [ ] Test Google Sign-In with any Gmail account
- [ ] Verify signup completes without university email error

## Risks
- **Low**: ALLOW_ANY_EMAIL could be accidentally enabled in production if Railway env var is set wrong
  - Mitigation: Default is `false`, production EAS profile sets it to `false`
