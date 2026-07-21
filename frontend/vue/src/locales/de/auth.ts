/**
 * Authentication translations (German)
 */

export default {
  appTitle: 'AKI Sprachtraining',
  login: 'Anmelden',
  logout: 'Abmelden',
  username: 'Benutzername',
  rememberMe: 'Angemeldet bleiben',
  loginSuccess: 'Erfolgreich angemeldet',
  loginFailed: 'Anmeldung fehlgeschlagen',
  logoutSuccess: 'Erfolgreich abgemeldet',
  logoutFailed: 'Abmeldung fehlgeschlagen',
  sessionExpired: 'Sitzung abgelaufen',
  unauthorized: 'Nicht autorisiert',
  invalidCredentials: 'Ungültige Anmeldedaten',
  passwordRequired: 'Passwort erforderlich',
  usernameRequired: 'Benutzername erforderlich',

  // Nachrichten
  welcomeBack: 'Willkommen zurück, {username}!',
  sessionExpiredMessage: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
  authenticationRequired: 'Authentifizierung erforderlich',
  pleaseLogin: 'Bitte melden Sie sich an, um fortzufahren',
  passwordChanged: 'Passwort geändert',
  passwordChangedSuccess: 'Ihr Passwort wurde erfolgreich aktualisiert',

  // Fields
  fields: {
    email: 'E-Mail',
    username: 'Benutzername',
    password: 'Passwort',
    confirmPassword: 'Passwort bestätigen',
    fullName: 'Vollständiger Name',
  },

  // Placeholders
  placeholders: {
    email: 'E-Mail eingeben',
    username: 'Benutzername wählen',
    password: 'Passwort eingeben',
    confirmPassword: 'Passwort bestätigen',
    fullName: 'Vollständigen Namen eingeben (optional)',
  },

  // Login-Seite
  loginPage: {
    title: 'Willkommen zurück',
    subtitle: 'Melden Sie sich in Ihrem Konto an',
    signIn: 'Anmelden',
    forgotPassword: 'Passwort vergessen?',
    noAccount: 'Noch kein Konto?',
    createAccount: 'Konto erstellen',
    quickTestLogin: 'Schnell-Test-Anmeldung:',
    testUser: 'Benutzer',
    testTherapist: 'Therapeut',
    testAdmin: 'Administrator',
  },

  // Registration
  register: {
    title: 'Konto erstellen',
    subtitle: 'Registrieren Sie sich, um zu beginnen',
    submit: 'Konto erstellen',
    haveAccount: 'Haben Sie bereits ein Konto?',
    loginLink: 'Anmelden',
  },

  // Password strength
  password: {
    requirements: 'Passwort-Anforderungen',
    minLength: 'Mindestens 8 Zeichen',
    uppercase: 'Mindestens ein Großbuchstabe',
    lowercase: 'Mindestens ein Kleinbuchstabe',
    number: 'Mindestens eine Zahl',
    special: 'Mindestens ein Sonderzeichen (!@#$%^&*)',
    weak: 'Schwach',
    medium: 'Mittel',
    strong: 'Stark',
  },

  // Email-Verifizierung
  verifyEmail: {
    verifying: 'E-Mail wird verifiziert',
    pleaseWait: 'Bitte warten Sie, während wir Ihre E-Mail-Adresse verifizieren...',
    goToLogin: 'Zur Anmeldung',
    requestNew: 'Neue Verifizierungs-E-Mail anfordern',
    redirecting: 'Weiterleitung zur Anmeldung in {seconds} Sekunden...',
    success: {
      title: 'E-Mail verifiziert!',
      message: 'Ihre E-Mail wurde erfolgreich verifiziert. Sie können sich jetzt anmelden.',
      toast: 'E-Mail erfolgreich verifiziert!',
    },
    error: {
      title: 'Verifizierung fehlgeschlagen',
      message:
        'Wir konnten Ihre E-Mail nicht verifizieren. Der Link ist möglicherweise abgelaufen oder ungültig.',
      invalidToken: 'Der Verifizierungslink ist ungültig.',
      expiredToken: 'Der Verifizierungslink ist abgelaufen. Bitte fordern Sie einen neuen an.',
      alreadyVerified: 'Diese E-Mail-Adresse wurde bereits verifiziert.',
      notFound: 'Verifizierungstoken nicht gefunden.',
      network: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    },
    invalid: {
      title: 'Ungültiger Verifizierungslink',
      message:
        'Der Verifizierungslink fehlt oder ist ungültig. Bitte überprüfen Sie Ihre E-Mail für den korrekten Link.',
    },
  },

  // Passwort vergessen
  forgotPassword: {
    title: 'Passwort vergessen?',
    subtitle: 'Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Link zum Zurücksetzen',
    submit: 'Link zum Zurücksetzen senden',
    backToLogin: 'Zurück zur Anmeldung',
    noAccount: 'Noch kein Konto?',
    registerLink: 'Registrieren',
    rememberPassword: 'Passwort wieder eingefallen?',
    loginLink: 'Anmelden',
    securityNote: 'Aus Sicherheitsgründen geben wir nicht bekannt, ob ein Konto existiert.',
    success: {
      title: 'Überprüfen Sie Ihre E-Mail',
      message:
        'Falls ein Konto mit dieser E-Mail existiert, haben wir Anweisungen zum Zurücksetzen des Passworts gesendet.',
      securityNote: 'Aus Sicherheitsgründen geben wir nicht bekannt, ob ein Konto existiert.',
      toast: 'E-Mail zum Zurücksetzen des Passworts gesendet',
    },
    errors: {
      emailRequired: 'E-Mail ist erforderlich',
      emailInvalid: 'Ungültiges E-Mail-Format',
      network: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    },
  },

  // Passwort zurücksetzen
  resetPassword: {
    title: 'Passwort zurücksetzen',
    subtitle: 'Geben Sie Ihr neues Passwort unten ein',
    newPassword: 'Neues Passwort',
    submit: 'Passwort zurücksetzen',
    goToLogin: 'Zur Anmeldung',
    requestNew: 'Neuen Zurücksetzungslink anfordern',
    redirecting: 'Weiterleitung zur Anmeldung in {seconds} Sekunden...',
    sessionNote:
      'Aus Sicherheitsgründen werden alle aktiven Sitzungen nach dem Zurücksetzen des Passworts ungültig.',
    success: {
      title: 'Passwort erfolgreich zurückgesetzt!',
      message:
        'Ihr Passwort wurde zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.',
      toast: 'Passwort erfolgreich zurückgesetzt!',
    },
    invalid: {
      title: 'Ungültiger Zurücksetzungslink',
      message:
        'Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.',
    },
    errors: {
      passwordRequired: 'Passwort ist erforderlich',
      confirmRequired: 'Bitte bestätigen Sie Ihr Passwort',
      passwordMismatch: 'Passwörter stimmen nicht überein',
      invalidToken: 'Der Zurücksetzungslink ist ungültig.',
      expiredToken: 'Der Zurücksetzungslink ist abgelaufen. Bitte fordern Sie einen neuen an.',
      weakPassword: 'Passwort erfüllt nicht die Sicherheitsanforderungen.',
      notFound: 'Zurücksetzungstoken nicht gefunden.',
      network: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    },
  },
} as const
