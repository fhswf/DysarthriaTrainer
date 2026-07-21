/**
 * Session Analysis API Types
 *
 * Types for the session-level AI analysis endpoints that process
 * all results in a practice session with real-time progress updates.
 */

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AnalysisProgress {
  session_id: string
  status: AnalysisStatus
  total_results: number
  processed_results: number
  current_result_id: string | null
  errors: AnalysisError[]
  started_at: number | null
  completed_at: number | null
  progress_percentage: number
}

export interface AnalysisError {
  result_id: string
  error: string
  timestamp: number
}

export interface StartAnalysisRequest {
  session_id: string
}

export interface StartAnalysisResponse {
  message: string
  session_id: string
  websocket_url: string
  status: AnalysisStatus
}

export interface GetAnalysisStatusResponse {
  session_id: string
  status: AnalysisStatus
  total_results: number
  processed_results: number
  progress_percentage: number
  errors: AnalysisError[]
  started_at: number | null
  completed_at: number | null
}

export interface WebSocketProgressMessage extends AnalysisProgress {
  type: 'analysis_progress' | 'analysis_complete' | 'analysis_error'
}
