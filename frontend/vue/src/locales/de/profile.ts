/**
 * Profile translations (German)
 */

export default {
  title: 'Profil',
  subtitle: 'Verwalten Sie Ihre Kontoeinstellungen und Präferenzen',
  personalInfo: 'Persönliche Informationen',
  security: 'Sicherheit',

  // Fields
  firstName: 'Vorname',
  lastName: 'Nachname',
  enterFirstName: 'Geben Sie Ihren Vornamen ein',
  enterLastName: 'Geben Sie Ihren Nachnamen ein',
  emailNote: 'E-Mail kann nicht geändert werden',
  usernameNote: 'Benutzername kann nicht geändert werden',
  accountStatus: 'Kontostatus',
  active: 'Aktiv',
  inactive: 'Inaktiv',

  // Actions
  saveChanges: 'Änderungen speichern',
  changePassword: 'Passwort ändern',
  updatePassword: 'Passwort aktualisieren',

  // Password Dialog
  currentPassword: 'Aktuelles Passwort',
  newPassword: 'Neues Passwort',
  confirmNewPassword: 'Neues Passwort bestätigen',
  enterCurrentPassword: 'Geben Sie Ihr aktuelles Passwort ein',
  enterNewPassword: 'Geben Sie Ihr neues Passwort ein',

  // Success Messages
  updateSuccess: 'Profil erfolgreich aktualisiert',
  passwordChanged: 'Passwort erfolgreich geändert',

  // Error Messages
  updateError: 'Profil konnte nicht aktualisiert werden',
  passwordChangeError: 'Passwort konnte nicht geändert werden',

  errors: {
    currentPasswordRequired: 'Aktuelles Passwort ist erforderlich',
    currentPasswordIncorrect: 'Aktuelles Passwort ist falsch',
    newPasswordRequired: 'Neues Passwort ist erforderlich',
    confirmPasswordRequired: 'Bitte bestätigen Sie Ihr Passwort',
    passwordMismatch: 'Passwörter stimmen nicht überein',
  },
} as const
