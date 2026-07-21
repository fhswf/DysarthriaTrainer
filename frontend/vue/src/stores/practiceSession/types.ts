/**
 * Practice Session Store Types
 *
 * Type definitions for the practice session store managing
 * continuous recording sessions and exercise item tracking.
 */

export interface PracticeSessionState {
  // Current active session
  currentSession: PracticeSession | null

  // Exercise data
  exercise: Exercise | null
  exerciseItems: ExerciseItem[]

  // Navigation state
  currentItemIndex: number
  completedItemIds: Set<string>

  // Recording state
  isRecording: boolean
  recordingStartTime: number | null
  recordingStartedAt: Date | null

  // Timestamp tracking
  timestamps: ItemTimestamp[]
  lastTimestamp: number

  // Results tracking
  results: Map<string, ExerciseResult>
  pendingResults: string[] // result IDs not yet uploaded

  // Upload state
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null

  // UI state
  showQualityFeedback: boolean
  showWaveform: boolean
}

export interface PracticeSession {
  id: string
  userId: string
  exerciseId: string
  startedAt: Date
  completedAt: Date | null
  status: 'in_progress' | 'completed' | 'abandoned'
  totalItems: number
  completedItems: number
  sessionAudioFileId: string | null
  recordingStartedAt: Date | null
  recordingDurationMs: number | null
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ItemTimestamp {
  // Unique ID for this timestamp
  id: string

  // Exercise item info
  exerciseItemId: string
  itemText: string

  // Iteration tracking (for repeated items)
  iteration: number

  // Timing
  timestamp: number // ms from recording start
  startedAt: Date
  completedAt: Date

  // Result reference (set after result created)
  resultId?: string
}

export interface ExerciseResult {
  id: string
  practiceSessionId: string
  exerciseItemId: string
  iterationNumber: number
  startedAt: Date
  completedAt: Date
  durationMs: number

  // Audio segment info
  audioFileId: string | null
  audioSegmentStartMs: number | null
  audioSegmentEndMs: number | null
  audioDurationMs: number | null

  // Analysis results (populated by backend in Phase 4)
  transcription: string | null
  transcriptionConfidence: number | null
  phonemeAnalysis: Record<string, any> | null
  audioQualityMetrics: Record<string, any> | null
  analysisParameters: Record<string, any>
  evaluationResults: Record<string, any>

  // Processing state
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  processingError: string | null

  createdAt: Date
  updatedAt: Date
}

export interface Exercise {
  id: string
  title: string
  description: string
  difficulty: number
  targetPhonemes: string[]
  estimatedDuration: number
  metadata: Record<string, any>
}

export interface ExerciseItem {
  id: string
  exerciseId: string
  orderIndex: number
  itemType: 'word' | 'sentence' | 'phrase'
  content: string
  targetPhonemes: string[]
  difficulty: number
  repeatCount: number // How many times to practice this item
  metadata: Record<string, any>
}
