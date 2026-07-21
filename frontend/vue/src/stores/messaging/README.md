# Messaging Service

**Version**: 3.0  
**Status**: Production Ready  
**Type**: Pinia Store Service

Centralized message logging, toast notifications, search/filter capabilities, export functionality, and i18n integration.

## �� Structure

```
messaging/
├── index.ts                  # Pinia store (service entry point)
├── messaging.types.ts        # TypeScript interfaces
├── messaging.live.ts         # Production implementation
├── messaging.mock.ts         # Testing implementation
├── communication.ts          # Cross-service integration
├── core/
│   ├── messageLog.ts         # Message storage with LRU
│   ├── toastManager.ts       # Toast lifecycle management
│   └── debounce.ts           # Message deduplication
├── features/
│   ├── filter.ts             # Advanced filtering/grouping
│   ├── export.ts             # JSON/CSV export
│   └── localization.ts       # i18n helper
└── __tests__/
    ├── messaging.unit.spec.ts
    └── messaging.integration.spec.ts
```

### Key Components

- **Store**: Lazy-loaded service with live/mock switching based on environment
- **Message Log**: LRU cache (configurable, default 1000 messages) with search
- **Toast Manager**: PrimeVue toast integration with auto-hide
- **Debouncer**: Prevents duplicate messages (configurable window)
- **Localization Helper**: i18n integration for translated messages
- **Export Engine**: JSON/CSV export with filtering

## 🚀 Usage

### Basic Messaging

```typescript
import { useMessagingStore } from '@/stores/messaging'

const msg = useMessagingStore()

// Initialize (auto-called by app bootstrap)
await msg.initialize()

// Success message
await msg.success('Profile updated successfully')

// Info message with detail
await msg.info('Processing data', 'This may take a few moments')

// Warning
await msg.warn('Low storage space', 'Only 10% remaining')

// Error with context
await msg.error('Failed to save', 'Network timeout', {
  source: 'user-service',
  context: { errorCode: 504 },
  userId: 'user123',
  showToast: true,
})
```

### Toast Notifications

```typescript
// Success toast (default: shows toast automatically)
await msg.success('Changes saved!', undefined, {
  showToast: true,
  toastOptions: { life: 3000 },
})

// Sticky toast (no auto-hide)
await msg.warn('Session expiring soon', undefined, {
  showToast: true,
  toastOptions: { sticky: true, closable: true },
})

// Custom toast
const toast = await msg.showToast({
  severity: 'info',
  summary: 'Upload in progress',
  detail: '45% complete',
  sticky: true,
})

// Hide/clear toasts
await msg.hideToast(toast.id!)
await msg.clearToasts()
```

### Localized Messages

```typescript
// Simple localized message
await msg.successLocalized('messages.success.saved')

// With interpolation
await msg.errorLocalized('messages.error.failedToDelete', 'messages.error.networkIssue', {
  interpolation: { itemName: 'User Profile' },
  showToast: true,
})

// i18n integration
import { useLocalizationStore } from '@/stores/localization'
const loc = useLocalizationStore()
await msg.setI18n({ t: loc.t })
```

### Message Retrieval & Search

```typescript
// Get all messages
const allMessages = await msg.getAllMessages()

// Get by severity
const errors = await msg.getMessagesByLevel('error', {
  since: new Date('2025-10-01'),
  limit: 50,
})

// Search (text or regex)
const results = await msg.searchMessages('network', {
  caseSensitive: false,
  useRegex: false,
})

// Get recent messages
const lastHour = await msg.getRecentMessages('1h') // 1h, 30m, 24h
const last30Min = await msg.getRecentMessages('30m')

// Advanced filtering
const filtered = await msg.filterMessages({
  severity: ['error', 'warn'],
  since: new Date('2025-10-01'),
  limit: 100,
})

// Analytics
const grouped = await msg.groupMessagesBySeverity()
// { success: [...], info: [...], warn: [...], error: [...] }

const stats = await msg.getMessageStats()
// { success: 150, info: 420, warn: 23, error: 7 }
```

### Export & Download

```typescript
// Export to JSON
const jsonExport = await msg.exportMessages({ format: 'json' })

// Export errors to CSV
const csvExport = await msg.exportMessages({
  format: 'csv',
  severity: ['error', 'warn'],
  since: new Date('2025-10-01'),
})

// Download to file
await msg.downloadMessages('error-log.json', {
  format: 'json',
  severity: ['error'],
})
```

### Debouncing

