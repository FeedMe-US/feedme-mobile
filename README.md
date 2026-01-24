# FeedMe Mobile

React Native Expo app for UCLA dining recommendations.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API URL and Supabase credentials

# Start development server
npm run dev
```

## API Types

Types are auto-generated from the OpenAPI spec in feedme-docs.

```bash
# Manual sync
./scripts/sync-api-types.sh

# Or via npm
npm run api:generate
```

## Building

```bash
# Configure EAS (first time only)
eas build:configure

# Development build
eas build --profile development

# Preview build (TestFlight/Internal)
eas build --profile preview

# Production build
eas build --profile production
```

## Environment Variables

### Required Variables

The app requires the following environment variables for authentication to work:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `EXPO_PUBLIC_API_URL` - (Optional) Backend API URL, defaults to Railway production

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your credentials:**
   - Get Supabase credentials from: https://app.supabase.com → Your Project → Settings → API
   - Or ask your co-founder for the values

3. **Restart the Expo server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

### Important Notes

- **`.env` is gitignored** - Never commit your `.env` file
- **`.env.example` is committed** - This is a template for other developers
- **Restart required** - You must restart the Expo server after creating/updating `.env`
- **EAS Secrets** - For production builds, set these via `eas secret:create` (see EAS docs)

### Troubleshooting

If login doesn't work:
1. Verify `.env` file exists: `cat .env`
2. Check variables are prefixed with `EXPO_PUBLIC_`
3. Restart Expo server completely (stop and start again)
4. Check console logs for Supabase warnings
