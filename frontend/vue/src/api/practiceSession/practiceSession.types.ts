/**
 * Practice Session API Types
 *
 * Request/response types for practice session API endpoints.
 */

// ===== REQUEST TYPES =====

export interface CreateSessionRequest {
  exercise_id: string
  total_items: number
  metadata?: Record<string, any>
}

export interface UpdateRecordingStartRequest {
  recording_timestamp: string // ISO 8601
}

export interface CompleteSessionRequest {
  audio_file_id: string
  recording_duration_ms: number
}

// ===== RESPONSE TYPES =====

export interface SessionResponse {
  id: string
  user_id: string
  exercise_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string // ISO 8601
  completed_at: string | null // ISO 8601
  recording_started_at: string | null // ISO 8601
  session_audio_file_id: string | null
  recording_duration_ms: number | null
  total_items: number
  completed_items: number
  metadata: Record<string, any>
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

export interface SessionListResponse {
  sessions: SessionResponse[]
  total: number
  page: number
  page_size: number
}
