/**
 * Media API Endpoints & Helpers
 *
 * Export endpoint constants for media operations.
 * Includes helper functions for upload with progress.
 */

import type { UploadMetadata, UploadProgress } from './media.types'

// ===== ENDPOINTS =====

export const MEDIA_ENDPOINTS = {
  // Upload file
  UPLOAD: '/api/v1/media/upload',

  // Get file by ID
  GET: (fileId: string) => `/api/v1/media/${fileId}`,

  // List files
  LIST: '/api/v1/media',

  // Download file
  DOWNLOAD: (fileId: string) => `/api/v1/media/${fileId}/download`,

  // Delete file
  DELETE: (fileId: string) => `/api/v1/media/${fileId}`,

  // Get file metadata
  METADATA: (fileId: string) => `/api/v1/media/${fileId}/metadata`,
} as const

// ===== HELPER FUNCTIONS =====

/**
 * Create FormData for file upload
 */
export function createUploadFormData(
  file: File | Blob,
  filename: string,
  metadata?: UploadMetadata
): FormData {
  const formData = new FormData()
  formData.append('file', file, filename)

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata))
  }

  return formData
}

/**
 * Create upload config with progress callback
 */
export function createUploadConfig(onProgress?: (progress: UploadProgress) => void) {
  return {
    onUploadProgress: (progressEvent: ProgressEvent) => {
      if (onProgress && progressEvent.total) {
        onProgress({
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
        })
      }
    },
  }
}

/**
 * Get audio blob MIME type based on browser support
 */
export function getAudioMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return 'audio/webm' // Fallback
}

/**
 * Generate filename with timestamp
 */
export function generateAudioFilename(prefix = 'session'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const extension = getAudioMimeType().includes('ogg') ? 'ogg' : 'webm'
  return `${prefix}-${timestamp}.${extension}`
}
