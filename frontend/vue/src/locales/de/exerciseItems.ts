/**
 * Deutsche Übersetzungen für Übungseinträge
 */

export default {
  // Seitentitel
  title: 'Übungseinträge',

  // Spaltenüberschriften
  displayOrder: 'Reihenfolge',
  itemType: 'Typ',
  repetitions: 'Wiederh.',
  duration: 'Dauer',
  exerciseId: 'Übung',
  createdAt: 'Erstellt',
  updatedAt: 'Aktualisiert',

  // Eintragstypen
  itemTypes: {
    movement: 'Bewegung',
    speech_practice: 'Sprechübung',
    information: 'Information',
  },

  // Aktionen
  actions: {
    view: 'Eintrag anzeigen',
    edit: 'Eintrag bearbeiten',
    delete: 'Eintrag löschen',
    create: 'Eintrag erstellen',
  },

  // Nachrichten
  deleteConfirm: {
    title: 'Übungseintrag löschen',
    message:
      'Möchten Sie diesen Übungseintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
  },
  deleteSuccess: 'Übungseintrag erfolgreich gelöscht',
  deleteError: 'Fehler beim Löschen des Übungseintrags',
  error: 'Fehler: {message}',

  // Leere Zustände
  noItems: 'Keine Übungseinträge gefunden',
  noItemsDescription: 'Erstellen Sie Ihren ersten Übungseintrag, um zu beginnen',
}
