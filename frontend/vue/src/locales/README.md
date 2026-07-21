# Locales Module# Translation Files



**Version**: 2.0  This directory contains all translation files organized by locale and domain.

**Status**: Production Ready  

**Type**: Translation Files## Structure



Organized translation files for internationalization across all locales and message domains.```

locales/

## 📁 Structure├── en/                     # English translations

│   ├── common.ts          # Common UI elements

```│   ├── auth.ts            # Authentication

locales/│   ├── navigation.ts      # Navigation items

├── README.md              # This file│   ├── patients.ts        # Patient management

├── en/                    # English translations│   ├── validation.ts      # Validation messages

│   ├── common.ts         # General UI elements│   ├── errors.ts          # Error messages

│   ├── auth.ts           # Authentication│   ├── messages.ts        # User messages

│   ├── navigation.ts     # Navigation menu│   └── index.ts           # Exports all English modules

│   ├── patients.ts       # Patient management└── de/                     # German translations

│   ├── validation.ts     # Validation messages    ├── common.ts          # Allgemeine UI-Elemente

│   ├── errors.ts         # Error messages    ├── auth.ts            # Authentifizierung

│   ├── messages.ts       # User notifications    ├── navigation.ts      # Navigationselemente

│   └── index.ts          # Exports all domains    ├── patients.ts        # Patientenverwaltung

└── de/                    # German translations    ├── validation.ts      # Validierungsmeldungen

    ├── common.ts         # Allgemeine UI-Elemente    ├── errors.ts          # Fehlermeldungen

    ├── auth.ts           # Authentifizierung    ├── messages.ts        # Benutzermeldungen

    ├── navigation.ts     # Navigationsmenü    └── index.ts           # Exportiert alle deutschen Module

    ├── patients.ts       # Patientenverwaltung```

    ├── validation.ts     # Validierungsmeldungen

    ├── errors.ts         # Fehlermeldungen## Translation Domains

    ├── messages.ts       # Benutzerbenachrichtigungen

    └── index.ts          # Exportiert alle Domänen### common.ts

```General UI elements used throughout the application.



### Key Components**Keys**: ok, cancel, save, delete, edit, create, update, search, filter, close, yes, no, loading, error, success, warning, info, confirm, back, next



- **7 Message Domains**: Common, Auth, Navigation, Patients, Validation, Errors, Messages**Usage**:

- **2 Locales**: English (en), German (de)```typescript

- **~100 Keys per Locale**: Complete translation coverageawait loc.t('common.save'); // → "Save" / "Speichern"

- **Type Safety**: TypeScript exports with `as const`await loc.t('common.cancel'); // → "Cancel" / "Abbrechen"

```

## 🚀 Usage

### auth.ts

### Accessing TranslationsAuthentication-related translations.



```typescript**Keys**: login, logout, username, password, rememberMe, forgotPassword, loginSuccess, loginFailed, logoutSuccess, sessionExpired, unauthorized, invalidCredentials, passwordRequired, usernameRequired

import { useLocalizationStore } from '@/v2/stores/localization';

**Usage**:

const loc = useLocalizationStore();```typescript

await loc.t('auth.login'); // → "Login" / "Anmelden"

// Simple translationawait loc.t('auth.invalidCredentials'); // → "Invalid credentials" / "Ungültige Anmeldedaten"

await loc.t('common.save');        // → "Save" / "Speichern"```

await loc.t('auth.login');         // → "Login" / "Anmelden"

### navigation.ts

// With interpolationNavigation menu items and sections.

await loc.t('validation.required', { field: 'Email' });

// → "Email is required" / "E-Mail ist erforderlich"**Keys**: home, dashboard, patients, settings, profile, users, reports, help, about, admin



await loc.t('validation.minLength', { field: 'Password', min: '8' });**Usage**:

// → "Password must be at least 8 characters"```typescript

await loc.t('navigation.dashboard'); // → "Dashboard" / "Übersicht"

// Pluralizationawait loc.t('navigation.patients'); // → "Patients" / "Patienten"

await loc.tc('messages.itemsSelected', 5);```

// → "5 items selected" / "5 Elemente ausgewählt"

```### patients.ts

Patient management interface.

### Using in Components

**Keys**: title, create, edit, delete, list, details, search, firstName, lastName, dateOfBirth, address, phone, email, notes, status

