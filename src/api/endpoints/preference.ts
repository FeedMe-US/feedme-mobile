/**
 * Preference API Endpoints
 * ========================
 * Type-safe wrappers for /preference/* endpoints
 *
 * Contract source: backend/api/src/contracts/preference.py
 */

import { apiClient } from '@/src/services/api';
import type {
  ThumbsUpRequest,
  ThumbsUpResponse,
  BlockRequest,
  BlockResponse,
} from '@/src/types/api';

/**
 * Mark a recipe as liked (thumbs up)
 * POST /preference/thumbs-up
 * Auth: Yes
 *
 * Increases the user's preference score for this recipe,
 * making it more likely to appear in future recommendations.
 */
export async function thumbsUp(request: ThumbsUpRequest) {
  return apiClient.post<ThumbsUpResponse>('/preference/thumbs-up', request);
}

/**
 * Block a recipe permanently
 * POST /preference/block
 * Auth: Yes
 *
 * Blocked recipes will never appear in recommendations.
 */
export async function blockRecipe(request: BlockRequest) {
  return apiClient.post<BlockResponse>('/preference/block', request);
}

/**
 * Unblock a previously blocked recipe
 * DELETE /preference/block/{recipe_id}
 * Auth: Yes
 *
 * @param recipeId - The recipe ID to unblock
 *
 * Returns 204 No Content on success
 */
export async function unblockRecipe(recipeId: string) {
  return apiClient.delete(`/preference/block/${recipeId}`);
}
