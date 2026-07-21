export default {
  // Page
  pageTitle: 'Übungssitzung Details',
  pageDescription:
    'Umfassende Ansicht Ihrer Übungssitzung mit detaillierten Ergebnissen und Analysen',

  // Session Info
  sessionInfo: 'Sitzungsinformationen',
  sessionId: 'Sitzungs-ID',
  exerciseName: 'Übung',
  startedAt: 'Gestartet',
  completedAt: 'Abgeschlossen',
  duration: 'Dauer',
  status: 'Status',
  totalItems: 'Gesamtanzahl',
  completedItems: 'Abgeschlossen',
  progress: 'Fortschritt',

  // Status values
  status_in_progress: 'Läuft',
  status_completed: 'Abgeschlossen',
  status_abandoned: 'Abgebrochen',

  // Audio
  sessionAudio: 'Sitzungsaufnahme',
  resultAudio: 'Ergebnisaufnahme',
  audioPlayer: 'Audio-Player',
  recordingDuration: 'Aufnahmedauer',
  audioDuration: 'Dauer',
  playAudio: 'Aufnahme abspielen',
  pauseAudio: 'Aufnahme pausieren',
  downloadAudio: 'Aufnahme herunterladen',
  noAudio: 'Keine Aufnahme verfügbar',

  // Results
  results: 'Übungsergebnisse',
  resultItem: 'Ergebnis #{number}',
  noResults: 'Keine Ergebnisse verfügbar',
  showingResults: '{count} Ergebnis(se) angezeigt',

  // Result Details
  iteration: 'Wiederholung',
  exerciseItem: 'Übungselement',
  timeRange: 'Zeitbereich',
  audioSegment: 'Audiosegment',
  transcription: 'Transkription',
  confidence: 'Zuverlässigkeit',

  // Scores
  scores: 'Bewertungen',
  overallScore: 'Gesamtbewertung',
  pronunciationScore: 'Aussprache',
  accuracyScore: 'Genauigkeit',
  fluencyScore: 'Flüssigkeit',
  noScores: 'Keine Bewertungen verfügbar',

  // Phoneme Analysis
  phonemeAnalysis: 'Phonemanalyse',
  detectedPhonemes: 'Erkannte Phoneme',
  phonemeAccuracy: 'Phonem-Genauigkeit',
  ipaTranscription: 'IPA-Transkription',
  expectedIpa: 'Erwartete IPA',
  commonErrors: 'Häufige Fehler',
  noPhonemeData: 'Keine Phonemanalyse verfügbar',

  // Audio Quality
  audioQuality: 'Audioqualität',
  qualityLevel: 'Qualitätsstufe',
  snrDb: 'Signal-Rausch-Verhältnis',
  rmsEnergy: 'RMS-Energie',
  spectralFlatness: 'Spektrale Flachheit',
  clippingDetected: 'Übersteuerung',
  suitableForTherapy: 'Für Therapie geeignet',
  warnings: 'Warnungen',
  noWarnings: 'Keine Warnungen',

  quality_excellent: 'Ausgezeichnet',
  quality_good: 'Gut',
  quality_fair: 'Befriedigend',
  quality_poor: 'Schlecht',

  // Analysis Parameters
  analysisParameters: 'Analyseparameter',
  language: 'Sprache',
  sampleRate: 'Abtastrate',
  modelVersion: 'Modellversion',
  noiseReduction: 'Rauschunterdrückung',
  noiseReductionStrength: 'RU-Stärke',

  // Processing
  processingStatus: 'Verarbeitungsstatus',
  status_pending: 'Ausstehend',
  status_processing: 'Wird verarbeitet',
  status_failed: 'Fehlgeschlagen',
  processingError: 'Verarbeitungsfehler',

  // Actions
  backToSessions: 'Zurück zu Sitzungen',
  viewExercise: 'Übung anzeigen',
  reanalyze: 'Ergebnisse neu analysieren',
  exportSession: 'Sitzung exportieren',
  shareSession: 'Sitzung teilen',
  deleteSession: 'Sitzung löschen',

  // Metadata
  metadata: 'Sitzungsmetadaten',
  createdAt: 'Erstellt',
  updatedAt: 'Zuletzt aktualisiert',

  // Empty States
  noData: 'Keine Daten verfügbar',
  loadingSession: 'Sitzung wird geladen...',
  sessionNotFound: 'Sitzung nicht gefunden',

  // Errors
  errors: {
    loadFailed: 'Fehler beim Laden der Sitzungsdetails',
    noSessionId: 'Keine Sitzungs-ID angegeben',
    invalidSessionId: 'Ungültiges Sitzungs-ID-Format',
    audioLoadFailed: 'Fehler beim Laden der Audioaufnahme',
  },

  // Tooltips
  tooltips: {
    overallScore: 'Kombinierte Bewertung basierend auf Aussprache, Genauigkeit und Flüssigkeit',
    pronunciationScore: 'Wie genau die Laute produziert wurden',
    accuracyScore: 'Wie nahe der Versuch dem Ziel kam',
    fluencyScore: 'Wie flüssig und natürlich die Sprache floss',
    snr: 'Höhere Werte bedeuten saubereres Audio mit weniger Hintergrundgeräuschen',
    rmsEnergy: 'Durchschnittlicher Lautstärkepegel der Aufnahme',
    clipping: 'Audioverzerrung durch zu hohe Lautstärke',
    spectralFlatness: 'Maß für Rauschen vs. tonalen Inhalt (niedriger ist besser)',
  },
}
