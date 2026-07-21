# Localization Service

**Version**: 3.0  
**Status**: Production Ready  
**Type**: Pinia Store Service

Centralized internationalization (i18n) with translation, interpolation, number/date formatting, and locale management. Uses synchronous API after initialization with static locale loading via Vite glob imports.

## 📁 Structure

```
localization/
├── index.ts                      # Pinia store (service entry point)
├── localization.types.ts         # TypeScript interfaces
├── localization.live.ts          # Production implementation
├── localization.mock.ts          # Testing implementation
├── communication.ts              # Cross-service integration
└── __tests__/                    # Unit tests
    └── localization.spec.ts
```

### Key Components

- **Store**: Lazy-loaded service with live/mock switching
- **Translation Engine**: Key-based translation with interpolation
- **Locale Manager**: Locale detection, persistence, switching
- **Formatters**: Number and date formatting per locale
- **Communication**: Custom events for locale changes

## �� Usage

### Basic Translation

```typescript
import { useLocalizationStore } from '@/stores/localization'

const loc = useLocalizationStore()

// Initialize (auto-called by app bootstrap)
await loc.init()

// Basic translation (synchronous after init)
const saveButton = loc.t('common.save')
// 'Save' (en) or 'Speichern' (de)

const cancelButton = loc.t('common.cancel')
// 'Cancel' (en) or 'Abbrechen' (de)

// Translation with interpolation
const greeting = loc.t('auth.welcome', { name: 'John' })
// Interpolates {name} placeholder if defined in translation

const itemCount = loc.t('common.items_count', { count: 5 })
// Interpolates {count} placeholder if defined in translation
```

### Domain-Based Translation Keys

The localization system organizes translations into domain-specific modules:

```typescript
// Common UI elements
loc.t('common.save') // 'Save' / 'Speichern'
loc.t('common.cancel') // 'Cancel' / 'Abbrechen'
loc.t('common.delete') // 'Delete' / 'Löschen'
loc.t('common.loading') // 'Loading...' / 'Lädt...'

// Authentication
loc.t('auth.login') // 'Login' / 'Anmelden'
loc.t('auth.logout') // 'Logout' / 'Abmelden'
loc.t('auth.password') // 'Password' / 'Passwort'

// Navigation
loc.t('navigation.home') // 'Home' / 'Startseite'
loc.t('navigation.dashboard') // 'Dashboard' / 'Dashboard'
loc.t('navigation.settings') // 'Settings' / 'Einstellungen'

// Validation errors
loc.t('validation.required') // 'This field is required'
loc.t('validation.email') // 'Invalid email format'

// Error messages
loc.t('errors.network') // 'Network error'
loc.t('errors.server') // 'Server error'
loc.t('errors.notFound') // 'Not found'
```

### Translation Existence Check

```typescript
// Check if translation exists before using (synchronous)
const hasKey = loc.te('common.save')
if (hasKey) {
  const text = loc.t('common.save')
}

// Use for conditional rendering
if (loc.te('features.newFeature')) {
  // Show new feature UI
}
```

### Pluralization

```typescript
// Count-based translation (synchronous)
const message = loc.tc('messages.unreadCount', 3, { count: 3 })
// Interpolates {count} in translation string

const items = loc.tc('common.items', 1)
// Use singular form if translation defines it

const items = loc.tc('common.items', 5)
// Use plural form if translation defines it
```

### Translation Messages (Objects)

```typescript
// Get entire translation object (returns undefined if not found)
const validationMessages = loc.tm('validation')
if (validationMessages) {
  console.log(validationMessages)
  // {
  //   required: 'This field is required',
  //   email: 'Invalid email format',
  //   ...
  // }
}
```

### Number Formatting

```typescript
// Decimal formatting (synchronous)
const formatted = loc.n(1234.56)
// '1,234.56' (en) or '1.234,56' (de)

// Currency formatting
const price = loc.n(99.99, 'currency')
// '$99.99' (en) or '99,99 €' (de)

// Percentage formatting
const percent = loc.n(0.75, 'percent')
// '75%' (en) or '75 %' (de)
```

### Date Formatting

