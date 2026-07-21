# Navbar Service Registry Migration

**Status**: ✅ Complete  
**Date**: October 26, 2025

---

## Problem

The navbar components were using Pinia stores directly at the module level, which caused initialization order issues:

```
Uncaught Error: [🍍]: "getActivePinia()" was called but there was no active Pinia.
Are you trying to use a store before calling "app.use(pinia)"?
```

This occurred because:
1. Navbar composables imported stores at the top level
2. These imports executed before Pinia was initialized
3. The stores tried to call `getActivePinia()` before it was available

---

## Solution

Migrated all navbar components to use the **Service Registry Pattern** as documented in `/v2/services/README.md`.

### Key Changes

**Before** (Direct Pinia Store Import):
```typescript
import { useAuthStore } from '@/v2/stores/auth';
import { useLocalizationStore } from '@/v2/stores/localization';

const auth = useAuthStore();  // ❌ Executes before Pinia init
const loc = useLocalizationStore();  // ❌ Executes before Pinia init
```

**After** (Service Registry Pattern):
```typescript
import { getServiceAsync } from '@/v2/services/serviceRegistry';
import type { useAuthStore } from '@/v2/stores/auth';
import type { useLocalizationStore } from '@/v2/stores/localization';

// Inside async functions:
const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
```

---

## Files Modified

### 1. AppNavbar.vue

**Changes**:
- Removed direct store imports: `useAuthStore()`, `useLocalizationStore()`, `useV2MessagingStore()`
- Added service registry imports: `getServiceAsync()`
- Added TypeScript type imports for type safety
- Updated all functions to fetch services async:
  - `loadLocalizedStrings()`
  - `checkUserSwitchPermissions()`
  - `handleUserSwitched()`
  - `handleLogout()`
  - `checkSwitchState()`

**Pattern Used**:
```typescript
// Type-safe service access
const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
const messaging = await getServiceAsync<ReturnType<typeof useV2MessagingStore>>('messaging');
```

### 2. useNavbarMenu.ts

**Changes**:
- Removed direct store calls at module level
- Updated `convertToPrimeMenuItem()` to fetch localization service
- Updated `loadUserProfile()` to fetch auth service
- Updated `brandLabel` computed to fetch localization service
- Removed `currentUser` computed (not needed)

**Pattern Used**:
```typescript
// Fetch service inside async functions
const loadUserProfile = async () => {
  const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
  const user = await auth.getActiveUser();
  // ...
};
```

### 3. useNavbarPermissions.ts

**Changes**:
- Removed direct `useAuthStore()` call at module level
- Updated `hasAnyPermission()` to fetch auth service
- Updated `updateAuthState()` to fetch auth service with error handling
- Removed `currentUser` computed (not needed)

**Pattern Used**:
```typescript
const hasAnyPermission = async (permissions: AccessRightId[]): Promise<boolean> => {
  if (!permissions || permissions.length === 0) return true;
  
  const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
  // Use auth service...
};
```

### 4. UserSwitchDialog.vue

**Changes**:
- Removed direct store calls: `useAuthStore()`, `useLocalizationStore()`
- Moved `UsersApi` instantiation into `loadUsers()` function
- Updated `loadTranslations()` to fetch localization service
- Updated `onSelectUser()` to fetch auth service
- Changed to emit `user-switched` event instead of page reload

**Pattern Used**:
```typescript
const loadTranslations = async () => {
  const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
  dialogTitle.value = await loc.t('userSwitch.dialog.title');
  // ...
};

const onSelectUser = async (event: any) => {
  const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
  const success = await auth.switchToUser(user.id, switchReason.value);
  if (success) {
    emit('user-switched');
  }
};
```

### 5. UserSwitchBanner.vue

**Changes**:
- Removed direct store calls: `useAuthStore()`, `useLocalizationStore()`
- Updated `loadTranslations()` to fetch localization service
- Updated `loadSwitchInfo()` to fetch auth service
- Updated `handleRevert()` to fetch auth service

**Pattern Used**:
```typescript
const loadSwitchInfo = async () => {
  const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
  isSwitched.value = auth.isUserSwitched();
  // ...
};
```

---

## Benefits

### 1. No Initialization Order Issues
- Services are fetched when needed, not at module load time
- Pinia is guaranteed to be initialized before services are accessed
- No more "getActivePinia()" errors

### 2. Type Safety
```typescript
// Full TypeScript support with ReturnType
const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
auth.login(); // ✅ Fully typed
```

### 3. Error Handling
```typescript
const updateAuthState = async () => {
  try {
    const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
    isAuthenticated.value = await auth.isAuthenticated();
  } catch (error) {
    console.error('Failed to check authentication state:', error);
    isAuthenticated.value = false;
  }
};
```

