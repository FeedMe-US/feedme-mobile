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

See `.env.example` for required variables.
