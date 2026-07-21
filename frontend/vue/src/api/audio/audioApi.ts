/**
 * Audio API Client
 * 
 * HTTP client for audio recording and analysis endpoints.
 * Follows service pattern with typed responses.
 */

import type { AxiosResponse } from 'axios';

// Type definitions matching backend Pydantic schemas
export interface AudioQualityMetrics {
  snr_db: number | null;
  rms_energy: number | null;
  clipping_detected: boolean;
  spectral_flatness: number | null;
}

export interface AudioWarning {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, unknown>;
}

export interface AudioAnalysisResponse {
  transcription: string;
  language: string;
  confidence: number | null;
  quality_metrics: AudioQualityMetrics;
  warnings: string[];
  processing_time_ms: number | null;
  timestamp: string;
}

export interface QualityCheckResponse {
  quality_metrics: AudioQualityMetrics;
  is_acceptable: boolean;
  warnings: string[];
  processing_time_ms: number;
}

export interface RecordingCreateRequest {
  exercise_id: number;
  audio_data: string; // Base64-encoded
  duration_seconds: number;
  language?: string;
}

export interface RecordingResponse {
  id: number;
  exercise_id: number;
  user_id: number;
  file_path: string;
  duration_seconds: number;
  transcription: string | null;
  quality_metrics: AudioQualityMetrics | null;
  warnings: string[];
  created_at: string;
}

// WebSocket message types
export interface StreamingAudioChunk {
  audio_data: string; // Base64-encoded
  chunk_index: number;
  is_final: boolean;
  language?: string;
}

export interface StreamingTranscriptionUpdate {
  chunk_index: number;
  transcription: string;
  is_final: boolean;
  quality_metrics?: AudioQualityMetrics;
  warnings?: string[];
  processing_time_ms?: number;
  error?: string;
}

/**
 * Audio API Service
 * 
 * Provides HTTP methods for audio analysis and recording.
 * Use with API store's axios instance for authentication.
 */
export class AudioApiService {
  private baseUrl: string;
  private axiosInstance: any; // Will be injected from API store

  constructor(baseUrl: string = '/api/v1/audio', axiosInstance?: any) {
    this.baseUrl = baseUrl;
    this.axiosInstance = axiosInstance;
  }

  /**
   * Set axios instance (from API store)
   */
  setAxiosInstance(instance: any): void {
    this.axiosInstance = instance;
  }

  /**
   * Analyze audio data (batch mode)
   * 
   * @param audioData - Base64-encoded audio data
   * @param language - Target language (de, en)
   * @param applyNoiseReduction - Whether to apply noise reduction
   * @returns Complete audio analysis
   */
  async analyzeAudio(
    audioData: string,
    language: string = 'de',
    applyNoiseReduction: boolean = true
  ): Promise<AudioAnalysisResponse> {
    const response: AxiosResponse<AudioAnalysisResponse> = await this.axiosInstance.post(
      `${this.baseUrl}/analyze`,
      null,
      {
        params: {
          audio_data: audioData,
          language,
          apply_noise_reduction: applyNoiseReduction,
        },
      }
    );
    return response.data;
  }

  /**
   * Quick quality check without transcription
   * 
   * @param audioData - Base64-encoded audio data
   * @returns Quality metrics and warnings only (faster)
   */
  async checkQuality(audioData: string): Promise<QualityCheckResponse> {
    const response: AxiosResponse<QualityCheckResponse> = await this.axiosInstance.post(
      `${this.baseUrl}/quality-check`,
      null,
      {
        params: {
          audio_data: audioData,
        },
      }
    );
    return response.data;
  }

  /**
   * Create and save a recording
   * 
   * @param request - Recording creation request
   * @returns Saved recording with analysis
   */
  async createRecording(request: RecordingCreateRequest): Promise<RecordingResponse> {
    const response: AxiosResponse<RecordingResponse> = await this.axiosInstance.post(
      `${this.baseUrl}/recordings`,
      request
    );
    return response.data;
  }

  /**
   * Get a specific recording by ID
   * 
   * @param recordingId - Recording ID
   * @returns Recording data
   */
  async getRecording(recordingId: number): Promise<RecordingResponse> {
    const response: AxiosResponse<RecordingResponse> = await this.axiosInstance.get(
      `${this.baseUrl}/recordings/${recordingId}`
    );
    return response.data;
  }

  /**
   * List recordings for current user
   * 
   * @param exerciseId - Optional filter by exercise ID
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns List of recordings
   */
  async listRecordings(
    exerciseId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<RecordingResponse[]> {
    const params: Record<string, number> = { limit, offset };
    if (exerciseId !== undefined) {
      params.exercise_id = exerciseId;
    }

    const response: AxiosResponse<RecordingResponse[]> = await this.axiosInstance.get(
      `${this.baseUrl}/recordings`,
      { params }
    );
    return response.data;
  }

  /**
   * Convert Blob to Base64 string
   * 
   * @param blob - Audio blob
   * @returns Base64-encoded string (without data URL prefix)
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/wav;base64,")
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Export singleton instance
export const audioApi = new AudioApiService();

// Export helper function to initialize with API store
export function initializeAudioApi(axiosInstance: any): void {
  audioApi.setAxiosInstance(axiosInstance);
}