```typescript
// Prevent duplicate messages within 1s window
for (let i = 0; i < 10; i++) {
  await msg.error('Connection lost', undefined, {
    debounce: true, // Only logs first occurrence
  })
}
// Result: Only 1 error message logged
```

## 🔗 Service Dependencies

### Optional Services (via Communication Layer)

#### 1. Config Service (Optional)

Provides messaging configuration from centralized config.

**Configuration**:

- `maxMessages`: Max history (default: 1000)
- `defaultToastLife`: Toast duration (default: 3000ms)
- `debounceTime`: Debounce window (default: 1000ms)
- `toastPosition`: Position on screen
- `enablePersistence`: Save to storage

**Fallback**: Environment variables and defaults

#### 2. Localization Service (Optional)

Required for localized message methods (`*Localized()`).

**Integration**:

```typescript
const loc = useLocalizationStore()
await msg.setI18n({ t: loc.t })
```

**Fallback**: Returns raw keys if not available

### Integration Pattern

```typescript
// communication.ts uses service registry (optional)
import { getServiceAsync } from '@/services/serviceRegistry'

const config = await getConfigService()
if (config) {
  const messagingConfig = await config.get('messaging')
}
```

### Initialization Order (Service Bootstrap)

The messaging service is initialized early in the app bootstrap:

```
Phase 1: Config Service → Messaging Service → Localization Service
Phase 2: API Service, Error Service, Validation Service
Phase 3: Auth Service
```

**Note**: Messaging is Phase 1 because other services use it for notifications.

## 📊 Message Types

### MessageLogEntry

```typescript
interface MessageLogEntry {
  id: string // msg_timestamp_random
  severity: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail?: string
  timestamp: Date
  source?: string // Service/component identifier
  context?: Record<string, any> // Extra debugging data
  userId?: string
  stack?: string // Error stack trace
}
```

### MessageOptions

```typescript
interface MessageOptions {
  source?: string
  context?: Record<string, any>
  userId?: string
  showToast?: boolean
  toastOptions?: Partial<ToastMessage>
  debounce?: boolean
  stack?: string
}
```

### ToastMessage

```typescript
interface ToastMessage {
  id?: number
  severity: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail?: string
  life?: number // Auto-hide duration (ms)
  sticky?: boolean // Prevent auto-hide
  closable?: boolean // Show close button
  group?: string // Grouping identifier
}
```

## ⚡ Optimizations

### 1. Message Debouncing

```typescript
// Creates key from severity + summary + detail
// Checks if same message logged within debounceTime
shouldDebounce(severity, summary, detail): boolean
```

**How it works**:

- Prevents duplicate messages within configurable window (default: 1s)
- Extends window on repeated attempts
- Auto-cleans expired entries

**Impact**: Prevents log flooding from repeated errors

### 2. LRU Message Log

```typescript
// New messages added to front, auto-trim to max
if (messages.length > maxMessages) {
  messages = messages.slice(0, maxMessages)
}
```

**How it works**:

- Auto-trims to maxMessages (default: 1000, configurable)
- Oldest messages dropped automatically

**Impact**: Constant memory usage, no leaks

### 3. Lazy Implementation Loading

```typescript
// Dynamic imports based on environment
const useMock = import.meta.env.VITE_MESSAGING_USE_MOCK === 'true'
implementation = useMock ? await import('./messaging.mock') : await import('./messaging.live')
```

**Impact**: Code splitting, smaller bundle, faster load

### 4. Toast Auto-Management

```typescript
// PrimeVue toast handles lifecycle automatically
toastManager.show({ severity, summary, detail, life })
```

**Impact**: No manual cleanup needed, auto-hide support

### 5. Efficient Search

```typescript
// Case-insensitive search with pre-lowercasing
const searchTerm = caseSensitive ? query : query.toLowerCase()
return summary.includes(searchTerm) || detail?.includes(searchTerm)
```

**Impact**: Fast search over thousands of messages

### 6. CSV Export Optimization

```typescript
// Only escapes when necessary (RFC 4180)
if (value.includes(',') || value.includes('"') || value.includes('\n')) {
  return `"${value.replace(/"/g, '""')}"`
}
```

**Impact**: Fast export, proper CSV format

## 🏗️ Architecture

### Message Flow

```
msg.error('Failed', 'Details', options)
  ├── Generate unique ID
  ├── Check debounce → Skip if debounced
  ├── Create MessageLogEntry
  ├── Add to MessageLog (LRU)
  ├── Show toast (if showToast=true)
  │   ├── Create ToastMessage
  │   ├── Add to ToastManager
  │   └── Set auto-hide timer
  └── Return MessageLogEntry
