/**
 * Exercise Result API Types
 *
 * Request/response types for exercise result API endpoints.
 */

// ===== REQUEST TYPES =====

export interface CreateResultRequest {
  practice_session_id: string
  exercise_item_id: string
  iteration_number: number
  started_at: string // ISO 8601
  completed_at: string // ISO 8601
  duration_ms: number
  audio_segment_start_ms: number
  audio_segment_end_ms: number
  metadata?: Record<string, any>
}

export interface UpdateResultAnalysisRequest {
  transcription?: string
  phoneme_accuracy?: number
  pronunciation_score?: number
  fluency_score?: number
  audio_quality_score?: number
  analysis_data?: Record<string, any>
}

// ===== RESPONSE TYPES =====

export interface ResultResponse {
  id: string
  practice_session_id: string
  exercise_item_id: string
  iteration_number: number
  started_at: string // ISO 8601
  completed_at: string // ISO 8601
  duration_ms: number
  audio_segment_start_ms: number
  audio_segment_end_ms: number
  transcription: string | null
  phoneme_accuracy: number | null
  pronunciation_score: number | null
  fluency_score: number | null
  audio_quality_score: number | null
  analysis_data: Record<string, any> | null
  metadata: Record<string, any>
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

export interface ResultListResponse {
  results: ResultResponse[]
  total: number
}

export interface ResultStatistics {
  total_attempts: number
  average_score: number | null
  best_score: number | null
  improvement_percentage: number | null
  total_practice_time_ms: number
}
