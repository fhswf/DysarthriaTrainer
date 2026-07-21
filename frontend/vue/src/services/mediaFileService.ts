/**
 * Media File Service
 *
 * API service for managing media files (images, audio, video)
 * used in speech therapy exercises.
 */

import { useApiStore } from '@/stores/api'

/**
 * Media file types
 */
export type MediaFileType = 'image' | 'audio' | 'video'

/**
 * Media file entity returned from API
 */
export interface MediaFile {
  id: string
  file_type: MediaFileType
  mime_type: string
  original_filename: string
  storage_path: string
  cdn_url: string | null
  thumbnail_url: string | null
  file_size_bytes: number
  duration_seconds: number | null
  width: number | null
  height: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  created_by: string | null
}

/**
 * Detailed media file response with additional info
 */
export interface MediaFileDetail extends MediaFile {
  is_orphaned: boolean
}

/**
 * Media file upload payload
 */
export interface MediaFileUploadPayload {
  file: File
  description?: string
  alt_text?: string
  duration_seconds?: number
  width?: number
  height?: number
}

/**
 * Media file list parameters
 */
export interface MediaFileListParams {
  file_type?: MediaFileType
  mime_type?: string
}

/**
 * Bulk delete response
 */
export interface BulkDeleteResponse {
  deleted_count: number
  failed_count: number
  errors: string[]
}

/**
 * Storage statistics response
 */
export interface StorageStats {
  total_files: number
  total_size_bytes: number
  by_type: {
    image: { count: number; size_bytes: number }
    audio: { count: number; size_bytes: number }
    video: { count: number; size_bytes: number }
  }
}

class MediaFileService {
  private api: ReturnType<typeof useApiStore> | null = null

  /**
   * Base URL for media endpoints
   * ⚠️ CRITICAL: Must be public for potential CSV export functionality
   */
  public readonly baseUrl = '/api/v1/media'

  private getApi() {
    this.api ??= useApiStore()
    return this.api
  }

  /**
   * List all media files with optional filtering
   */
  async list(params?: MediaFileListParams, signal?: AbortSignal): Promise<MediaFile[]> {
    const response = await this.getApi().get<MediaFile[]>(this.baseUrl, {
      params,
      signal,
    })
    return response.data
  }

  /**
   * Get a single media file by ID
   */
  async get(id: string, signal?: AbortSignal): Promise<MediaFileDetail> {
    const response = await this.getApi().get<MediaFileDetail>(`${this.baseUrl}/${id}`, { signal })
    return response.data
  }

  /**
   * Upload a new media file
   */
  async upload(payload: MediaFileUploadPayload, signal?: AbortSignal): Promise<MediaFile> {
    const formData = new FormData()
    formData.append('file', payload.file)

    if (payload.description) {
      formData.append('description', payload.description)
    }
    if (payload.alt_text) {
      formData.append('alt_text', payload.alt_text)
    }
    if (payload.duration_seconds !== undefined) {
      formData.append('duration_seconds', String(payload.duration_seconds))
    }
    if (payload.width !== undefined) {
      formData.append('width', String(payload.width))
    }
    if (payload.height !== undefined) {
      formData.append('height', String(payload.height))
    }

    const response = await this.getApi().post<MediaFile>(`${this.baseUrl}/upload`, formData, {
      signal,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  /**
   * Delete a media file
   */
  async delete(id: string, signal?: AbortSignal): Promise<void> {
    await this.getApi().delete(`${this.baseUrl}/${id}`, { signal })
  }

  /**
   * Delete multiple media files at once
   */
  async bulkDelete(ids: string[], signal?: AbortSignal): Promise<BulkDeleteResponse> {
    const response = await this.getApi().post<BulkDeleteResponse>(
      `${this.baseUrl}/bulk-delete`,
      { file_ids: ids },
      { signal }
    )
    return response.data
  }

  /**
   * Get orphaned files (not referenced by any exercise)
   */
  async getOrphanedFiles(signal?: AbortSignal): Promise<MediaFile[]> {
    const response = await this.getApi().get<MediaFile[]>(`${this.baseUrl}/orphaned`, { signal })
    return response.data
  }

  /**
   * Delete all orphaned files
   */
  async cleanupOrphaned(signal?: AbortSignal): Promise<{ deleted_count: number; message: string }> {
    const response = await this.getApi().post<{ deleted_count: number; message: string }>(
      `${this.baseUrl}/cleanup-orphaned`,
      {},
      { signal }
    )
    return response.data
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(userId?: string, signal?: AbortSignal): Promise<StorageStats> {
    const params = userId ? { user_id: userId } : undefined

    const response = await this.getApi().get<StorageStats>(`${this.baseUrl}/stats/storage`, {
      params,
      signal,
    })
    return response.data
  }
}

export const mediaFileService = new MediaFileService()