```typescript
const date = new Date('2025-10-16')

// Short format
const short = loc.d(date, 'short')
// '10/16/25' (en) or '16.10.25' (de)

// Medium format (default)
const medium = loc.d(date)
// 'Oct 16, 2025' (en) or '16. Okt. 2025' (de)

// Long format
const long = loc.d(date, 'long')
// 'October 16, 2025' (en) or '16. Oktober 2025' (de)

// Full format
const full = loc.d(date, 'full')
// 'Thursday, October 16, 2025' (en) or 'Donnerstag, 16. Oktober 2025' (de)
```

### Locale Management

```typescript
// Get current locale (synchronous)
const current = loc.getLocale()
// 'en' | 'de'

// Switch locale (async - loads locale if needed)
await loc.setLocale('de')
// All translations now use German

await loc.setLocale('en')
// Back to English

// Get available locales (async)
const locales = await loc.getAvailableLocales()
console.log(locales)
// [
//   { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
//   { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' }
// ]

// Get locale info (async)
const info = await loc.getLocaleInfo('de')
console.log(info)
// { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' }
```

### Configuration

```typescript
// Update configuration (async)
await loc.updateConfig({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  availableLocales: ['en', 'de'],
  persistLocale: true,
  detectBrowserLocale: true,
  storageKey: 'aki-locale',
})

// Get current config (async)
const config = await loc.getConfig()
```

### Dynamic Message Merging

```typescript
// Add custom translations at runtime (async)
await loc.mergeMessages({
  common: {
    customAction: 'Custom Action',
    customLabel: 'Custom Label',
  },
})

// Now available for translation (synchronous)
const text = loc.t('common.customAction')
```

## 🔗 Service Dependencies

### Optional Services (via Communication Layer)

The Localization service has minimal dependencies:

#### 1. Messaging Service (Optional)

Can notify users of locale changes (currently disabled by default).

**Notifications** (commented out):

- Locale change: "Switched from en to de"

**Fallback**: Silent locale switch

#### 2. Config Service (Optional)

Could provide localization configuration (not currently used).

**Fallback**: Uses default configuration

### Integration Pattern

```typescript
// communication.ts uses service registry (optional)
import { getServiceAsync } from '@/services/serviceRegistry'

// Async access to other services (non-blocking)
const messaging = await getServiceAsync('messaging')
const config = await getServiceAsync('config')
```

### Custom Events

```typescript
// Locale change emits custom event on window
window.addEventListener('locale-changed', (event) => {
  console.log('Locale changed:', event.detail)
  // { oldLocale: 'en', newLocale: 'de' }

  // React to locale change (e.g., reload data with new locale)
})
```

### Initialization Order (Service Bootstrap)

The localization service is initialized early in the app bootstrap process:

```
Phase 1: Config Service → Messaging Service → Localization Service
Phase 2: API Service, Error Service, Validation Service
Phase 3: Auth Service
```

## 🎯 Translation Structure

### Message Organization

Translations are organized into domain-specific modules:

```typescript
interface LocaleMessages {
  common: {
    save: string
    cancel: string
    delete: string
    ok: string
    loading: string
    // ... common UI elements
  }
  auth: {
    login: string
    logout: string
    password: string
    username: string
    // ... authentication
  }
  navigation: {
    home: string
    dashboard: string
    settings: string
    // ... navigation items
  }
  validation: {
    required: string
    email: string
    minLength: string
    // ... validation messages
  }
  errors: {
    network: string
    server: string
    notFound: string
    // ... error messages
  }
}
```

### File Structure

Locales are organized by language, with each domain in a separate file:

```
locales/
├── en/
│   ├── index.ts          # Aggregates all English translations
│   ├── common.ts         # Common UI elements
│   ├── auth.ts           # Authentication
│   ├── navigation.ts     # Navigation
│   ├── validation.ts     # Validation messages
│   └── errors.ts         # Error messages
└── de/
    ├── index.ts          # Aggregates all German translations
    ├── common.ts         # Gemeinsame UI-Elemente
    ├── auth.ts           # Authentifizierung
    ├── navigation.ts     # Navigation
    ├── validation.ts     # Validierungsmeldungen
    └── errors.ts         # Fehlermeldungen

// locales/en/index.ts
import common from './common.js'
import auth from './auth.js'
import navigation from './navigation.js'
import errors from './errors.js'
import validation from './validation.js'

export default {
  common,
  auth,
  navigation,
  errors,
  validation,
} as const

// locales/en/common.ts
export default {
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  ok: 'OK',
  loading: 'Loading...',
} as const

// locales/de/common.ts
export default {
  save: 'Speichern',
  cancel: 'Abbrechen',
  delete: 'Löschen',
  ok: 'OK',
  loading: 'Lädt...',
} as const
```

