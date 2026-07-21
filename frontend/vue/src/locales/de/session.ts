/**
 * Session Translation Keys (German)
 *
 * Translations for practice session management, progress, and feedback.
 */

export default {
  // Session Management
  title: 'Übungssitzung',
  start: 'Sitzung starten',
  complete: 'Sitzung abschließen',
  abandon: 'Sitzung abbrechen',
  resume: 'Sitzung fortsetzen',

  // Status
  status: {
    notStarted: 'Nicht gestartet',
    inProgress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    abandoned: 'Abgebrochen',
  },

  // Progress
  progress: {
    title: 'Fortschritt',
    items: '{completed} von {total} Elementen',
    percentage: '{percentage}% abgeschlossen',
    currentItem: 'Element {current} von {total}',
    iteration: 'Versuch {current} von {total}',
  },

  // Navigation
  navigation: {
    next: 'Nächstes Element',
    previous: 'Vorheriges Element',
    skip: 'Element überspringen',
    repeat: 'Element wiederholen',
    cannotGoBack: 'Kann nicht zurückgehen',
    cannotGoNext: 'Aktuelles Element zuerst abschließen',
  },

  // Items
  items: {
    current: 'Aktuelles Element',
    completed: 'Abgeschlossen',
    remaining: '{count} verbleibend',
    total: '{count} Elemente insgesamt',
    repeatCount: '{count}x wiederholen',
  },

  // Timing
  timing: {
    duration: 'Dauer',
    elapsed: 'Vergangen',
    remaining: 'Verbleibend',
    average: 'Durchschnitt pro Element',
    total: 'Gesamtzeit',
    format: '{hours}h {minutes}m {seconds}s',
    formatShort: '{minutes}:{seconds}',
  },

  // Actions
  actions: {
    startRecording: 'Aufnahme starten',
    stopRecording: 'Aufnahme beenden',
    markComplete: 'Als abgeschlossen markieren',
    saveProgress: 'Fortschritt speichern',
    viewResults: 'Ergebnisse anzeigen',
    restart: 'Sitzung neu starten',
  },

  // Feedback
  feedback: {
    sessionStarted: 'Sitzung erfolgreich gestartet',
    sessionCompleted: 'Sitzung erfolgreich abgeschlossen!',
    sessionAbandoned: 'Sitzung abgebrochen',
    itemCompleted: 'Element abgeschlossen',
    progressSaved: 'Fortschritt gespeichert',
    allItemsCompleted: 'Alle Elemente abgeschlossen!',
  },

  // Errors
  errors: {
    startFailed: 'Sitzung konnte nicht gestartet werden',
    completionFailed: 'Sitzung konnte nicht abgeschlossen werden',
    abandonFailed: 'Sitzung konnte nicht abgebrochen werden',
    saveFailed: 'Fortschritt konnte nicht gespeichert werden',
    loadFailed: 'Sitzung konnte nicht geladen werden',
    noActiveSession: 'Keine aktive Sitzung',
    sessionAbandonFailed: 'Sitzung konnte nicht abgebrochen werden',
    resultCreationFailed: 'Ergebnis konnte nicht erstellt werden',
    fetchResultsFailed: 'Ergebnisse konnten nicht abgerufen werden',
  },

  // Direct keys for store usage
  completedSuccessfully: 'Übungssitzung erfolgreich abgeschlossen!',
  completionFailed: 'Sitzung konnte nicht abgeschlossen werden',

  // Warnings
  warnings: {
    unsavedProgress: 'Sie haben ungespeicherte Änderungen',
    abandonConfirm: 'Möchten Sie diese Sitzung wirklich abbrechen?',
    abandonWarning: 'Dadurch geht der gesamte Fortschritt verloren',
    incompleteItems: 'Einige Elemente sind unvollständig',
    lowQualityRecording: 'Aufnahmequalität ist niedrig',
  },

  // Completion
  completion: {
    title: 'Sitzung abgeschlossen!',
    summary: 'Zusammenfassung',
    totalItems: 'Geübte Elemente insgesamt',
    totalTime: 'Gesamte Übungszeit',
    averageScore: 'Durchschnittliche Punktzahl',
    improvements: 'Verbesserungen',
    nextSteps: 'Nächste Schritte',
    viewDetails: 'Detaillierte Ergebnisse anzeigen',
    startNew: 'Neue Sitzung starten',
  },

  // Empty States
  empty: {
    noItems: 'Keine Elemente zum Üben',
    noResults: 'Noch keine Ergebnisse',
    noSessions: 'Keine Übungssitzungen',
    startFirst: 'Starten Sie Ihre erste Sitzung',
  },

  // Dialogs
  dialogs: {
    abandon: {
      title: 'Sitzung abbrechen?',
      message:
        'Möchten Sie diese Sitzung wirklich abbrechen? Der gesamte Fortschritt geht verloren.',
      confirm: 'Ja, abbrechen',
      cancel: 'Nein, fortsetzen',
    },
    complete: {
      title: 'Sitzung abschließen?',
      message: 'Haben Sie alle Elemente abgeschlossen?',
      confirm: 'Ja, abschließen',
      cancel: 'Noch nicht',
    },
  },

  // Instructions
  instructions: {
    title: 'Übungsanleitung',
    step1: '1. Starten Sie die Aufnahme zu Beginn',
    step2: '2. Lesen Sie jedes Element deutlich',
    step3: '3. Navigieren Sie durch alle Elemente',
    step4: '4. Schließen Sie die Sitzung ab, wenn fertig',
    tips: 'Tipps für bessere Ergebnisse',
  },
} as const
