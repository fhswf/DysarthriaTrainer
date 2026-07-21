export default {
  title: 'Übungen',

  search: {
    placeholder: 'Übungen nach Titel, Code oder Beschreibung suchen...',
  },

  columns: {
    order: 'Reihenfolge',
    code: 'Code',
    title: 'Titel',
    category: 'Kategorie',
    difficulty: 'Schwierigkeit',
    duration: 'Dauer',
    scope: 'Umfang',
    version: 'Version',
    createdAt: 'Erstellt',
  },

  emptyState: {
    title: 'Keine Übungen gefunden',
    description: 'Erstellen Sie Ihre erste Übung',
    descriptionFiltered: 'Keine Übungen entsprechen Ihren Filtern',
    clearFilters: 'Filter löschen',
    action: 'Übung erstellen',
  },

  confirmDelete: {
    title: 'Löschen bestätigen',
    message:
      'Möchten Sie diese Übung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
  },

  confirmDeleteAll: {
    title: 'Alle löschen bestätigen',
    message: 'Möchten Sie wirklich {count} Übungen löschen?',
  },

  messages: {
    deleteSuccess: 'Übung erfolgreich gelöscht',
    exportSuccess: 'Übungen erfolgreich exportiert',
    createSuccess: 'Übung erfolgreich erstellt',
    updateSuccess: 'Übung erfolgreich aktualisiert',
  },

  errors: {
    deleteFailed: 'Fehler beim Löschen der Übung',
    exportFailed: 'Fehler beim Exportieren der Übungen',
    loadFailed: 'Fehler beim Laden der Übungen',
    createFailed: 'Fehler beim Erstellen der Übung',
    updateFailed: 'Fehler beim Aktualisieren der Übung',
  },

  difficulty: {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte',
  },

  form: {
    title: {
      create: 'Übung erstellen',
      edit: 'Übung bearbeiten',
      view: 'Übung anzeigen',
    },
    subtitle: {
      edit: 'Bearbeite Übung {id}',
      view: 'Details von Übung {id}',
    },
    sections: {
      basic: 'Grundinformationen',
      content: 'Inhalt',
      settings: 'Einstellungen',
    },
    labels: {
      category: 'Kategorie',
      exerciseCode: 'Übungscode',
      title: 'Titel',
      subtitle: 'Untertitel',
      description: 'Beschreibung',
      instructions: 'Anweisungen',
      instruction: 'Anweisung',
      items: 'Übungselemente',
      difficultyLevel: 'Schwierigkeitsgrad',
      duration: 'Geschätzte Dauer',
      isActive: 'Aktiv',
    },
    hints: {
      exerciseCode: 'Format: XX000 (z.B. LS001)',
      instructions:
        'Noch keine Anweisungen hinzugefügt. Klicken Sie auf die Schaltfläche oben, um eine hinzuzufügen.',
    },
    buttons: {
      addInstruction: 'Anweisung hinzufügen',
      addItem: 'Element hinzufügen',
    },
    validation: {
      category_required: 'Kategorie ist erforderlich',
      exerciseCode_required: 'Übungscode ist erforderlich',
      exerciseCode_pattern: 'Übungscode muss dem Format XX000 entsprechen (z.B. LS001)',
      title_required: 'Titel ist erforderlich',
      title_minLength: 'Titel muss mindestens 3 Zeichen lang sein',
      title_maxLength: 'Titel darf maximal 200 Zeichen lang sein',
      subtitle_maxLength: 'Untertitel darf maximal 200 Zeichen lang sein',
      description_maxLength: 'Beschreibung darf maximal 2000 Zeichen lang sein',
      difficultyLevel_required: 'Schwierigkeitsgrad ist erforderlich',
      difficultyLevel_invalid: 'Ungültiger Schwierigkeitsgrad',
      duration_min: 'Dauer muss mindestens 1 Minute betragen',
      duration_max: 'Dauer darf maximal 180 Minuten betragen',
      instruction_language_required: 'Sprache der Anweisung ist erforderlich',
      item_type_required: 'Elementtyp ist erforderlich',
      item_type_invalid: 'Ungültiger Elementtyp',
      display_order_required: 'Anzeigereihenfolge ist erforderlich',
      display_order_min: 'Anzeigereihenfolge muss mindestens 0 sein',
      content_language_required: 'Inhaltssprache ist erforderlich',
      text_content_required: 'Textinhalt ist erforderlich',
    },
  },

  instructions: {
    dialog: {
      titleCreate: 'Anweisungen hinzufügen',
      titleEdit: 'Anweisungen bearbeiten',
    },
    labels: {
      language: 'Sprache',
      hintText: 'Hinweistext',
      explanationText: 'Erklärungstext',
      safetyNotes: 'Sicherheitshinweise',
      preparationText: 'Vorbereitungstext',
      audioInstruction: 'Audio-Anweisung',
      image: 'Anweisungsbild',
    },
    hints: {
      noInstructions:
        'Noch keine Anweisungen hinzugefügt. Klicken Sie auf die Schaltfläche oben, um eine hinzuzufügen.',
      hintText: 'Kurzer Hinweis oder Tipp für den Benutzer...',
      hintTextDescription: 'Ein kurzer hilfreicher Tipp zur Anleitung des Benutzers',
      explanationText: 'Detaillierte Erklärung der Übung...',
      explanationTextDescription: 'Umfassende Anweisungen zur Durchführung der Übung',
      safetyNotes: 'Wichtige Sicherheitswarnungen oder Vorsichtsmaßnahmen...',
      safetyNotesDescription: 'Sicherheitsinformationen, die Benutzer beachten sollten',
      preparationText: 'Vorbereitungsschritte vor Beginn der Übung...',
      preparationTextDescription: 'Anweisungen zur Vorbereitung auf die Übung',
      audioUrl: 'Audio-Datei-URL eingeben oder hochladen',
      imageUrl: 'Bild-URL eingeben oder hochladen',
      dialogInfo:
        'Klicken Sie auf die Schaltfläche oben, um detaillierte Anweisungen mit Medien hinzuzufügen',
    },
    sections: {
      media: 'Medien',
    },
    errors: {
      languageRequired: 'Sprache ist erforderlich',
    },
  },

  items: {
    dialog: {
      titleCreate: 'Übungselement hinzufügen',
      titleEdit: 'Übungselement bearbeiten',
    },
    sections: {
      generic: 'Element-Eigenschaften',
      content: 'Typspezifischer Inhalt',
    },
    labels: {
      itemType: 'Elementtyp',
      displayOrder: 'Anzeigereihenfolge',
      repetitions: 'Wiederholungen',
      durationSeconds: 'Dauer (Sekunden)',
      targetPhoneme: 'Ziel-Phonem',
      language: 'Sprache',
      textContent: 'Textinhalt',
      phoneticTranscription: 'Phonetische Transkription',
      audioFileUrl: 'Audio-Datei-URL',
      demonstrationVideoUrl: 'Demonstrations-Video-URL',
      visualCueImageUrl: 'Visuelles Hinweisbild-URL',
      difficultyNotes: 'Schwierigkeitshinweise',
    },
    types: {
      minimalPair: 'Minimalpaar',
      word: 'Wort',
      sentence: 'Satz',
      breathing: 'Atemübung',
      vocalization: 'Stimmgebung',
      articulation: 'Artikulation',
      rhythm: 'Rhythmus',
      intonation: 'Intonation',
      movement: 'Bewegung',
      speechPractice: 'Sprechübung',
      information: 'Information',
    },
    hints: {
      noItems:
        'Noch keine Elemente hinzugefügt. Klicken Sie auf die Schaltfläche oben, um Übungselemente hinzuzufügen.',
      confirmDelete: 'Sind Sie sicher, dass Sie dieses Element löschen möchten?',
      repetitions: 'Anzahl der Wiederholungen für dieses Element (optional)',
      targetPhoneme: 'Der spezifische Laut oder das Phonem zum Üben (z.B. /s/, /r/)',
      language: 'Wählen Sie die Sprache für diesen Inhalt',
      textContent: 'Der Haupttextinhalt für dieses Element',
      phoneticTranscription: 'IPA-Phonetische Transkription (z.B. /ˈhaloː/)',
      audioFileUrl: 'URL oder Pfad zur Audiodatei',
      demonstrationVideoUrl: 'URL oder Pfad zum Demonstrationsvideo',
      visualCueImageUrl: 'URL oder Pfad zum visuellen Hinweisbild',
      difficultyNotes: 'Hinweise zum Schwierigkeitsgrad oder besondere Überlegungen',
    },
    errors: {
      itemTypeRequired: 'Elementtyp ist erforderlich',
      displayOrderInvalid: 'Anzeigereihenfolge muss 0 oder größer sein',
      textContentRequired: 'Inhaltstext ist erforderlich',
    },
    movement: {
      labels: {
        instruction: 'Bewegungsanweisung',
        demonstrationVideo: 'Demonstrationsvideo',
        image: 'Referenzbild',
      },
      hints: {
        instruction: 'Beschreiben Sie die auszuführende Bewegung...',
        instructionDescription: 'Klare Anweisungen für die Bewegungsübung',
        videoUrl: 'Video-URL eingeben oder hochladen',
        imageUrl: 'Bild-URL eingeben oder hochladen',
      },
    },
    speechPractice: {
      labels: {
        practiceText: 'Übungstext',
        phoneticTranscription: 'Phonetische Transkription (IPA)',
        difficulty: 'Schwierigkeitsgrad',
        audioExample: 'Audiobeispiel',
      },
      hints: {
        practiceText: 'Zu übender Text (Wort, Phrase oder Satz)...',
        practiceTextDescription: 'Der Text, den der Benutzer sprechen üben soll',
        phoneticTranscription: 'z.B. /ˈhaloː/ oder [p]',
        phoneticTranscriptionDescription: 'IPA-Notation zur Aussprachehilfe',
        difficultyDescription: 'Skala von 1 (leicht) bis 10 (schwierig)',
        audioUrl: 'Audio-URL eingeben oder hochladen',
      },
    },
    information: {
      labels: {
        informationText: 'Informationstext',
        infoType: 'Informationstyp',
        image: 'Unterstützendes Bild',
      },
      hints: {
        informationText: 'Bildungs- oder Kontextinformationen...',
        informationTextDescription: 'Informationen zur Anzeige für den Benutzer',
        infoTypeDescription: 'Kategorie der bereitgestellten Informationen',
        imageUrl: 'Bild-URL eingeben oder hochladen',
      },
      infoTypes: {
        tip: 'Tipp',
        warning: 'Warnung',
        note: 'Hinweis',
      },
    },
  },

  filters: {
    customFilters: 'Benutzerdefinierte Filter',
    quickFilters: 'Schnellfilter',
    dialogTitle: 'Filter anpassen',
    apply: 'Anwenden',
    cancel: 'Abbrechen',
    clear: 'Löschen',
    groups: {
      basic: 'Grundfilter',
      version: 'Version',
      dates: 'Datum',
      ungrouped: 'Weitere',
    },
    presets: {
      all: 'Alle Übungen',
      latest: 'Neueste Versionen',
      beginner: 'Anfänger',
      intermediate: 'Fortgeschritten',
      advanced: 'Experte',
      recent: 'Kürzlich (30 Tage)',
    },
    fields: {
      category: 'Kategorie',
      difficulty: 'Schwierigkeitsgrad',
      duration: 'Dauer (Minuten)',
      createdAt: 'Erstellungsdatum',
      version: 'Version',
      latestVersion: 'Nur neueste Version',
      latestVersionOnly: 'Nur neueste Version',
    },
  },
}
