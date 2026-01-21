# FeedMe Development Guidelines

## API Contract Rules

This project enforces strict API contracts between the FastAPI backend and React Native frontend. **All developers (human and AI) must follow these rules.**

### Source of Truth Hierarchy

1. **Database Schema** (`backend/sql/migrations/*.sql`) - The ultimate source of truth for data structure
2. **Backend Pydantic Schemas** (`backend/api/src/schemas/*.py`) - Defines API request/response shapes
3. **Shared API Documentation** (`shared/api-schema.md`) - Human-readable contract documentation
4. **Frontend Types** - Should be generated from or match backend schemas exactly

### When Backend and Frontend Disagree

If you encounter a mismatch between backend response shape and frontend expected type:

1. **Check the database schema** - What does the actual data look like?
2. **Check the backend schema** - What does the API say it returns?
3. **The schema wins** - Update the frontend to match the schema
4. **If the schema is wrong**, update it AND document the change

### Confidence Threshold

**If your confidence in any API-related change falls below 90%, STOP and ask questions.**

Things to verify before making API changes:
- [ ] I've read the relevant route file in `backend/api/src/routes/`
- [ ] I've read the relevant schema file in `backend/api/src/schemas/`
- [ ] I've checked the database migration for the table structure
- [ ] I understand the request and response shapes completely
- [ ] My frontend types exactly match the backend response

### API Documentation Location

- **Endpoint inventory**: `docs/api-inventory.md`
- **Schema reference**: `shared/api-schema.md`
- **Change process**: `docs/API_CONTRACT_CHANGES.md`

---

## Current API Endpoints

### Auth (`/auth`)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/check-email` | No | Validate university email |
| POST | `/auth/register` | Yes | Complete registration after Supabase auth |
| GET | `/auth/me` | Yes | Get current user profile with university |
| GET | `/auth/universities` | No | List active universities |

### Menu (`/menu`)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/menu/locations` | Yes | List all dining locations with hours |
| GET | `/menu/{location_id}/{date}` | Yes | Get menu for location on date |

### User (`/user`)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/user/profile` | Yes | Get user profile |
| PUT | `/user/profile` | Yes | Update user profile |
| GET | `/user/targets` | Yes | Get adjusted daily targets |
| GET | `/user/progress` | Yes | Get weekly/monthly progress |
| GET | `/user/day-plan` | Yes | Get pre-computed day plan |

### Recommend (`/recommend`)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/recommend` | Yes | Generate single meal plate |
| POST | `/recommend/day` | Yes | Generate full day plan |

### Log (`/log`)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/log` | Yes | Log a meal |
| PUT | `/log/{id}` | Yes | Update logged meal |
| DELETE | `/log/{id}` | Yes | Delete logged meal |

### Preference (`/preference`)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/preference/thumbs-up` | Yes | Mark recipe as favorite |
| POST | `/preference/block` | Yes | Block recipe permanently |
| DELETE | `/preference/block/{recipe_id}` | Yes | Unblock recipe |

### Scan (`/scan`)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/scan/photo` | Yes | AI food photo analysis |
| GET | `/scan/barcode/{code}` | Yes | Barcode product lookup |

### Health
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | No | Health check |
| GET | `/` | No | API info |

---

## Key Data Types

### Macros (used everywhere)
```typescript
interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
```

### Meal Types
```typescript
type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type MealPeriod = "breakfast" | "lunch" | "dinner" | "late_night";
```

### Log Sources
```typescript
type LogSource = "recommendation" | "manual" | "photo_ai" | "barcode";
```

### Goal Types
```typescript
type GoalType = "cut" | "maintain" | "lean_muscle" | "bulk";
```

---

## Database Tables Reference

### Core User Data
- `users` - User profiles, targets, preferences
- `universities` - Multi-tenant university support

### Nutrition Data
- `nutrition` - Recipe nutritional data (4,714 recipes)
- `allergens` - Allergen mapping per recipe
- `menu_items` - Daily menu availability
- `locations` - Dining halls and restaurants
- `hours` - Operating hours by date

### User Activity
- `food_log` - Meal logging history
- `user_food_preferences` - Learned affinity scores
- `user_blocked_recipes` - Hard exclusions
- `meal_recommendations` - Recommendation history
- `daily_plans` - Pre-computed day plans
- `weekly_checkins` - Weight tracking

### External Data
- `external_foods` - Barcode/manual food entries

---

## Frontend Service Files

API calls are made through service files in `src/services/`:

| Service | Purpose | Backend Routes |
|---------|---------|----------------|
| `authService.ts` | Authentication | `/auth/*` |
| `mealService.ts` | Dining halls, menus | `/menu/*` |
| `userService.ts` | User profile, preferences | `/user/*` |
| `recommendService.ts` | Meal recommendations | `/recommend/*` |
| `logService.ts` | Food logging | `/log/*` |
| `scanService.ts` | Photo AI, barcode | `/scan/*` |
| `analyticsService.ts` | Progress data | `/user/progress` |
| `dayPlanService.ts` | Day plans | `/user/day-plan` |

---

## Making API Changes

### Adding a New Endpoint

1. Define request/response schemas in `backend/api/src/schemas/`
2. Implement route in `backend/api/src/routes/`
3. Update `docs/api-inventory.md`
4. Update `shared/api-schema.md`
5. Create/update frontend service function
6. Update frontend types to match

### Modifying an Existing Endpoint

1. Check if it's a breaking change (see `docs/API_CONTRACT_CHANGES.md`)
2. Update backend schema first
3. Update documentation
4. Update frontend to match
5. Test end-to-end

### Breaking Changes Checklist

- [ ] Is there a frontend using this endpoint?
- [ ] Can the change be additive (add fields, not remove)?
- [ ] If breaking, have you coordinated the deploy?
- [ ] Are error responses handled correctly?

---

## Rate Limits

| Action | Limit | Reset |
|--------|-------|-------|
| Photo AI scans | 10/day | Midnight |
| Barcode lookups | 20/day | Midnight |
| Recommendation rerolls | 10/day | Midnight |

---

## Error Response Format

All errors follow this shape:
```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",
  "field": "optional.field.path"
}
```

Common error codes:
- `USER_NOT_FOUND` - User doesn't exist
- `LOCATION_NOT_FOUND` - Invalid location ID
- `RECIPE_NOT_FOUND` - Invalid recipe ID
- `LOG_NOT_FOUND` - Invalid log entry ID
- `VALIDATION_ERROR` - Request validation failed
- `UNIVERSITY_EMAIL_REQUIRED` - Non-university email
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Testing API Changes

Before committing API changes:

1. **Backend**: Run `pytest` in `backend/api/`
2. **Frontend**: Verify TypeScript compiles without errors
3. **Integration**: Test the actual API call works
4. **Documentation**: Ensure docs are updated

---

## Questions to Ask Before API Work

If you're unsure about any of these, ask before proceeding:

1. What is the exact shape of the request body?
2. What is the exact shape of the response body?
3. What error codes can this endpoint return?
4. Is authentication required?
5. Are there rate limits?
6. What database tables does this touch?
7. Will this change affect other endpoints?