```vue

<template>**Usage**:

  <div>```typescript

    <h1>{{ t('patients.title') }}</h1>await loc.t('patients.title'); // → "Patients" / "Patienten"

    <button @click="save">{{ t('common.save') }}</button>await loc.t('patients.firstName'); // → "First Name" / "Vorname"

    <p v-if="error">{{ t('errors.saveFailed') }}</p>```

  </div>

</template>### validation.ts

Form validation messages. Most support parameter interpolation.

<script setup lang="ts">

import { ref } from 'vue';**Keys**: required, email, minLength, maxLength, pattern, min, max, custom, unique, numeric

import { useLocalizationStore } from '@/v2/stores/localization';

**Usage**:

const loc = useLocalizationStore();```typescript

const error = ref(false);await loc.t('validation.required', { field: 'Email' }); 

// → "Email is required" / "E-Mail ist erforderlich"

// Create async wrapper for template usage

const t = (key: string, params?: Record<string, any>) => {await loc.t('validation.minLength', { field: 'Password', min: '8' });

  return loc.t(key, params);// → "Password must be at least 8 characters" / "Passwort muss mindestens 8 Zeichen lang sein"

};```



const save = async () => {### errors.ts

  try {Error messages for various failure scenarios.

    // Save logic

  } catch (err) {**Keys**: title, network, server, notFound, unauthorized, forbidden, timeout, unknown, validationFailed, saveFailed, loadFailed, deleteFailed, updateFailed, createFailed, invalidData

    error.value = true;

  }**Usage**:

};```typescript

</script>await loc.t('errors.network'); // → "Network error" / "Netzwerkfehler"

```await loc.t('errors.unauthorized'); // → "Unauthorized access" / "Nicht autorisierter Zugriff"

```

## 📚 Message Domains

### messages.ts

### 1. common.ts - General UIUser-facing messages and notifications. Many support parameter interpolation.



**20 Keys**: ok, cancel, save, delete, edit, create, update, search, filter, close, yes, no, loading, error, success, warning, info, confirm, back, next**Keys**: welcome, saveSuccess, deleteSuccess, updateSuccess, createSuccess, loadSuccess, confirmDelete, confirmAction, noData, selectItem, processingRequest, operationCancelled, changesNotSaved, leavePage, itemsSelected



```typescript**Usage**:

// en/common.ts```typescript

export default {await loc.t('messages.welcome', { name: 'John' }); 

  ok: 'OK',// → "Welcome, John!" / "Willkommen, John!"

  cancel: 'Cancel',

  save: 'Save',await loc.t('messages.saveSuccess'); 

  delete: 'Delete',// → "Saved successfully" / "Erfolgreich gespeichert"

  loading: 'Loading...',

  // ...await loc.tc('messages.itemsSelected', 5);

} as const;// → "5 items selected" / "5 Elemente ausgewählt"

```

// de/common.ts

export default {## Adding New Translations

  ok: 'OK',

  cancel: 'Abbrechen',See the [Localization Service README](../../stores/localization/README.md) for comprehensive guides on:

  save: 'Speichern',- Adding keys to existing domains

  delete: 'Löschen',- Creating new translation domains

  loading: 'Lädt...',- Adding new locales

  // ...- Translation guidelines

} as const;- Quality assurance

```

## Quick Reference

**Usage**:

```typescript**Service Documentation**: [`stores/localization/README.md`](../../stores/localization/README.md)

await loc.t('common.save');     // Button labels

await loc.t('common.loading');  // Loading states**Current Coverage**:

await loc.t('common.confirm');  // Confirmations- Locales: 2 (English, German)

```- Domains: 7

- Total Keys: ~100 per locale

### 2. auth.ts - Authentication- Coverage: 100%


**14 Keys**: login, logout, username, password, rememberMe, forgotPassword, loginSuccess, loginFailed, logoutSuccess, sessionExpired, unauthorized, invalidCredentials, passwordRequired, usernameRequired

```typescript
// en/auth.ts
export default {
  login: 'Login',
  logout: 'Logout',
  username: 'Username',
  password: 'Password',
  invalidCredentials: 'Invalid credentials',
  // ...
} as const;
```

**Usage**:
```typescript
await loc.t('auth.login');              // Login button
await loc.t('auth.invalidCredentials'); // Error message
await loc.t('auth.sessionExpired');     // Session timeout
```

### 3. navigation.ts - Navigation Menu

**10 Keys**: home, dashboard, patients, settings, profile, users, reports, help, about, admin

```typescript
// en/navigation.ts
export default {
  home: 'Home',
  dashboard: 'Dashboard',
  patients: 'Patients',
  settings: 'Settings',
  // ...
} as const;
```

