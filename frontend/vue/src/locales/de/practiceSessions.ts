export default {
  title: 'Übungssitzungen',

  search: {
    placeholder: 'Sitzungen durchsuchen...',
  },

  actions: {
    analyze: 'Sitzung analysieren',
    download: 'Ergebnisse herunterladen',
  },

  columns: {
    startedAt: 'Gestartet',
    status: 'Status',
    exercise: 'Übung',
    totalItems: 'Elemente',
    completedItems: 'Fortschritt',
    resultsCount: 'Ergebnisse',
    duration: 'Dauer',
    completedAt: 'Abgeschlossen',
  },

  status: {
    in_progress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    abandoned: 'Abgebrochen',
  },

  emptyState: {
    title: 'Keine Übungssitzungen gefunden',
    description: 'Starten Sie mit dem Üben, um Ihre Sitzungen hier zu sehen',
    descriptionFiltered: 'Keine Sitzungen entsprechen Ihren Filtern',
    clearFilters: 'Filter löschen',
    action: 'Übung starten',
  },

  confirmDelete: {
    title: 'Löschen bestätigen',
    message:
      'Sind Sie sicher, dass Sie diese Übungssitzung löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
  },

  confirmDeleteAll: {
    title: 'Alle löschen bestätigen',
    message: 'Sind Sie sicher, dass Sie {count} Übungssitzungen löschen möchten?',
  },

  messages: {
    deleteSuccess: 'Übungssitzung erfolgreich gelöscht',
    exportSuccess: 'Sitzungen erfolgreich exportiert',
    downloadSuccess: 'Sitzungsergebnisse erfolgreich heruntergeladen',
  },

  errors: {
    deleteFailed: 'Fehler beim Löschen der Übungssitzung',
    deleteNotImplemented: 'Löschfunktion noch nicht implementiert',
    exportFailed: 'Fehler beim Exportieren der Sitzungen',
    loadFailed: 'Fehler beim Laden der Übungssitzungen',
  },

  filters: {
    dialogTitle: 'Sitzungen filtern',
    customFilters: 'Benutzerdefinierte Filter',
    quickFilters: 'Schnellfilter',
    apply: 'Anwenden',
    cancel: 'Abbrechen',
    clear: 'Alle löschen',
    presets: {
      all: 'Alle Sitzungen',
      completed: 'Abgeschlossen',
      inProgress: 'In Bearbeitung',
      abandoned: 'Abgebrochen',
      today: 'Heute',
      thisWeek: 'Diese Woche',
      thisMonth: 'Dieser Monat',
    },
    quickPresets: {
      completedToday: 'Heute abgeschlossen',
      completedThisWeek: 'Diese Woche abgeschlossen',
    },
    fields: {
      status: 'Status',
      createdAt: 'Erstellt am',
      completedAt: 'Abgeschlossen am',
    },
    groups: {
      basic: 'Grundinformationen',
      dates: 'Datumsfilter',
      ungrouped: 'Weitere Filter',
    },
  },
}
