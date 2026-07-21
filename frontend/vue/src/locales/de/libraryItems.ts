/**
 * Library Items Translations (German)
 *
 * Translation keys for library items UI.
 *
 * @module locales/de
 */

export default {
  title: 'Bibliothekselemente',
  subtitle: 'Wiederverwendbare Übungsinhalte verwalten',

  columns: {
    id: 'ID',
    itemType: 'Typ',
    textPreview: 'Inhaltsvorschau',
    languages: 'Sprachen',
    repetitions: 'Wiederholungen',
    duration: 'Dauer',
    displayOrder: 'Reihenfolge',
    createdAt: 'Erstellt',
    updatedAt: 'Aktualisiert',
  },

  itemTypes: {
    movement: 'Bewegung',
    speech_practice: 'Sprechübung',
    information: 'Information',
    minimal_pair: 'Minimalpaar',
    word: 'Wort',
    sentence: 'Satz',
    breathing: 'Atmung',
    vocalization: 'Stimmbildung',
    articulation: 'Artikulation',
    rhythm: 'Rhythmus',
    intonation: 'Intonation',
  },

  languages: {
    de: 'Deutsch',
    en: 'Englisch',
    fr: 'Französisch',
    es: 'Spanisch',
    it: 'Italienisch',
  },

  form: {
    title: {
      create: 'Bibliothekselement erstellen',
      edit: 'Bibliothekselement bearbeiten',
      view: 'Bibliothekselement anzeigen',
    },
    subtitle: {
      edit: 'Element bearbeiten: {id}',
      view: 'Element anzeigen: {id}',
    },
    fields: {
      itemType: 'Elementtyp',
      instructionId: 'Anweisungs-ID',
      displayOrder: 'Anzeigereihenfolge',
      repetitions: 'Wiederholungen',
      duration: 'Dauer',
      language: 'Sprache',
      textContent: 'Textinhalt',
      audioUrl: 'Audio-URL',
      videoUrl: 'Video-URL',
      imageUrl: 'Bild-URL',
      phoneticTranscription: 'Phonetische Transkription',
      difficultyNotes: 'Schwierigkeitshinweise',
    },
    labels: {
      itemType: 'Elementtyp',
      instruction: 'Anweisung',
      displayOrder: 'Anzeigereihenfolge',
      repetitions: 'Wiederholungen',
      duration: 'Dauer (Sekunden)',
      metadata: 'Metadaten',
      contents: 'Inhalte',
      language: 'Sprache',
      textContent: 'Textinhalt',
      audioFile: 'Audiodatei',
      videoFile: 'Videodatei',
      imageFile: 'Bilddatei',
      phoneticTranscription: 'Phonetische Transkription',
      difficultyNotes: 'Schwierigkeitshinweise',
    },
    placeholders: {
      itemType: 'Wählen Sie einen Elementtyp',
      instruction: 'Wählen Sie eine Anweisung (optional)',
      displayOrder: 'z.B. 0, 1, 2...',
      repetitions: 'z.B. 3, 5, 10',
      duration: 'z.B. 30, 60',
      textContent: 'Geben Sie den Textinhalt ein',
      audioFile: 'Wählen Sie eine Audiodatei',
      phoneticTranscription: 'z.B. [mʊnt ˈœfnən]',
      difficultyNotes: 'Schwierigkeitshinweise für diese Sprache',
      search: 'Bibliothekselemente durchsuchen...',
    },
    hints: {
      itemType: 'Die Art des Übungsinhalts',
      instruction: 'Verknüpfen Sie mit einer Anweisung',
      instructionId: 'Optionaler UUID-Verweis auf eine vorhandene Übungsanweisung (erweitert)',
      displayOrder: 'Bestimmt die Anzeigereihenfolge',
      repetitions: 'Wie oft soll dieses Element wiederholt werden',
      duration: 'Dauer in Sekunden für das Timing',
      metadata: 'Zusätzliche Metadaten als JSON',
      contents: 'Inhalte für verschiedene Sprachen',
      multiLanguage: 'Sie können Inhalte für mehrere Sprachen hinzufügen',
    },
    sections: {
      basic: 'Grundinformationen',
      execution: 'Ausführungseinstellungen',
      content: 'Mehrsprachiger Inhalt',
      metadata: 'Metadaten',
    },
  },

  validation: {
    itemTypeRequired: 'Elementtyp ist erforderlich',
    textContentRequired: 'Textinhalt ist erforderlich',
    languageRequired: 'Sprache ist erforderlich',
    languageDuplicate: 'Sprache existiert bereits',
    displayOrderMin: 'Anzeigereihenfolge muss mindestens 0 sein',
    repetitionsMin: 'Wiederholungen müssen mindestens 1 sein',
    durationMin: 'Dauer muss mindestens 1 Sekunde sein',
    atLeastOneContent: 'Mindestens ein Inhalt ist erforderlich',
    metadataInvalid: 'Metadaten müssen gültiges JSON sein',
    uuidFormat: 'Muss ein gültiges UUID-Format sein',
  },

  actions: {
    create: 'Erstellen',
    edit: 'Bearbeiten',
    view: 'Anzeigen',
    delete: 'Löschen',
    duplicate: 'Duplizieren',
    attach: 'Anhängen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    refresh: 'Aktualisieren',
    export: 'Exportieren',
    addContent: 'Inhalt hinzufügen',
    removeContent: 'Inhalt entfernen',
    addLanguage: 'Sprache hinzufügen',
  },

  messages: {
    createSuccess: 'Bibliothekselement erfolgreich erstellt',
    updateSuccess: 'Bibliothekselement erfolgreich aktualisiert',
    deleteSuccess: 'Bibliothekselement erfolgreich gelöscht',
    duplicateSuccess: 'Bibliothekselement erfolgreich dupliziert',
    attachSuccess: 'Bibliothekselement erfolgreich angehängt',
    loadFailed: 'Fehler beim Laden des Bibliothekselements',
    createFailed: 'Fehler beim Erstellen des Bibliothekselements',
    updateFailed: 'Fehler beim Aktualisieren des Bibliothekselements',
    deleteFailed: 'Fehler beim Löschen des Bibliothekselements',
    duplicateFailed: 'Fehler beim Duplizieren des Bibliothekselements',
    attachFailed: 'Fehler beim Anhängen des Bibliothekselements',
    deleteConfirm: 'Möchten Sie dieses Bibliothekselement wirklich löschen?',
    deleteConfirmTitle: 'Element löschen',
    duplicateConfirm: 'Möchten Sie dieses Bibliothekselement duplizieren?',
    unsavedChanges: 'Sie haben ungespeicherte Änderungen',
  },

  filters: {
    title: 'Filter',
    itemType: 'Nach Typ filtern',
    language: 'Nach Sprache filtern',
    hasAudio: 'Mit Audio',
    hasVideo: 'Mit Video',
    reset: 'Filter zurücksetzen',
  },

  table: {
    noData: 'Keine Bibliothekselemente gefunden',
    loading: 'Lade Bibliothekselemente...',
    rowsPerPage: 'Zeilen pro Seite',
    of: 'von',
    emptyMessage: 'Keine Daten verfügbar',
  },

  empty: {
    title: 'Keine Bibliothekselemente',
    description: 'Erstellen Sie Ihr erstes Bibliothekselement, um loszulegen',
    action: 'Bibliothekselement erstellen',
  },

  misc: {
    times: 'mal',
    seconds: 'Sekunden',
    second: 'Sekunde',
    optional: 'optional',
    required: 'erforderlich',
  },
}
