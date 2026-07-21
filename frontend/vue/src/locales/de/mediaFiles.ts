export default {
  title: 'Mediendateien',

  // Column headers
  fileType: 'Typ',
  filename: 'Dateiname',
  mimeType: 'Format',
  fileSize: 'Größe',
  duration: 'Dauer',
  dimensions: 'Abmessungen',
  createdAt: 'Erstellt',

  // File type labels
  fileTypes: {
    image: 'Bild',
    audio: 'Audio',
    video: 'Video',
  },

  // Actions
  actions: {
    view: 'Details anzeigen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    upload: 'Datei hochladen',
    download: 'Herunterladen',
  },

  // Delete confirmation
  deleteConfirm: {
    title: 'Mediendatei löschen',
    message:
      'Möchten Sie diese Datei wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    confirm: 'Löschen',
    cancel: 'Abbrechen',
  },

  // Success messages
  success: {
    uploaded: 'Datei erfolgreich hochgeladen',
    deleted: 'Datei erfolgreich gelöscht',
    updated: 'Datei erfolgreich aktualisiert',
  },

  // Error messages
  error: 'Fehler: {message}',
  errors: {
    uploadFailed: 'Hochladen der Datei fehlgeschlagen',
    deleteFailed: 'Löschen der Datei fehlgeschlagen',
    loadFailed: 'Laden der Mediendateien fehlgeschlagen',
    invalidFileType: 'Ungültiger Dateityp',
    fileTooLarge: 'Datei ist zu groß',
  },

  // Empty states
  empty: {
    title: 'Keine Mediendateien',
    message: 'Laden Sie Ihre erste Mediendatei hoch, um loszulegen',
  },
} as const
