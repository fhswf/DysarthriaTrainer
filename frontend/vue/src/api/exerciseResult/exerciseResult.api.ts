/**
 * Exercise Result API Endpoints
 *
 * Export endpoint constants for exercise result operations.
 * All requests are made through useApiStore().
 */

// ===== ENDPOINTS =====

export const EXERCISE_RESULT_ENDPOINTS = {
  // Create new result
  CREATE: '/api/v1/practice/results',

  // Get result by ID
  GET: (resultId: string) => `/api/v1/practice/results/${resultId}`,

  // List results for session
  LIST_BY_SESSION: (sessionId: string) => `/api/v1/practice/results/session/${sessionId}`,

  // List results for exercise item
  LIST_BY_ITEM: (itemId: string) => `/api/v1/practice/results/item/${itemId}`,

  // Update result analysis
  UPDATE_ANALYSIS: (resultId: string) => `/api/v1/practice/results/${resultId}/analysis`,

  // Get statistics for item
  ITEM_STATS: (itemId: string) => `/api/v1/practice/results/item/${itemId}/stats`,

  // Get statistics for user
  USER_STATS: '/api/v1/practice/results/stats',
} as const