## ⚡ Optimizations

### 1. Static Locale Loading with Vite Glob Imports

```typescript
// Locales loaded statically at build time
const localeModules = import.meta.glob<{ default: LocaleMessages }>('@/locales/*/index.ts', {
  eager: true,
})

function loadLocale(locale: LocaleCode): LocaleMessages {
  const matchingKey = Object.keys(localeModules).find((key) =>
    key.includes(`/locales/${locale}/index.ts`)
  )
  return localeModules[matchingKey].default
}
```

**How it works**:

- Uses Vite's `import.meta.glob` with `eager: true`
- All locales bundled at build time (no dynamic imports)
- Faster loading, better tree-shaking
- No race conditions or dynamic import issues

**Impact**: More reliable builds, faster runtime performance

### 2. Synchronous Translation API

```typescript
// After initialization, all translations are synchronous
await loc.init() // Async: loads locales

// All subsequent calls are synchronous
const text = loc.t('common.save') // Sync ✅
const hasKey = loc.te('common.save') // Sync ✅
const count = loc.tc('items', 5) // Sync ✅
const price = loc.n(99.99, 'currency') // Sync ✅
```

**How it works**:

- Locales loaded once during `init()`
- Cached in memory for fast access
- No async overhead for each translation
- Simple, direct function calls

**Impact**: Better performance, simpler code, no async/await noise

### 2. Locale Persistence

```typescript
// Save to localStorage
localStorage.setItem('aki-locale', 'de')

// Load on init
const persisted = localStorage.getItem('aki-locale')
```

**How it works**:

- Saves user's locale choice to localStorage
- Restored on next app load
- Survives sessions and page reloads

**Impact**: Consistent UX across sessions

### 3. Browser Locale Detection

```typescript
// Detect browser language
const browserLang = navigator.language.split('-')[0] // 'de-DE' → 'de'
if (availableLocales.includes(browserLang)) {
  setLocale(browserLang)
}
```

**How it works**:

- Detects browser/OS language on first visit
- Falls back to default if not supported
- Can be disabled in config

**Impact**: Better first-time user experience

### 4. Fallback Mechanism

```typescript
// Try current locale first
let translation = getTranslation(key, 'de')

// Fallback to English if not found
if (!translation) {
  translation = getTranslation(key, 'en')
}

// Return key if still not found
return translation || key
```

**How it works**:

- Multi-level fallback (current → fallback → key)
- Prevents missing translation errors
- Helps identify untranslated keys in dev

**Impact**: Robust translation handling

### 5. Pre-loading Fallback Locale

```typescript
// On init, load both current and fallback
messages['de'] = await loadLocale('de') // Current
messages['en'] = await loadLocale('en') // Fallback
```

**How it works**:

- Loads fallback locale during initialization
- Available immediately when needed
- No delay for fallback translations

**Impact**: Fast fallback resolution

### 6. Reactive State Management

```typescript
// Pinia store with reactive locale tracking
const currentLocale = ref<LocaleCode>('en')

// Computed property for components
currentLocale: computed(() => currentLocale.value)

// Automatically updates when locale changes
await loc.setLocale('de')
// All components using currentLocale reactive property re-render
```

**How it works**:

- Vue 3 reactivity system
- Components can watch `loc.currentLocale`
- Automatic re-rendering on locale change
- No manual update propagation needed

**Impact**: Seamless UI updates when locale changes

## 🏗️ Architecture

### Translation Flow

```
Component calls t('common.save')
  └── Get from current locale (de)
       └── Found: 'Speichern' ✓
       └── Not found: Check fallback (en)
            └── Found: 'Save'
            └── Not found: Return key 'common.save'
  └── Interpolate parameters if provided
  └── Return translated string
```

### Locale Switching Flow

```
User clicks language switcher
  └── setLocale('de')
       └── Check if locale available
       └── Load locale if not cached
       └── Update currentLocale
       └── Persist to localStorage
       └── Emit 'locale-changed' event
       └── Components re-render with new locale
```

