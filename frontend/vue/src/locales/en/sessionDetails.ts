export default {
  // Page
  pageTitle: 'Practice Session Details',
  pageDescription: 'Comprehensive view of your practice session with detailed results and analysis',

  // Session Info
  sessionInfo: 'Session Information',
  sessionId: 'Session ID',
  exerciseName: 'Exercise',
  startedAt: 'Started',
  completedAt: 'Completed',
  duration: 'Duration',
  status: 'Status',
  totalItems: 'Total Items',
  completedItems: 'Completed Items',
  progress: 'Progress',

  // Status values
  status_in_progress: 'In Progress',
  status_completed: 'Completed',
  status_abandoned: 'Abandoned',

  // Audio
  sessionAudio: 'Session Recording',
  resultAudio: 'Result Recording',
  audioPlayer: 'Audio Player',
  recordingDuration: 'Recording Duration',
  audioDuration: 'Duration',
  playAudio: 'Play Recording',
  pauseAudio: 'Pause Recording',
  downloadAudio: 'Download Recording',
  noAudio: 'No recording available',

  // Results
  results: 'Exercise Results',
  resultItem: 'Result #{number}',
  noResults: 'No results available',
  showingResults: 'Showing {count} result(s)',

  // Result Details
  iteration: 'Iteration',
  exerciseItem: 'Exercise Item',
  timeRange: 'Time Range',
  audioSegment: 'Audio Segment',
  transcription: 'Transcription',
  confidence: 'Confidence',

  // Scores
  scores: 'Scores',
  overallScore: 'Overall Score',
  pronunciationScore: 'Pronunciation',
  accuracyScore: 'Accuracy',
  fluencyScore: 'Fluency',
  noScores: 'No scores available',

  // Phoneme Analysis
  phonemeAnalysis: 'Phoneme Analysis',
  detectedPhonemes: 'Detected Phonemes',
  phonemeAccuracy: 'Phoneme Accuracy',
  ipaTranscription: 'IPA Transcription',
  expectedIpa: 'Expected IPA',
  commonErrors: 'Common Errors',
  noPhonemeData: 'No phoneme analysis available',

  // Audio Quality
  audioQuality: 'Audio Quality',
  qualityLevel: 'Quality Level',
  snrDb: 'Signal-to-Noise Ratio',
  rmsEnergy: 'RMS Energy',
  spectralFlatness: 'Spectral Flatness',
  clippingDetected: 'Clipping',
  suitableForTherapy: 'Suitable for Therapy',
  warnings: 'Warnings',
  noWarnings: 'No warnings',

  quality_excellent: 'Excellent',
  quality_good: 'Good',
  quality_fair: 'Fair',
  quality_poor: 'Poor',

  // Analysis Parameters
  analysisParameters: 'Analysis Parameters',
  language: 'Language',
  sampleRate: 'Sample Rate',
  modelVersion: 'Model Version',
  noiseReduction: 'Noise Reduction',
  noiseReductionStrength: 'NR Strength',

  // Processing
  processingStatus: 'Processing Status',
  status_pending: 'Pending',
  status_processing: 'Processing',
  status_failed: 'Failed',
  processingError: 'Processing Error',

  // Actions
  backToSessions: 'Back to Sessions',
  viewExercise: 'View Exercise',
  reanalyze: 'Re-analyze Results',
  exportSession: 'Export Session',
  shareSession: 'Share Session',
  deleteSession: 'Delete Session',

  // Metadata
  metadata: 'Session Metadata',
  createdAt: 'Created',
  updatedAt: 'Last Updated',

  // Empty States
  noData: 'No data available',
  loadingSession: 'Loading session...',
  sessionNotFound: 'Session not found',

  // Errors
  errors: {
    loadFailed: 'Failed to load session details',
    noSessionId: 'No session ID provided',
    invalidSessionId: 'Invalid session ID format',
    audioLoadFailed: 'Failed to load audio recording',
  },

  // Tooltips
  tooltips: {
    overallScore: 'Combined score based on pronunciation, accuracy, and fluency',
    pronunciationScore: 'How accurately the sounds were produced',
    accuracyScore: 'How closely the attempt matched the target',
    fluencyScore: 'How smoothly and naturally the speech flowed',
    snr: 'Higher values indicate cleaner audio with less background noise',
    rmsEnergy: 'Average volume level of the recording',
    clipping: 'Audio distortion from excessive volume',
    spectralFlatness: 'Measure of noise vs. tonal content (lower is better)',
  },
}
