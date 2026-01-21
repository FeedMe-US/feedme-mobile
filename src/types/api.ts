/**
 * FeedMe API Types
 * ================
 * Re-exports from generated types with convenience aliases.
 *
 * AUTO-GENERATED types are in api.generated.ts
 * Regenerate: npm run api:generate
 * Source: ../shared/openapi.json
 *
 * Contract source: backend/api/src/contracts/
 */

// Re-export all generated types
export * from './api.generated';
import type { components, operations } from './api.generated';

// ============================================================================
// TYPE ALIASES
// Convenience exports for commonly used schema types.
// These all reference the generated types for single source of truth.
// ============================================================================

// === Schema type alias helper ===
type Schemas = components['schemas'];

// === Enums & Literals ===
export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'late_night';
export type MealType = Schemas['LogRequest']['meal_type'];
export type LogSource = Schemas['LogRequest']['source'];

// === Shared Types ===
export type MacroTotals = Schemas['MacroTotals'];
export type ProgressMetric = Schemas['ProgressMetric'];
export type LocationBrief = Schemas['LocationBrief'];
export type TimeRange = Schemas['TimeRange'];

// === Auth Types ===
export type UniversityInfo = Schemas['UniversityInfo'];
export type EmailCheckRequest = Schemas['EmailCheckRequest'];
export type EmailCheckResponse = Schemas['EmailCheckResponse'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type UserProfileResponse_Auth = Schemas['src__routes__auth__UserProfileResponse'];

// === Menu Types ===
export type MenuItemResponse = Schemas['MenuItemResponse'];
export type MenuSectionResponse = Schemas['MenuSectionResponse'];
export type MealMenuResponse = Schemas['MealMenuResponse'];
export type LocationHoursResponse = Schemas['LocationHoursResponse'];
export type LocationResponse = Schemas['LocationResponse'];
export type LocationsResponse = Schemas['LocationsResponse'];
export type MenuResponse = Schemas['MenuResponse'];

// === User Types ===
export type MealWindowResponse = Schemas['MealWindowResponse'];
export type MealPatternResponse = Schemas['MealPatternResponse'];
export type UserTargetsResponse = Schemas['UserTargetsResponse'];
export type UserProfileResponse = Schemas['src__schemas__user__UserProfileResponse'];
export type UserProfileUpdateRequest = Schemas['UserProfileUpdateRequest'];
export type AdjustedTargetsResponse = Schemas['AdjustedTargetsResponse'];
export type AdjustmentInfo = Schemas['AdjustmentInfo'];
export type WeekSummaryResponse = Schemas['WeekSummaryResponse'];
export type TodayProgressResponse = Schemas['TodayProgressResponse'];
export type TargetsResponse = Schemas['TargetsResponse'];
export type DailySummary = Schemas['DailySummary'];
export type WeightProgress = Schemas['WeightProgress'];
export type ProgressSummary = Schemas['ProgressSummary'];
export type ProgressResponse = Schemas['ProgressResponse'];
export type PrecomputedDayPlanResponse = Schemas['PrecomputedDayPlanResponse'];

// === Recommendation Types ===
export type RecommendRequest = Schemas['RecommendRequest'];
export type PlateItemResponse = Schemas['PlateItemResponse'];
export type PlateResponse = Schemas['PlateResponse'];
export type RecommendResponse = Schemas['RecommendResponse'];
export type RecommendDayRequest = Schemas['RecommendDayRequest'];
export type DayPlanResponse = Schemas['DayPlanResponse'];

// === Log Types ===
export type LogItemRequest = Schemas['LogItemRequest'];
export type LogRequest = Schemas['LogRequest'];
export type LogUpdateRequest = Schemas['LogUpdateRequest'];
export type DayProgressResponse = Schemas['DayProgressResponse'];
export type LogResponse = Schemas['LogResponse'];
export type FoodLogEntry = Schemas['FoodLogEntry'];
export type DailyTotals = Schemas['DailyTotals'];
export type DailyTrackingResponse = Schemas['DailyTrackingResponse'];

// === Preference Types ===
export type ThumbsUpRequest = Schemas['ThumbsUpRequest'];
export type ThumbsUpResponse = Schemas['ThumbsUpResponse'];
export type BlockRequest = Schemas['BlockRequest'];
export type BlockResponse = Schemas['BlockResponse'];

// === Scan Types ===
export type FoodAIItem = Schemas['FoodAIItem'];
export type FoodAIResponse = Schemas['FoodAIResponse'];
export type BarcodeProductResponse = Schemas['BarcodeProductResponse'];
export type BarcodeLookupResponse = Schemas['BarcodeLookupResponse'];

// === Health Types ===
export type HealthResponse = Schemas['HealthResponse'];

// === Error Types ===
export type HTTPValidationError = Schemas['HTTPValidationError'];
export type ValidationError = Schemas['ValidationError'];

// ============================================================================
// LEGACY COMPATIBILITY
// These types existed before generated types. Kept for backwards compatibility.
// ============================================================================

/** @deprecated Use MacroTotals instead */
export type Macros = MacroTotals;

/** @deprecated Use UserProfileResponse_Auth for auth endpoints */
export type AuthUserProfileResponse = UserProfileResponse_Auth;