### 4. Async Waiting
- `getServiceAsync()` waits up to 10 seconds for service to be registered
- Eliminates race conditions during app startup
- Graceful timeout handling

### 5. Follows V2 Architecture
- Aligns with service infrastructure documentation
- Uses dependency injection pattern
- Consistent with other V2 services

---

## Migration Pattern

For any component using Pinia stores directly:

### Step 1: Remove Direct Imports
```typescript
// ❌ Remove
import { useMyStore } from '@/v2/stores/myStore';
const myStore = useMyStore();

// ✅ Add
import { getServiceAsync } from '@/v2/services/serviceRegistry';
import type { useMyStore } from '@/v2/stores/myStore';
```

### Step 2: Update Functions to Async
```typescript
// ❌ Before
const doSomething = () => {
  myStore.action();
};

// ✅ After
const doSomething = async () => {
  const myStore = await getServiceAsync<ReturnType<typeof useMyStore>>('myStore');
  await myStore.action();
};
```

### Step 3: Add Error Handling
```typescript
const doSomething = async () => {
  try {
    const myStore = await getServiceAsync<ReturnType<typeof useMyStore>>('myStore');
    await myStore.action();
  } catch (error) {
    console.error('Failed to access service:', error);
    // Handle gracefully
  }
};
```

### Step 4: Verify Service Registration
Ensure service is registered in `/v2/services/serviceBootstrap.ts`:

```typescript
// serviceBootstrap.ts
const myStore = useMyStore();
registerService('myStore', myStore);
```

---

## Testing

### Before Migration
```bash
# Console Error:
Uncaught Error: [🍍]: "getActivePinia()" was called but there was no active Pinia.
```

### After Migration
```bash
# ✅ No errors
# Services load correctly
# Navbar displays properly
```

### Manual Test Checklist
- [x] Navbar loads without errors
- [x] Menu items display correctly
- [x] User profile shows active user
- [x] User switch icon appears (when permitted)
- [x] User switch functionality works
- [x] Logout works correctly
- [x] Multi-tab sync works
- [x] Localization works
- [x] No console errors

---

## Service Registry Reference

### Available Services

According to `/v2/services/README.md`:

```typescript
type ServiceName =
  | 'api'
  | 'messaging'
  | 'error'
  | 'auth'
  | 'config'
  | 'localization'
  | 'validation'
  | 'apiErrorIntegration'
  | 'mockApiIntegration'
  | 'performanceIntegration'
  | 'devToolsIntegration';
```

### Usage Pattern

```typescript
import { getServiceAsync } from '@/v2/services/serviceRegistry';
import type { useMyStore } from '@/v2/stores/myStore';

// In async function
const myStore = await getServiceAsync<ReturnType<typeof useMyStore>>('myStore');
```

### Timeout
- Default: 10 seconds
- Throws error if service not registered within timeout
- Allows services to be registered asynchronously during bootstrap

---

## Related Documentation

- [Service Infrastructure README](/v2/services/README.md)
- [Service Bootstrap](/v2/services/serviceBootstrap.ts)
- [Service Registry](/v2/services/serviceRegistry.ts)
- [User Switching Integration](./USER_SWITCHING_INTEGRATION.md)
- [Navbar Menu Structure](./MENU_STRUCTURE.md)

---

## Notes

### Why Not Use Synchronous `getService()`?

The service registry provides both sync and async access:

```typescript
getService(name)      // Synchronous - may return undefined
getServiceAsync(name) // Asynchronous - waits for service
```

We use `getServiceAsync()` because:
1. **Guaranteed availability**: Waits for service to be registered
2. **No undefined checks**: Service is guaranteed to exist or timeout
3. **Bootstrap safety**: Works during app initialization
4. **Cleaner code**: No need for `if (service)` checks

### Performance Impact

Minimal performance impact:
- First call waits for service (if not ready)
- Subsequent calls return immediately
- Service registry uses Map for O(1) lookup
- Async overhead is negligible (~1ms)

### Alternative Patterns

If you need to use a store inside a component's setup:

```typescript
// ✅ Option 1: Use onMounted
onMounted(async () => {
  const auth = await getServiceAsync('auth');
  // Use auth...
});

// ✅ Option 2: Use setup with async
setup() {
  const state = ref(null);
  
  getServiceAsync('auth').then(auth => {
    state.value = auth.getCurrentUser();
  });
  
  return { state };
}

// ❌ Avoid: Direct store call in setup
setup() {
  const auth = useAuthStore(); // May fail during bootstrap
  return { auth };
}
```

---

**Migration Complete** ✅  
**No Pinia Initialization Errors** ✅  
**Type Safety Maintained** ✅  
**Error Handling Added** ✅
