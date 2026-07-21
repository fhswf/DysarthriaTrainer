/**
 * Recording Translation Keys (English)
 *
 * Translations for recording controls, status, and feedback.
 */

export default {
  // Controls
  startRecording: 'Start Recording',
  stopRecording: 'Stop Recording',
  pauseRecording: 'Pause Recording',
  resumeRecording: 'Resume Recording',

  // Tooltips
  tooltips: {
    startRecording: 'Start recording for this exercise',
    stopRecording: 'Stop recording and save',
    microphoneSettings: 'Select microphone source and check connection',
    previousItem: 'Go to previous exercise',
    nextItem: 'Go to next exercise',
    completeExercise: 'Complete exercise and save results',
  },

  // Status
  status: {
    idle: 'Ready to record',
    recording: 'Recording...',
    paused: 'Recording paused',
    stopped: 'Recording stopped',
    processing: 'Processing audio...',
    uploading: 'Uploading...',
    uploadComplete: 'Upload complete',
  },

  // Duration
  duration: {
    label: 'Duration',
    format: '{minutes}:{seconds}',
  },

  // Quality
  quality: {
    title: 'Audio Quality',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    unknown: 'Unknown',
    tooQuiet: 'Too quiet',
    tooLoud: 'Too loud',
    feedback: {
      excellent: 'Perfect audio quality!',
      good: 'Good audio quality',
      fair: 'Audio quality could be improved',
      poor: 'Poor audio quality detected',
      tooQuiet: 'Please speak louder',
      tooLoud: 'Please speak softer',
    },
    details: {
      title: 'Audio Quality Details',
      overall: 'Overall Quality',
      snr: 'Signal-to-Noise Ratio',
      volume: 'Volume Level',
      clipping: 'Clipping',
      noise: 'Background Noise',
      recommendations: 'Recommendations',
      clickToExpand: 'Click to view details',
    },
    recommendations: {
      moveCloser: 'Move closer to the microphone',
      reduceBackground: 'Reduce background noise',
      lowerVolume: 'Reduce microphone volume or speak softer',
      raiseVolume: 'Increase microphone volume or speak louder',
      checkMicrophone: 'Check microphone placement and settings',
    },
  },

  // Device
  device: {
    select: 'Select Microphone',
    none: 'No microphone found',
    default: 'Default Microphone',
    connected: 'Connected',
    disconnected: 'Disconnected',
  },

  // Permissions
  permissions: {
    title: 'Microphone Access Required',
    message: 'This app needs access to your microphone to record your voice.',
    allow: 'Allow Microphone',
    denied: 'Microphone access denied',
    deniedMessage: 'Please enable microphone access in your browser settings.',
    notSupported: 'Recording not supported',
    notSupportedMessage: 'Your browser does not support audio recording.',
    checking: 'Checking permissions...',
    prompt: 'Please grant microphone permission to continue',
    instructions: 'How to enable microphone access:',
    step1: '1. Click the camera/microphone icon in your browser address bar',
    step2: '2. Select "Allow" for microphone access',
    step3: '3. Reload this page if needed',
    privacyNotice: 'Your recordings are private and only used for speech analysis.',
  },

  // Errors
  errors: {
    startFailed: 'Failed to start recording',
    stopFailed: 'Failed to stop recording',
    notRecording: 'Not currently recording',
    noMediaDevices: 'No microphone detected',
    permissionDenied: 'Microphone permission denied',
    recordingInProgress: 'Recording already in progress',
    uploadFailed: 'Failed to upload recording',
    processingFailed: 'Failed to process audio',
  },

  // Warnings
  warnings: {
    lowQuality: 'Low audio quality detected',
    backgroundNoise: 'Background noise detected',
    clipping: 'Audio clipping detected',
    tooShort: 'Recording too short',
    tooLong: 'Recording too long',
  },

  // Progress
  progress: {
    uploading: 'Uploading: {percentage}%',
    processing: 'Processing audio...',
    analyzing: 'Analyzing pronunciation...',
  },

  // Feedback
  feedback: {
    recordingStarted: 'Recording started',
    recordingStopped: 'Recording stopped',
    uploadStarted: 'Uploading recording...',
    uploadComplete: 'Upload complete',
    readyToRecord: 'Ready to start recording',
  },

  // Tips
  tips: {
    holdToRecord: 'Hold to record',
    releaseToStop: 'Release to stop',
    clickToStart: 'Click to start recording',
    clickToStop: 'Click to stop recording',
    speakClearly: 'Speak clearly into your microphone',
    minimizeNoise: 'Minimize background noise',
  },

  // Session Management
  session: {
    start: {
      title: 'Start Recording Session',
      info: 'Session Information',
      exercise: 'Exercise',
      items: 'Items',
      duration: 'Estimated Duration',
      instructions: 'Instructions',
      settings: 'Settings',
      autoPlay: 'Auto-play Next Item',
      autoPlayDescription: 'Automatically move to the next item after recording',
      showQuality: 'Show Quality Feedback',
      showQualityDescription: 'Display audio quality indicators during recording',
      skipCompleted: 'Skip Completed Items',
      skipCompletedDescription: 'Skip items that have already been completed',
      tips: 'Tips for Best Results',
      startButton: 'Start Session',
    },
    complete: {
      title: 'Session Complete',
      congratulations: 'Congratulations!',
      message: 'You have successfully completed this recording session.',
      completed: 'Completed',
      duration: 'Duration',
      averageScore: 'Avg Score',
      quality: 'Quality',
      details: 'Session Details',
      totalRecordings: 'Total Recordings',
      retries: 'Retries',
      skipped: 'Skipped Items',
      averageAttempts: 'Avg Attempts per Item',
      achievements: 'Achievements',
      nextSteps: "What's Next?",
      nextStepsMessage: 'Your recordings have been saved and are ready for review.',
      share: 'Share Results',
      review: 'Review Recordings',
    },
    abandon: {
      title: 'Abandon Session',
      confirmTitle: 'Are you sure?',
      confirmMessage: 'Do you really want to abandon this recording session?',
      progressInfo: 'Your Progress',
      completedItems: 'Completed Items',
      unsavedWarning: 'Unsaved Recordings',
      unsavedMessage: "You have recordings that haven't been saved yet.",
      consequences: 'If you abandon now:',
      loseProgress: 'All session progress will be lost',
      loseRecordings: 'Unsaved recordings will be deleted',
      noScore: 'No score or feedback will be generated',
      saveAlternative: 'Tip: Use "Save & Exit" to preserve your progress',
      keepWorking: 'Keep Working',
      saveAndExit: 'Save & Exit',
      abandonButton: 'Abandon Session',
    },
  },
} as const
