# Navbar User Switching Integration

**Status**: ✅ Complete  
**Last Updated**: October 26, 2025

---

## Overview

The navbar has been enhanced to support user context switching with the following features:

1. **User Switch Icon Button**: Quick access to user switching functionality
2. **Permission-Based Visibility**: Icon only shown when user has switching permissions
3. **Active User Menu Display**: Menu items reflect the switched user's permissions
4. **Visual Feedback**: Icon changes color when user is switched (warning severity)
5. **Multi-Tab Sync**: User switch state synced across browser tabs

---

## Changes Made

### 1. AppNavbar.vue

**Added Components**:
- User switch icon button (pi-user-edit)
- UserSwitchDialog component integration

**New State**:
```typescript
const canSwitch = ref(false);           // Can user switch?
const isSwitched = ref(false);          // Currently switched?
const showUserSwitchDialog = ref(false); // Dialog visibility
```

**New Methods**:
```typescript
checkUserSwitchPermissions()  // Check if user can switch
openUserSwitchDialog()        // Open switch dialog
handleUserSwitched()          // Handle successful switch
```

**Features**:
- User switch icon appears next to profile menu
- Icon color changes to warning (orange) when switched
- Tooltip shows "Switch User" label
- Dialog opens on click
- Menu reloads after successful switch
- Multi-tab sync via storage events

### 2. useNavbarMenu.ts

**Changed**:
```typescript
// Before
const user = await auth.getCurrentUser();

// After
const user = await auth.getActiveUser();
```

**Why**: Display the active user (switched user) in the navbar instead of the original logged-in user.

### 3. auth.live.ts

**Enhanced User Switching**:

1. **Permission Updates on Switch**:
   ```typescript
   // Update permission manager to use active user's permissions
   permissionManager.setUser(targetUser);
   ```

2. **Permission Restoration on Revert**:
   ```typescript
   // Restore permission manager to use original user
   if (originalUser) {
     permissionManager.setUser(originalUser);
   }
   ```

3. **Session Restore**:
   ```typescript
   // Update permission manager when restoring from session
   if (activeUser) {
     permissionManager.setUser(activeUser);
   }
   ```

**Why**: Menu items and UI elements should reflect the switched user's permissions for a complete impersonation experience.

### 4. Translation Files

**Added to `user-switch.ts` (en/de)**:
```typescript
messages: {
  switchSuccess: 'Successfully switched to user context',
  // German: 'Erfolgreich zum Benutzerkontext gewechselt'
}
```

---

## User Experience

### Normal State (Not Switched)
- User switch icon appears (if permitted)
- Icon is default secondary color
- Menu shows user's own permissions
- Profile shows user's own name/avatar

### Switched State
- User switch icon turns warning color (orange)
- Menu shows switched user's permissions
- Profile shows switched user's name/avatar
- Banner appears at top of page

### Multi-Tab Behavior
- Switch in one tab → all tabs update
- Revert in one tab → all tabs update
- Icon color syncs across tabs
- Menu permissions sync across tabs

---

## Permission Logic

### Display Logic
- **User Profile**: Uses `getActiveUser()` → shows switched user
- **Menu Items**: Uses `hasPermission()` → checks active user's permissions

### Security Logic
- **Switching Permission**: Checked against original user
- **Audit Trail**: Records original user as actor
- **Session**: Original user remains logged in

### Menu Filtering
```typescript
// Permission checks now use active user
permissionManager.hasPermission(permission)
// After switch: uses activeUser.permissions
// After revert: uses originalUser.permissions
```

---

## Technical Details

### Permission Manager Updates

The `PermissionManager` now reflects the active user's permissions:

**On Switch**:
```typescript
permissionManager.setUser(targetUser);  // Use switched user's permissions
```

**On Revert**:
```typescript
permissionManager.setUser(originalUser); // Restore original permissions
```

**On Session Restore**:
```typescript
if (activeUser) {
  permissionManager.setUser(activeUser); // Restore active user's permissions
}
```

### Multi-Tab Synchronization

**Storage Event Listener**:
```typescript
window.addEventListener('storage', (event) => {
  if (event.key === 'v2_user_switch_session') {
    checkSwitchState();
    reloadMenu(); // Reload menu when switch state changes
  }
});
```

**Polling Backup**:
```typescript
setInterval(checkSwitchState, 2000); // Check every 2 seconds
```

---

## Testing Recommendations

### 1. Permission Visibility
- [ ] Log in as staff user
- [ ] Verify switch icon appears
- [ ] Switch to regular user
- [ ] Verify menu items change to reflect regular user's permissions
- [ ] Verify items with `permissions: ['admin:view']` disappear

### 2. Multi-Tab Sync
- [ ] Open two tabs
- [ ] Switch in tab 1
- [ ] Verify tab 2 icon turns orange
- [ ] Verify tab 2 menu updates
- [ ] Revert in tab 2
- [ ] Verify tab 1 icon returns to normal

### 3. Session Persistence
- [ ] Switch to a user
- [ ] Refresh page
- [ ] Verify icon remains orange
- [ ] Verify menu still shows switched user's permissions
- [ ] Verify profile shows switched user

### 4. Visual Feedback
- [ ] Verify icon tooltip shows "Switch User"
- [ ] Verify icon changes to warning color when switched
- [ ] Verify icon returns to secondary color when reverted
- [ ] Verify profile avatar/name updates

### 5. Permission Edge Cases
- [ ] Switch to user with no permissions → verify menu is minimal
- [ ] Switch to staff user → verify staff items appear
- [ ] Switch to admin → verify admin items appear
- [ ] Try switching when not authorized → verify icon doesn't appear

---

## Implementation Notes

### Why Update PermissionManager?

The original concept suggested:
- **UI Logic**: Use `getActiveUser()` → for display
- **Permission Checks**: Use `getOriginalUser()` → for security

However, for a complete impersonation experience, we want:
- **UI Display**: Use `getActiveUser()` → show switched user
- **Menu Permissions**: Use `getActiveUser()` → show what switched user can see
- **Security Audit**: Track `getOriginalUser()` → who performed the switch

This provides:
1. **Better UX**: See exactly what the switched user sees
2. **Better Testing**: Test permission visibility as specific users
3. **Better Debugging**: Reproduce permission-based bugs
4. **Maintained Security**: Original user tracked for audit

### Separation of Concerns

- **PermissionManager**: Uses active user for UI permission checks
- **Audit Trail**: Records original user as actor
- **Security**: Backend validates all actions against original user's token

---

## Future Enhancements

1. **Keyboard Shortcut**: Add Ctrl+Shift+U to open switch dialog
2. **Recent Switches**: Show quick-switch menu for recently used users
3. **Switch Restrictions**: Add time limits or session-based restrictions
4. **Activity Indicator**: Show "Viewing as" in page title
5. **Backend Validation**: Add middleware to validate switch permissions on API calls

---

## Related Documentation

- [User Switching Concept](../../concepts/user-switching/CONCEPT.md)
- [User Switching Implementation](../../concepts/user-switching/IMPLEMENTATION_GUIDE.md)
- [Navbar Menu Structure](./MENU_STRUCTURE.md)
- [RBAC Access Control](../../auth/README.md)

---

**Implementation Complete** ✅
