/**
 * Session Analysis API
 *
 * API client for session-level AI analysis endpoints.
 * Handles starting analysis, checking status, and WebSocket connection.
 */

import { useApiStore } from '@/stores/api'
import type { StartAnalysisResponse, GetAnalysisStatusResponse } from './sessionAnalysis.types'

export const sessionAnalysisApi = {
  /**
   * Start AI analysis for all results in a session
   * Returns immediately with 202 Accepted and WebSocket URL for progress
   */
  async startAnalysis(sessionId: string): Promise<StartAnalysisResponse> {
    const api = useApiStore()
    const response = await api.post<StartAnalysisResponse>(
      `/api/v1/analyze/sessions/${sessionId}/analyze`
    )
    return response.data
  },

  /**
   * Get current analysis progress/status
   * Returns 404 if no analysis has been started or found
   */
  async getAnalysisStatus(sessionId: string): Promise<GetAnalysisStatusResponse> {
    const api = useApiStore()
    const response = await api.get<GetAnalysisStatusResponse>(
      `/api/v1/analyze/sessions/${sessionId}/status`
    )
    return response.data
  },

  /**
   * Build WebSocket URL for real-time progress updates
   *
   * Uses dynamic host detection to work with:
   * - localhost:8000 (direct backend access)
   * - VM/WireGuard secure connections (via reverse proxy)
   *
   * Protocol: wss:// for https://, ws:// for http://
   */
  getWebSocketUrl(sessionId: string): string {
    // Use dynamic host detection for both dev and prod
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

    // In development with localhost, use backend port 8000
    // Otherwise, use current host (for VM/WireGuard or production)
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host

    return `${protocol}//${host}/api/v1/analyze/ws/sessions/${sessionId}`
  },
}