### Live vs Mock

```typescript
// Controlled by environment
const useLive = import.meta.env.MODE !== 'test'

// Live: Real translations from locale files
// Mock: Hardcoded test translations
```

## �� Anti-Patterns

````typescript
## 🚫 Anti-Patterns

```typescript
// ❌ Don't hardcode strings
<button>Save</button>

// ✅ Use translations
<button>{{ loc.t('common.save') }}</button>

// ❌ Don't use async for translations (they're synchronous after init)
const text = await loc.t('common.save');

// ✅ Call synchronously after initialization
const text = loc.t('common.save');

// ❌ Don't use direct imports
import enMessages from '@/locales/en';

// ✅ Use localization service
const text = loc.t('common.save');

// ❌ Don't build translation keys dynamically (hard to track)
const key = `${domain}.${action}`;
const text = loc.t(key);

// ✅ Use full keys (easier to grep/search)
const text = loc.t('common.save');

// ❌ Don't format manually
const price = `$${amount.toFixed(2)}`;
const date = new Date().toLocaleDateString();

// ✅ Use formatters
const price = loc.n(amount, 'currency');
const date = loc.d(new Date(), 'medium');

// ❌ Don't switch locale without user action
if (browser.language === 'de') {
  await loc.setLocale('de'); // Might be unexpected
}

// ✅ Detect once on first visit, then persist choice
if (firstVisit && detectBrowserLocale) {
  await loc.setLocale(detectedLocale);
}

// ❌ Don't use snake_case for translation keys
loc.t('common.save_button');

// ✅ Use camelCase for consistency
loc.t('common.saveButton');
````

````

## 💡 Best Practices

1. **Use Domain-Based Keys**: Organize by feature (`auth.login`, `navigation.home`)
2. **Provide Context**: Use descriptive keys (`validation.email` not `err1`)
3. **Use Interpolation**: Dynamic values via params, not string concatenation
4. **Format Numbers/Dates**: Use `n()` and `d()` for locale-aware formatting
5. **Check Existence**: Use `te()` for optional translations before displaying
6. **Persist Locale**: Enable `persistLocale` for better UX across sessions
7. **Fallback Locale**: Always provide English fallback for missing translations
8. **Test Translations**: Test with both locales to catch missing keys early
9. **Update Together**: Add translation keys to all locales simultaneously
10. **Listen for Changes**: React to `locale-changed` event if needed for data reload
11. **Synchronous Access**: Translations are synchronous after `init()` - don't use `await`
12. **Separate by Domain**: Keep each domain (common, auth, etc.) in separate files
13. **Use `.js` Extensions**: Import locale modules with `.js` extension for ESNext compatibility

## 🚀 Quick Start

```typescript
import { useLocalizationStore } from '@/stores/localization';

const loc = useLocalizationStore();

// Initialize (one-time, async)
await loc.init();

// Basic usage (synchronous)
const saveText = loc.t('common.save');
const greeting = loc.t('auth.welcome', { name: 'Maria' });

// Formatting (synchronous)
const price = loc.n(99.99, 'currency');
const date = loc.d(new Date(), 'medium');

// Locale switching (async)
await loc.setLocale('de');

// Listen for changes
window.addEventListener('locale-changed', (e) => {
  console.log('Switched to:', e.detail.newLocale);
});

// Reactive locale tracking
watch(() => loc.currentLocale, (newLocale) => {
  console.log('Locale changed to:', newLocale);
});
````

## 📚 Related

- **Service Registry**: `src/services/serviceRegistry.ts` - Service initialization and dependency injection
- **Locale Files**: `src/locales/` - Translation message files organized by language and domain
- **Config Service**: `src/stores/config/` - Configuration management (optional dependency)
- **Messaging Service**: `src/stores/messaging/` - User notifications (optional dependency)

---

**Version**: 3.0  
**Phase**: 1 (Foundation)  
**Dependencies**: None (Config, Messaging optional)  
**Tests**: ✅ 41/41 passing (100%)  
**Supported Locales**: English (en), German (de)  
**API Style**: Hybrid (async `init()` and `setLocale()`, synchronous translations)  
**Loading Strategy**: Static eager loading via Vite glob imports