**Usage**:
```typescript
await loc.t('navigation.dashboard');  // Menu item
await loc.t('navigation.patients');   // Page title
```

### 4. patients.ts - Patient Management

**15 Keys**: title, create, edit, delete, list, details, search, firstName, lastName, dateOfBirth, address, phone, email, notes, status

```typescript
// en/patients.ts
export default {
  title: 'Patients',
  create: 'Create Patient',
  firstName: 'First Name',
  lastName: 'Last Name',
  // ...
} as const;
```

**Usage**:
```typescript
await loc.t('patients.title');     // Page heading
await loc.t('patients.firstName'); // Form label
await loc.t('patients.create');    // Button text
```

### 5. validation.ts - Form Validation

**10 Keys**: required, email, minLength, maxLength, pattern, min, max, custom, unique, numeric

**Supports interpolation** with `{field}`, `{min}`, `{max}` parameters.

```typescript
// en/validation.ts
export default {
  required: '{field} is required',
  email: 'Invalid email address',
  minLength: '{field} must be at least {min} characters',
  maxLength: '{field} cannot exceed {max} characters',
  // ...
} as const;
```

**Usage**:
```typescript
await loc.t('validation.required', { field: 'Email' });
// → "Email is required"

await loc.t('validation.minLength', { field: 'Password', min: '8' });
// → "Password must be at least 8 characters"

await loc.t('validation.maxLength', { field: 'Bio', max: '500' });
// → "Bio cannot exceed 500 characters"
```

### 6. errors.ts - Error Messages

**15 Keys**: title, network, server, notFound, unauthorized, forbidden, timeout, unknown, validationFailed, saveFailed, loadFailed, deleteFailed, updateFailed, createFailed, invalidData

```typescript
// en/errors.ts
export default {
  title: 'Error',
  network: 'Network error',
  server: 'Server error',
  notFound: 'Resource not found',
  unauthorized: 'Unauthorized access',
  timeout: 'Request timeout',
  // ...
} as const;
```

**Usage**:
```typescript
await loc.t('errors.network');      // Connection error
await loc.t('errors.unauthorized'); // 401 error
await loc.t('errors.saveFailed');   // Save failure
```

### 7. messages.ts - User Messages

**15 Keys**: welcome, saveSuccess, deleteSuccess, updateSuccess, createSuccess, loadSuccess, confirmDelete, confirmAction, noData, selectItem, processingRequest, operationCancelled, changesNotSaved, leavePage, itemsSelected

**Supports interpolation** with `{name}`, `{count}`, etc.

```typescript
// en/messages.ts
export default {
  welcome: 'Welcome, {name}!',
  saveSuccess: 'Saved successfully',
  confirmDelete: 'Are you sure you want to delete this item?',
  itemsSelected: '{count} items selected',
  // ...
} as const;
```

**Usage**:
```typescript
await loc.t('messages.welcome', { name: 'John' });
// → "Welcome, John!"

await loc.t('messages.saveSuccess');
// → "Saved successfully"

await loc.tc('messages.itemsSelected', 5);
// → "5 items selected"
```

## ➕ Adding Translations

### Adding Keys to Existing Domain

```typescript
// 1. Add to English (en/common.ts)
export default {
  // ... existing keys
  refresh: 'Refresh',
  reset: 'Reset',
} as const;

// 2. Add to German (de/common.ts)
export default {
  // ... existing keys
  refresh: 'Aktualisieren',
  reset: 'Zurücksetzen',
} as const;

// 3. Use in code
await loc.t('common.refresh');  // → "Refresh" / "Aktualisieren"
```

### Creating New Domain

```typescript
// 1. Create en/reports.ts
export default {
  title: 'Reports',
  generate: 'Generate Report',
  export: 'Export',
  dateRange: 'Date Range',
} as const;

// 2. Create de/reports.ts
export default {
  title: 'Berichte',
  generate: 'Bericht erstellen',
  export: 'Exportieren',
  dateRange: 'Zeitraum',
} as const;

// 3. Add to en/index.ts
import reports from './reports';

export default {
  common,
  auth,
  // ...
  reports,  // Add here
} as const;

// 4. Add to de/index.ts
import reports from './reports';

export default {
  common,
  auth,
  // ...
  reports,  // Add here
} as const;

// 5. Use in code
await loc.t('reports.title');     // → "Reports" / "Berichte"
await loc.t('reports.generate');  // → "Generate Report" / "Bericht erstellen"
```

### Adding New Locale

