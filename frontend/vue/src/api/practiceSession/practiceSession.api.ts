/**
 * Practice Session API Endpoints
 *
 * Export endpoint constants for practice session operations.
 * All requests are made through useApiStore().
 */

// ===== ENDPOINTS =====

export const PRACTICE_SESSION_ENDPOINTS = {
  // Create new session
  CREATE: '/api/v1/practice/sessions',

  // Get session by ID
  GET: (sessionId: string) => `/api/v1/practice/sessions/${sessionId}`,

  // Get session with results
  GET_WITH_RESULTS: (sessionId: string) => `/api/v1/practice/sessions/${sessionId}/with-results`,

  // List user sessions
  LIST: '/api/v1/practice/sessions',

  // Update recording start
  START_RECORDING: (sessionId: string) => `/api/v1/practice/sessions/${sessionId}/start-recording`,

  // Complete session
  COMPLETE: (sessionId: string) => `/api/v1/practice/sessions/${sessionId}/complete`,

  // Abandon session
  ABANDON: (sessionId: string) => `/api/v1/practice/sessions/${sessionId}/abandon`,

  // Get session statistics
  STATS: (sessionId: string) => `/api/v1/practice/sessions/${sessionId}/stats`,
} as const
