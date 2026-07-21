/**
 * Session Translation Keys (English)
 *
 * Translations for practice session management, progress, and feedback.
 */

export default {
  // Session Management
  title: 'Practice Session',
  start: 'Start Session',
  complete: 'Complete Session',
  abandon: 'Abandon Session',
  resume: 'Resume Session',

  // Status
  status: {
    notStarted: 'Not started',
    inProgress: 'In progress',
    completed: 'Completed',
    abandoned: 'Abandoned',
  },

  // Progress
  progress: {
    title: 'Progress',
    items: '{completed} of {total} items',
    percentage: '{percentage}% complete',
    currentItem: 'Item {current} of {total}',
    iteration: 'Attempt {current} of {total}',
  },

  // Navigation
  navigation: {
    next: 'Next Item',
    previous: 'Previous Item',
    skip: 'Skip Item',
    repeat: 'Repeat Item',
    cannotGoBack: 'Cannot go back',
    cannotGoNext: 'Complete current item first',
  },

  // Items
  items: {
    current: 'Current Item',
    completed: 'Completed',
    remaining: '{count} remaining',
    total: '{count} items total',
    repeatCount: 'Repeat {count} times',
  },

  // Timing
  timing: {
    duration: 'Duration',
    elapsed: 'Elapsed',
    remaining: 'Remaining',
    average: 'Average per item',
    total: 'Total time',
    format: '{hours}h {minutes}m {seconds}s',
    formatShort: '{minutes}:{seconds}',
  },

  // Actions
  actions: {
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    markComplete: 'Mark Complete',
    saveProgress: 'Save Progress',
    viewResults: 'View Results',
    restart: 'Restart Session',
  },

  // Feedback
  feedback: {
    sessionStarted: 'Session started successfully',
    sessionCompleted: 'Session completed successfully!',
    sessionAbandoned: 'Session abandoned',
    itemCompleted: 'Item completed',
    progressSaved: 'Progress saved',
    allItemsCompleted: 'All items completed!',
  },

  // Errors
  errors: {
    startFailed: 'Failed to start session',
    completionFailed: 'Failed to complete session',
    abandonFailed: 'Failed to abandon session',
    saveFailed: 'Failed to save progress',
    loadFailed: 'Failed to load session',
    noActiveSession: 'No active session',
    sessionAbandonFailed: 'Failed to abandon session',
    resultCreationFailed: 'Failed to create result',
    fetchResultsFailed: 'Failed to fetch results',
  },

  // Direct keys for store usage
  completedSuccessfully: 'Practice session completed successfully!',
  completionFailed: 'Failed to complete session',

  // Warnings
  warnings: {
    unsavedProgress: 'You have unsaved progress',
    abandonConfirm: 'Are you sure you want to abandon this session?',
    abandonWarning: 'This will lose all progress',
    incompleteItems: 'Some items are incomplete',
    lowQualityRecording: 'Recording quality is low',
  },

  // Completion
  completion: {
    title: 'Session Complete!',
    summary: 'Summary',
    totalItems: 'Total items practiced',
    totalTime: 'Total practice time',
    averageScore: 'Average score',
    improvements: 'Improvements',
    nextSteps: 'Next steps',
    viewDetails: 'View Detailed Results',
    startNew: 'Start New Session',
  },

  // Empty States
  empty: {
    noItems: 'No items to practice',
    noResults: 'No results yet',
    noSessions: 'No practice sessions',
    startFirst: 'Start your first session',
  },

  // Dialogs
  dialogs: {
    abandon: {
      title: 'Abandon Session?',
      message: 'Are you sure you want to abandon this session? All progress will be lost.',
      confirm: 'Yes, Abandon',
      cancel: 'No, Continue',
    },
    complete: {
      title: 'Complete Session?',
      message: 'Have you finished all items?',
      confirm: 'Yes, Complete',
      cancel: 'Not Yet',
    },
  },

  // Instructions
  instructions: {
    title: 'How to Practice',
    step1: '1. Start recording at the beginning',
    step2: '2. Read each item clearly',
    step3: '3. Navigate through all items',
    step4: '4. Complete the session when done',
    tips: 'Tips for better results',
  },
} as const
