/**
 * Patients translations (German)
 */

export default {
  title: 'Patientenverwaltung',
  subtitle: 'Patientenkonten und Grunddaten verwalten',

  search: {
    placeholder: 'Patienten suchen...',
  },

  filters: {
    status: 'Nach Status filtern',
  },

  table: {
    empty: 'Keine Patienten gefunden. Fügen Sie Ihren ersten Patienten hinzu.',
    pageReport: 'Zeige {first} bis {last} von {totalRecords} Patienten',
    columns: {
      name: 'Name',
      email: 'E-Mail',
      registeredAt: 'Registriert',
      status: 'Status',
      actions: 'Aktionen',
    },
    noName: 'Kein Name',
  },

  status: {
    all: 'Alle',
    active: 'Aktiv',
    inactive: 'Inaktiv',
  },

  fields: {
    username: 'Benutzername',
    usernamePlaceholder: 'Benutzername eingeben',
    email: 'E-Mail',
    emailPlaceholder: 'patient@beispiel.de',
    firstName: 'Vorname',
    firstNamePlaceholder: 'Vorname eingeben',
    lastName: 'Nachname',
    lastNamePlaceholder: 'Nachname eingeben',
    password: 'Passwort',
    passwordPlaceholder: 'Passwort eingeben',
    passwordHint: 'Mindestens 8 Zeichen',
    isActive: 'Konto ist aktiv',
    roles: 'Rollen',
  },

  actions: {
    addPatient: 'Patient hinzufügen',
    view: 'Details anzeigen',
    edit: 'Patient bearbeiten',
    delete: 'Patient löschen',
    clearFilters: 'Filter zurücksetzen',
  },

  dialog: {
    createTitle: 'Neuen Patienten hinzufügen',
    editTitle: 'Patient bearbeiten',
    viewTitle: 'Patientendetails',
  },

  view: {
    futureFeatures: 'Weitere Funktionen in Kürze',
    featuresDescription:
      'Trainingshistorie, Fortschrittsverfolgung und Therapieplan-Zuweisung werden in zukünftigen Updates verfügbar sein.',
  },

  validation: {
    usernameRequired: 'Benutzername ist erforderlich',
    emailRequired: 'E-Mail ist erforderlich',
    passwordRequired: 'Passwort ist erforderlich',
  },

  success: {
    created: 'Patient erfolgreich erstellt',
    updated: 'Patient erfolgreich aktualisiert',
  },

  errors: {
    loadFailed: 'Fehler beim Laden der Patienten',
    submitFailed: 'Fehler beim Speichern der Patientendaten',
  },

  delete: {
    confirmTitle: 'Patient löschen',
    confirmMessage:
      'Möchten Sie {name} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    success: 'Patient erfolgreich gelöscht',
    error: 'Fehler beim Löschen des Patienten',
  },

  placeholder: {
    title: 'Vorschau-Modus',
    description:
      'Diese Seite zeigt Beispieldaten. Die echte Patientenverwaltung wird verfügbar sein, sobald die Backend-API implementiert ist.',
  },
} as const
