/**
 * Recording Translation Keys (German)
 *
 * Translations for recording controls, status, and feedback.
 */

export default {
  // Controls
  startRecording: 'Aufnahme starten',
  stopRecording: 'Aufnahme beenden',
  pauseRecording: 'Aufnahme pausieren',
  resumeRecording: 'Aufnahme fortsetzen',

  // Tooltips
  tooltips: {
    startRecording: 'Aufnahme für diese Übung starten',
    stopRecording: 'Aufnahme beenden und speichern',
    microphoneSettings: 'Mikrofonquelle auswählen und Verbindung prüfen',
    previousItem: 'Zurück zur vorherigen Übung',
    nextItem: 'Weiter zur nächsten Übung',
    completeExercise: 'Übung abschließen und Ergebnisse speichern',
  },

  // Status
  status: {
    idle: 'Bereit zur Aufnahme',
    recording: 'Aufnahme läuft...',
    paused: 'Aufnahme pausiert',
    stopped: 'Aufnahme beendet',
    processing: 'Audio wird verarbeitet...',
    uploading: 'Wird hochgeladen...',
    uploadComplete: 'Upload abgeschlossen',
  },

  // Duration
  duration: {
    label: 'Dauer',
    format: '{minutes}:{seconds}',
  },

  // Quality
  quality: {
    title: 'Audioqualität',
    excellent: 'Ausgezeichnet',
    good: 'Gut',
    fair: 'Ausreichend',
    poor: 'Schlecht',
    unknown: 'Unbekannt',
    tooQuiet: 'Zu leise',
    tooLoud: 'Zu laut',
    feedback: {
      excellent: 'Perfekte Audioqualität!',
      good: 'Gute Audioqualität',
      fair: 'Audioqualität könnte verbessert werden',
      poor: 'Schlechte Audioqualität erkannt',
      tooQuiet: 'Bitte lauter sprechen',
      tooLoud: 'Bitte leiser sprechen',
    },
    details: {
      title: 'Audioqualität Details',
      overall: 'Gesamtqualität',
      snr: 'Signal-Rausch-Verhältnis',
      volume: 'Lautstärke',
      clipping: 'Übersteuerung',
      noise: 'Hintergrundgeräusche',
      recommendations: 'Empfehlungen',
      clickToExpand: 'Klicken für Details',
    },
    recommendations: {
      moveCloser: 'Näher ans Mikrofon gehen',
      reduceBackground: 'Hintergrundgeräusche reduzieren',
      lowerVolume: 'Mikrofonlautstärke senken oder leiser sprechen',
      raiseVolume: 'Mikrofonlautstärke erhöhen oder lauter sprechen',
      checkMicrophone: 'Mikrofonplatzierung und -einstellungen überprüfen',
    },
  },

  // Device
  device: {
    select: 'Mikrofon auswählen',
    none: 'Kein Mikrofon gefunden',
    default: 'Standard-Mikrofon',
    connected: 'Verbunden',
    disconnected: 'Getrennt',
  },

  // Permissions
  permissions: {
    title: 'Mikrofonzugriff erforderlich',
    message: 'Diese App benötigt Zugriff auf Ihr Mikrofon, um Ihre Stimme aufzunehmen.',
    allow: 'Mikrofon erlauben',
    denied: 'Mikrofonzugriff verweigert',
    deniedMessage: 'Bitte aktivieren Sie den Mikrofonzugriff in Ihren Browsereinstellungen.',
    notSupported: 'Aufnahme nicht unterstützt',
    notSupportedMessage: 'Ihr Browser unterstützt keine Audioaufnahme.',
    checking: 'Berechtigungen werden geprüft...',
    prompt: 'Bitte gewähren Sie Mikrofonzugriff, um fortzufahren',
    instructions: 'So aktivieren Sie den Mikrofonzugriff:',
    step1: '1. Klicken Sie auf das Kamera-/Mikrofonsymbol in der Adressleiste Ihres Browsers',
    step2: '2. Wählen Sie "Erlauben" für Mikrofonzugriff',
    step3: '3. Laden Sie diese Seite bei Bedarf neu',
    privacyNotice: 'Ihre Aufnahmen sind privat und werden nur für die Sprachanalyse verwendet.',
  },

  // Errors
  errors: {
    startFailed: 'Aufnahme konnte nicht gestartet werden',
    stopFailed: 'Aufnahme konnte nicht beendet werden',
    notRecording: 'Momentan läuft keine Aufnahme',
    noMediaDevices: 'Kein Mikrofon erkannt',
    permissionDenied: 'Mikrofonberechtigung verweigert',
    recordingInProgress: 'Aufnahme läuft bereits',
    uploadFailed: 'Upload der Aufnahme fehlgeschlagen',
    processingFailed: 'Audioverarbeitung fehlgeschlagen',
  },

  // Warnings
  warnings: {
    lowQuality: 'Niedrige Audioqualität erkannt',
    backgroundNoise: 'Hintergrundgeräusche erkannt',
    clipping: 'Audio-Clipping erkannt',
    tooShort: 'Aufnahme zu kurz',
    tooLong: 'Aufnahme zu lang',
  },

  // Progress
  progress: {
    uploading: 'Upload läuft: {percentage}%',
    processing: 'Audio wird verarbeitet...',
    analyzing: 'Aussprache wird analysiert...',
  },

  // Feedback
  feedback: {
    recordingStarted: 'Aufnahme gestartet',
    recordingStopped: 'Aufnahme beendet',
    uploadStarted: 'Aufnahme wird hochgeladen...',
    uploadComplete: 'Upload abgeschlossen',
    readyToRecord: 'Bereit zur Aufnahme',
  },

  // Tips
  tips: {
    holdToRecord: 'Halten zum Aufnehmen',
    releaseToStop: 'Loslassen zum Beenden',
    clickToStart: 'Klicken zum Starten',
    clickToStop: 'Klicken zum Beenden',
    speakClearly: 'Sprechen Sie klar ins Mikrofon',
    minimizeNoise: 'Hintergrundgeräusche minimieren',
  },

  // Session Management
  session: {
    start: {
      title: 'Aufnahmesitzung starten',
      info: 'Sitzungsinformationen',
      exercise: 'Übung',
      items: 'Elemente',
      duration: 'Geschätzte Dauer',
      instructions: 'Anweisungen',
      settings: 'Einstellungen',
      autoPlay: 'Nächstes Element automatisch abspielen',
      autoPlayDescription: 'Automatisch zum nächsten Element wechseln nach der Aufnahme',
      showQuality: 'Qualitätsfeedback anzeigen',
      showQualityDescription: 'Audioqualitätsindikatoren während der Aufnahme anzeigen',
      skipCompleted: 'Abgeschlossene Elemente überspringen',
      skipCompletedDescription: 'Bereits abgeschlossene Elemente überspringen',
      tips: 'Tipps für beste Ergebnisse',
      startButton: 'Sitzung starten',
    },
    complete: {
      title: 'Sitzung abgeschlossen',
      congratulations: 'Glückwunsch!',
      message: 'Sie haben diese Aufnahmesitzung erfolgreich abgeschlossen.',
      completed: 'Abgeschlossen',
      duration: 'Dauer',
      averageScore: 'Durchschn. Punktzahl',
      quality: 'Qualität',
      details: 'Sitzungsdetails',
      totalRecordings: 'Gesamtaufnahmen',
      retries: 'Wiederholungen',
      skipped: 'Übersprungene Elemente',
      averageAttempts: 'Durchschn. Versuche pro Element',
      achievements: 'Erfolge',
      nextSteps: 'Wie geht es weiter?',
      nextStepsMessage: 'Ihre Aufnahmen wurden gespeichert und sind bereit zur Überprüfung.',
      share: 'Ergebnisse teilen',
      review: 'Aufnahmen überprüfen',
    },
    abandon: {
      title: 'Sitzung abbrechen',
      confirmTitle: 'Sind Sie sicher?',
      confirmMessage: 'Möchten Sie diese Aufnahmesitzung wirklich abbrechen?',
      progressInfo: 'Ihr Fortschritt',
      completedItems: 'Abgeschlossene Elemente',
      unsavedWarning: 'Nicht gespeicherte Aufnahmen',
      unsavedMessage: 'Sie haben Aufnahmen, die noch nicht gespeichert wurden.',
      consequences: 'Wenn Sie jetzt abbrechen:',
      loseProgress: 'Gesamter Sitzungsfortschritt geht verloren',
      loseRecordings: 'Nicht gespeicherte Aufnahmen werden gelöscht',
      noScore: 'Es wird keine Punktzahl oder Feedback erstellt',
      saveAlternative:
        'Tipp: Verwenden Sie "Speichern & Beenden", um Ihren Fortschritt zu erhalten',
      keepWorking: 'Weiter arbeiten',
      saveAndExit: 'Speichern & Beenden',
      abandonButton: 'Sitzung abbrechen',
    },
  },
} as const
