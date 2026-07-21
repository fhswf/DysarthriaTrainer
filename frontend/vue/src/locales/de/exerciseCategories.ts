export default {
  title: 'Übungskategorien',

  search: {
    placeholder: 'Kategorien nach Name oder Beschreibung suchen...',
  },

  columns: {
    order: 'Reihenfolge',
    name: 'Name',
    slug: 'Slug',
    description: 'Beschreibung',
    icon: 'Symbol',
    createdAt: 'Erstellt',
  },

  emptyState: {
    title: 'Keine Kategorien gefunden',
    description: 'Erstellen Sie Ihre erste Übungskategorie',
    descriptionFiltered: 'Keine Kategorien entsprechen Ihrer Suche',
    clearFilters: 'Suche löschen',
    action: 'Kategorie erstellen',
  },

  confirmDelete: {
    title: 'Löschen bestätigen',
    message:
      'Möchten Sie diese Kategorie wirklich löschen? Alle Übungen in dieser Kategorie werden betroffen sein.',
  },

  confirmDeleteAll: {
    title: 'Alle löschen bestätigen',
    message: 'Möchten Sie wirklich {count} Kategorien löschen?',
  },

  form: {
    title: {
      create: 'Übungskategorie erstellen',
      edit: 'Übungskategorie bearbeiten',
      view: 'Übungskategorie anzeigen',
    },
    subtitle: {
      edit: 'Kategorie bearbeiten: {name}',
    },
    sections: {
      basic: 'Grundinformationen',
      display: 'Anzeigeeinstellungen',
    },
    labels: {
      name: 'Kategoriename',
      slug: 'URL-Slug',
      description: 'Beschreibung',
      iconUrl: 'Symbol',
      iconPreview: 'Symbolvorschau',
      displayOrder: 'Anzeigereihenfolge',
    },
    hints: {
      name: 'Ein klarer und beschreibender Name für die Kategorie',
      slug: 'URL-freundliche Kennung (Kleinbuchstaben, nur Bindestriche)',
      slugAuto: 'Automatisch aus dem Namen generiert, Sie können es anpassen',
      description: 'Optionale Beschreibung zur Erklärung des Kategorie-Zwecks',
      iconUrl: 'PrimeIcon-Klassenname (z.B. "pi pi-book")',
      displayOrder: 'Niedrigere Zahlen erscheinen zuerst (0 = oben)',
    },
    validation: {
      nameRequired: 'Kategoriename ist erforderlich',
      nameMinLength: 'Kategoriename muss mindestens {min} Zeichen lang sein',
      nameMaxLength: 'Kategoriename darf maximal {max} Zeichen lang sein',
      slugRequired: 'URL-Slug ist erforderlich',
      slugMinLength: 'URL-Slug muss mindestens {min} Zeichen lang sein',
      slugMaxLength: 'URL-Slug darf maximal {max} Zeichen lang sein',
      slugPattern: 'URL-Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten',
      descriptionMaxLength: 'Beschreibung darf maximal {max} Zeichen lang sein',
      iconPattern: 'Symbol muss eine gültige PrimeIcon-Klasse sein (z.B. "pi pi-book")',
      displayOrderRequired: 'Anzeigereihenfolge ist erforderlich',
      displayOrderInteger: 'Anzeigereihenfolge muss eine ganze Zahl sein',
      displayOrderMin: 'Anzeigereihenfolge muss mindestens {min} sein',
    },
    buttons: {
      create: 'Kategorie erstellen',
      update: 'Kategorie aktualisieren',
      cancel: 'Abbrechen',
      back: 'Zurück zur Liste',
    },
  },

  messages: {
    deleteSuccess: 'Kategorie erfolgreich gelöscht',
    exportSuccess: 'Kategorien erfolgreich exportiert',
    createSuccess: 'Kategorie erfolgreich erstellt',
    updateSuccess: 'Kategorie erfolgreich aktualisiert',
  },

  errors: {
    deleteFailed: 'Fehler beim Löschen der Kategorie',
    exportFailed: 'Fehler beim Exportieren der Kategorien',
    loadFailed: 'Fehler beim Laden der Kategorien',
    createFailed: 'Fehler beim Erstellen der Kategorie',
    updateFailed: 'Fehler beim Aktualisieren der Kategorie',
  },
}
