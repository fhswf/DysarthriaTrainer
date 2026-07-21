/**
 * Media API Types
 *
 * Request/response types for media file operations.
 */

// ===== REQUEST TYPES =====

export interface UploadMetadata {
  session_id?: string
  result_id?: string
  duration_ms?: number
  mime_type?: string
  [key: string]: any
}

export interface MediaQueryParams {
  type?: 'audio' | 'image' | 'video'
  user_id?: string
  session_id?: string
  limit?: number
  offset?: number
}

// ===== RESPONSE TYPES =====

export interface MediaFileResponse {
  id: string
  user_id: string
  filename: string
  original_filename: string
  mime_type: string
  size_bytes: number
  duration_ms: number | null
  storage_path: string
  public_url: string | null
  metadata: Record<string, any>
  uploaded_at: string // ISO 8601
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

export interface MediaListResponse {
  files: MediaFileResponse[]
  total: number
  page: number
  page_size: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}