```

### Live vs Mock

```typescript
// Environment-based switching
const useMock = import.meta.env.VITE_MESSAGING_USE_MOCK === 'true'
// Live: Full implementation with PrimeVue integration
// Mock: Predefined messages for testing
```

## 🚫 Anti-Patterns

```typescript
// ❌ Wrong severity
await msg.info('Error occurred')

// ✅ Correct severity
await msg.error('Error occurred')

// ❌ Toast spam
await msg.info('Debug: Cache hit', undefined, { showToast: true })

// ✅ Toasts for important user actions only
await msg.success('Saved', undefined, { showToast: true })

// ❌ Hardcoded user messages
await msg.success('Saved successfully', undefined, { showToast: true })

// ✅ Localized
await msg.successLocalized('messages.success.saved', undefined, { showToast: true })

// ❌ Message spam without debounce
setInterval(() => msg.info('Heartbeat'), 100)

// ✅ Debounced repetitive messages
setInterval(() => msg.info('Heartbeat', undefined, { debounce: true }), 100)

// ❌ Sensitive data in context
await msg.error('Login failed', undefined, {
  context: { password: userPassword }, // NEVER!
})

// ✅ Safe context without sensitive data
await msg.error('Login failed', undefined, {
  context: { username, attempt: 3 },
})

// ❌ Using snake_case keys
await msg.successLocalized('messages.success.user_saved')

// ✅ Using camelCase keys
await msg.successLocalized('messages.success.userSaved')
```

## 💡 Best Practices

1. **Use Appropriate Severity**

   - `success`: Completed user actions (save, create, update)
   - `info`: Progress updates, informational messages
   - `warn`: Non-critical warnings that need attention
   - `error`: Failed operations, exceptions

2. **Provide Context for Errors**

   ```typescript
   await msg.error('API failed', error.message, {
     source: 'api-client',
     context: { endpoint, method, statusCode },
     stack: error.stack,
   })
   ```

3. **Debounce Repeated Messages**

   - Enable for network errors, polling failures, connection issues
   - Disable for unique user actions

4. **Localize User-Facing Messages**

   - Use `*Localized()` methods for toast notifications
   - Use direct strings for internal/debug logging

5. **Export for Debugging**

   ```typescript
   await msg.downloadMessages('debug.json', {
     format: 'json',
     severity: ['error', 'warn'],
   })
   ```

6. **Clean Up Long-Running Apps**

   ```typescript
   // Periodically clear old messages
   setInterval(() => msg.clearMessages(), 24 * 60 * 60 * 1000)
   ```

7. **Use Toast Life Wisely**

   - Short (3s) for success messages
   - Longer (5s) for errors and warnings
   - Sticky for critical warnings requiring user action

8. **Provide Source Identifiers**

   ```typescript
   await msg.warn('Low memory', undefined, { source: 'memory-monitor' })
   ```

9. **Use camelCase for Keys**

   - Follow JavaScript conventions: `messages.success.userSaved`
   - Not snake_case: `messages.success.user_saved`

10. **Configure via Environment**
    - Set `VITE_MESSAGING_MAX_MESSAGES` for message log size
    - Set `VITE_MESSAGING_DEBOUNCE_TIME` for debounce window
    - Set `VITE_MESSAGING_TOAST_LIFE` for default toast duration

## 🚀 Quick Start

```typescript
import { useMessagingStore } from '@/stores/messaging'

const msg = useMessagingStore()

// Initialize
await msg.initialize()

// Basic messages
await msg.success('Done!')
await msg.error('Failed', 'Network error')

// With toast notification
await msg.success('Saved!', undefined, { showToast: true })

// Localized messages
const loc = useLocalizationStore()
await msg.setI18n({ t: loc.t })
await msg.successLocalized('messages.success.saved', undefined, {
  showToast: true,
})

// Export for debugging
await msg.downloadMessages('errors.json', {
  format: 'json',
  severity: ['error', 'warn'],
})
```

## 📚 Related

- **Service Registry**: `src/services/serviceRegistry.ts` - Service initialization and dependency injection
- **Config Service**: `src/stores/config/` - Configuration management (optional dependency)
- **Localization Service**: `src/stores/localization/` - i18n integration (optional dependency)
- **PrimeVue Toast**: External dependency for toast notifications

---

**Version**: 3.0  
**Phase**: 1 (Foundation)  
**Dependencies**: None (Config, Localization optional)  
**Tests**: ✅ 19/19 passing (100%)  
**Severity Levels**: success, info, warn, error  
**Toast Integration**: PrimeVue Toast Service
