/**
 * Audio Streaming Composable
 *
 * Manages WebSocket connection for real-time audio streaming.
 * Sends audio chunks and receives live transcription.
 */

import { ref, onUnmounted } from 'vue'

export interface AudioStreamChunk {
  audio_data: string // Base64-encoded
  chunk_index: number
  is_final: boolean
  language?: string
}

export interface AudioStreamResponse {
  chunk_index: number
  transcription: string
  is_final: boolean
  quality_metrics?: {
    snr_db: number | null
    rms_energy: number | null
    clipping_detected: boolean
    spectral_flatness: number | null
  }
  warnings?: string[]
  processing_time_ms?: number
  error?: string
}

export interface StreamingOptions {
  language?: string
  chunkDurationMs?: number
  enableTranscription?: boolean // Enable/disable Whisper transcription (default: true)
  onPartialTranscription?: (text: string) => void
  onFinalTranscription?: (response: AudioStreamResponse) => void
  onError?: (error: string) => void
}

export function useAudioStreaming() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isStreaming = ref(false)
  const partialTranscription = ref('')
  const finalTranscription = ref('')
  const qualityMetrics = ref<AudioStreamResponse['quality_metrics'] | null>(null)
  const warnings = ref<string[]>([])
  const error = ref<string | null>(null)

  let chunkIndex = 0
  let options: StreamingOptions = {}

  /**
   * Connect to WebSocket endpoint
   */
  const connect = async (
    baseUrl?: string,
    token?: string,
    enableTranscription: boolean = false
  ): Promise<boolean> => {
    try {
      error.value = null

      // Determine WebSocket URL
      // Convert HTTP URL to WebSocket URL and add the correct path
      let wsUrl: string
      if (baseUrl) {
        wsUrl = baseUrl
      } else {
        // Use the browser's current location to build the WebSocket URL
        // This ensures we connect to the correct host (localhost:8000 in dev, VM host via reverse proxy, etc.)
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

        // In development with localhost, use backend port 8000
        // Otherwise, use current host (for VM/WireGuard or production reverse proxy)
        const wsHost =
          window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host

        wsUrl = `${wsProtocol}//${wsHost}/api/v1/audio/ws/stream`

        // Add query parameters
        const params = new URLSearchParams()

        // Add transcription parameter
        params.append('enable_transcription', enableTranscription.toString())

        // Add auth token if provided
        if (token) {
          params.append('token', token)
        } else {
          // Try to get token from localStorage
          const storedToken = localStorage.getItem('access_token')
          if (storedToken) {
            params.append('token', storedToken)
          }
        }

        wsUrl += `?${params.toString()}`
      }

      // Create WebSocket connection
      ws.value = new WebSocket(wsUrl)

      // Setup event handlers
      ws.value.onopen = () => {
        isConnected.value = true
        error.value = null
      }

      ws.value.onmessage = (event) => {
        handleMessage(event.data)
      }

      ws.value.onerror = () => {
        error.value = 'WebSocket-Verbindungsfehler - Überprüfen Sie die Serververbindung'
        if (options.onError) {
          options.onError(error.value)
        }
      }

      ws.value.onclose = (event) => {
        isConnected.value = false
        isStreaming.value = false

        // Provide more detailed error messages based on close code
        if (event.code === 1006) {
          error.value = 'Verbindung unerwartet geschlossen - Server möglicherweise nicht erreichbar'
        } else if (event.code === 1008) {
          error.value = 'Verbindung abgelehnt - Authentifizierung fehlgeschlagen'
        } else if (event.code !== 1000) {
          error.value = `Verbindung geschlossen (Code: ${event.code})`
        }
      }

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Verbindungs-Timeout'))
        }, 5000)

        if (ws.value) {
          ws.value.addEventListener('open', () => {
            clearTimeout(timeout)
            resolve()
          })
          ws.value.addEventListener('error', () => {
            clearTimeout(timeout)
            reject(new Error('Verbindung fehlgeschlagen'))
          })
        }
      })

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Verbindung fehlgeschlagen'
      return false
    }
  }

  /**
   * Disconnect from WebSocket
   */
  const disconnect = (): void => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
    isStreaming.value = false
  }

  /**
   * Start streaming session
   */
  const startStreaming = (streamOptions?: StreamingOptions): void => {
    if (!isConnected.value) {
      error.value = 'Nicht verbunden'
      return
    }

    options = streamOptions || {}
    isStreaming.value = true
    chunkIndex = 0
    partialTranscription.value = ''
    finalTranscription.value = ''
    qualityMetrics.value = null
    warnings.value = []
  }

  /**
   * Send audio chunk to server
   */
  const sendChunk = async (audioBlob: Blob, isFinal: boolean = false): Promise<void> => {
    if (!isConnected.value || !ws.value) {
      throw new Error('Nicht verbunden')
    }

    // Convert blob to base64
    const base64Audio = await blobToBase64(audioBlob)

    // Create chunk message
    const chunk: AudioStreamChunk = {
      audio_data: base64Audio,
      chunk_index: chunkIndex,
      is_final: isFinal,
      language: options.language || 'de',
    }

    console.log(
      `[AudioStreaming] Sending chunk ${chunkIndex} (${audioBlob.size} bytes, ${isFinal ? 'FINAL' : 'partial'})`
    )

    // Send to server
    ws.value.send(JSON.stringify(chunk))

    chunkIndex++
  }

  /**
   * Stop streaming session
   */
  const stopStreaming = (): void => {
    isStreaming.value = false
  }

  /**
   * Handle incoming message from server
   */
  const handleMessage = (data: string): void => {
    try {
      const response: AudioStreamResponse = JSON.parse(data)
      console.log('[AudioStreaming] Received WebSocket message:', response)

      // Handle error
      if (response.error) {
        error.value = response.error
        console.error('[AudioStreaming] Server error:', response.error)
        if (options.onError) {
          options.onError(response.error)
        }
        return
      }

      // Update transcription
      if (response.is_final) {
        // Final transcription with quality metrics
        console.log('[AudioStreaming] Final response received')
        console.log('[AudioStreaming] - Transcription:', response.transcription)
        console.log('[AudioStreaming] - Quality metrics:', response.quality_metrics)
        console.log('[AudioStreaming] - Warnings:', response.warnings)

        finalTranscription.value = response.transcription
        qualityMetrics.value = response.quality_metrics || null
        warnings.value = response.warnings || []

        if (options.onFinalTranscription) {
          console.log('[AudioStreaming] Calling onFinalTranscription callback')
          options.onFinalTranscription(response)
        }

        isStreaming.value = false
      } else {
        // Partial transcription
        console.log('[AudioStreaming] Partial transcription:', response.transcription)
        if (response.quality_metrics) {
          console.log('[AudioStreaming] - Partial quality metrics:', response.quality_metrics)
          // Update quality metrics from partial responses too
          qualityMetrics.value = response.quality_metrics
        }

        partialTranscription.value = response.transcription

        if (options.onPartialTranscription) {
          options.onPartialTranscription(response.transcription)
        }

        // Call onFinalTranscription for partial responses with quality metrics
        // This allows real-time quality updates during recording
        if (response.quality_metrics && options.onFinalTranscription) {
          console.log('[AudioStreaming] Calling onFinalTranscription for partial quality update')
          options.onFinalTranscription(response)
        }
      }
    } catch (err) {
      error.value = 'Ungültige Server-Antwort'
      console.error('[AudioStreaming] Failed to parse WebSocket message:', err, 'Data:', data)
    }
  }

  /**
   * Convert Blob to Base64 string
   */
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        // Remove data URL prefix
        const base64 = dataUrl.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    isConnected,
    isStreaming,
    partialTranscription,
    finalTranscription,
    qualityMetrics,
    warnings,
    error,

    // Actions
    connect,
    disconnect,
    startStreaming,
    sendChunk,
    stopStreaming,
  }
}
