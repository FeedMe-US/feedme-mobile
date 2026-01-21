#!/bin/bash
# Manual script to sync API types from feedme-docs

set -e

echo "Fetching latest OpenAPI spec..."
curl -o shared/openapi.json \
  https://raw.githubusercontent.com/FeedMe-US/feedme-docs/main/api/openapi.json

echo "Generating TypeScript types..."
npm run api:generate

echo "Done! Check src/types/api.generated.ts for changes."
