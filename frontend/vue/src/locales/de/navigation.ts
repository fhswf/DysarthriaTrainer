/**
 * Navigation translations (German)
 */

export default {
  home: 'Startseite',
  dashboard: 'Übersicht',
  exercises: 'Übungen',
  settings: 'Einstellungen',
  profile: 'Profil',
  users: 'Benutzer',
  reports: 'Berichte',
  help: 'Hilfe',
  about: 'Über',
  admin: 'Administration',

  // Leerer Zustand
  noNavigation: 'Keine Navigation verfügbar',
  noNavigationDescription:
    'Für Ihre Rolle sind keine Navigationselemente verfügbar. Bitte kontaktieren Sie Ihren Administrator, wenn Sie glauben, dass dies ein Fehler ist.',

  // Navbar-spezifische Übersetzungen
  navbar: {
    appName: 'AKI Sprachtraining',
    menu: {
      home: 'Startseite',
      exerciseCategories: 'Übungskategorien',
      exercises: 'Übungen',
      exerciseSelection: 'Übung auswählen',
      exerciseItems: 'Übungseinträge',
      mediaFiles: 'Mediendateien',
      recordings: 'Aufnahmen',
      practiceSessions: 'Übungssitzungen',
    },
    userMenu: {
      profile: 'Benutzerdetails',
      logout: 'Abmelden',
    },
  },
} as const