```typescript
// 1. Create locale folder
mkdir src/v2/locales/fr

// 2. Create domain files (fr/common.ts, fr/auth.ts, etc.)
// Copy structure from en/ and translate

// 3. Create fr/index.ts
import common from './common';
import auth from './auth';
// ... all domains

export default {
  common,
  auth,
  // ... all domains
} as const;

// 4. Register locale in Localization Service
// See stores/localization/README.md for details

// 5. Use new locale
await loc.setLocale('fr');
```

## 💡 Best Practices

1. **Use Nested Keys**
   ```typescript
   // ✅ Good - Clear domain separation
   await loc.t('auth.login');
   await loc.t('patients.firstName');
   
   // ❌ Bad - Flat structure
   await loc.t('login');
   await loc.t('firstName');
   ```

2. **Keep Keys Lowercase**
   ```typescript
   // ✅ Good
   firstName: 'First Name'
   
   // ❌ Bad
   FirstName: 'First Name'
   ```

3. **Use `as const` for Type Safety**
   ```typescript
   // ✅ Good - Readonly types
   export default {
     save: 'Save',
   } as const;
   
   // ❌ Bad - Mutable
   export default {
     save: 'Save',
   };
   ```

4. **Support Interpolation**
   ```typescript
   // ✅ Good - Flexible
   required: '{field} is required'
   
   // ❌ Bad - Hardcoded
   emailRequired: 'Email is required'
   passwordRequired: 'Password is required'
   ```

5. **Maintain 100% Coverage**
   ```typescript
   // Every key in en/ must exist in de/
   // Use same key names across all locales
   ```

6. **Keep Translations Concise**
   ```typescript
   // ✅ Good
   save: 'Save'
   
   // ❌ Bad - Too verbose
   save: 'Click here to save your changes'
   ```

7. **Group Related Keys**
   ```typescript
   // ✅ Good - Organized by feature
   // auth.ts: All auth-related
   // patients.ts: All patient-related
   
   // ❌ Bad - Mixed domains
   // common.ts: login, patientName, saveButton...
   ```

8. **Document Complex Interpolations**
   ```typescript
   // Add JSDoc comments for complex placeholders
   /**
    * @param {name} string - User's full name
    * @param {count} number - Number of items
    */
   welcome: 'Welcome back, {name}! You have {count} notifications.'
   ```

## 🚫 Anti-Patterns

```typescript
// ❌ Don't hardcode strings in components
<button>Save</button>

// ✅ Use translations
<button>{{ t('common.save') }}</button>

// ❌ Don't duplicate translations
cancel: 'Cancel',
cancelButton: 'Cancel',
cancelAction: 'Cancel',

// ✅ Use one key
cancel: 'Cancel',

// ❌ Don't mix languages in one file
export default {
  save: 'Save',
  speichern: 'Speichern',  // Wrong!
};

// ✅ Separate by locale
// en/common.ts → save: 'Save'
// de/common.ts → save: 'Speichern'

// ❌ Don't use different key structures
// en/common.ts
firstName: 'First Name',

// de/common.ts
vorname: 'Vorname',  // Different key!

// ✅ Use same keys
// en/common.ts
firstName: 'First Name',

// de/common.ts
firstName: 'Vorname',
```

## 📊 Current Coverage

```
Locales: 2
├─ en (English)
└─ de (German)

Domains: 7
├─ common (20 keys)
├─ auth (14 keys)
├─ navigation (10 keys)
├─ patients (15 keys)
├─ validation (10 keys)
├─ errors (15 keys)
└─ messages (15 keys)

Total: ~100 keys per locale
Coverage: 100% (all keys in all locales)
```

## 🚀 Quick Start

```typescript
// 1. Add translation to existing domain
// en/common.ts
export default {
  // ... existing
  newKey: 'New Text',
} as const;

// de/common.ts
export default {
  // ... existing
  newKey: 'Neuer Text',
} as const;

// 2. Use in component
const loc = useLocalizationStore();
const text = await loc.t('common.newKey');

// 3. With interpolation
// en/messages.ts
userGreeting: 'Hello, {name}!'

// Usage
await loc.t('messages.userGreeting', { name: 'Alice' });
// → "Hello, Alice!"
```

## 📚 Related

- [Localization Service](../stores/localization/README.md) - Service implementation
- [Forms Module](../forms/README.md) - Form validation messages
- [Auth Module](../auth/README.md) - Authentication translations

---

**Locales**: 2 (en, de)  
**Domains**: 7 (common, auth, navigation, patients, validation, errors, messages)  
**Keys**: ~100 per locale  
**Coverage**: 100%  
**Type Safety**: Full TypeScript support
