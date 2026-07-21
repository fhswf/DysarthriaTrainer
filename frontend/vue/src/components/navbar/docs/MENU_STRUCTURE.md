# Navbar Menu Structure - Tree Support Documentation

**Component**: AppNavbar  
**Version**: 1.0  
**Last Updated**: October 20, 2025

## Overview

The navbar menu system **fully supports tree-like structures** with unlimited nesting levels for creating dropdowns, submenus, and complex menu hierarchies. This is powered by PrimeVue Menubar's native nested menu support.

## Tree Structure Support

### ✅ Supported Features

1. **Multi-level Nesting**: Unlimited depth of nested menu items
2. **Recursive Permission Filtering**: Permissions checked at every level
3. **Recursive Localization**: All labels translated at every level
4. **Smart Parent Visibility**: Parents only shown if they have visible children or their own route
5. **Mixed Content**: Can combine route items with dropdown items
6. **Separator Support**: At any level in the tree

### 🔧 Implementation Details

The system uses three key mechanisms for tree support:

1. **Type Definition** (`NavbarMenuItem`): 
   - Recursive `items?: NavbarMenuItem[]` property
   - Self-referential interface for unlimited nesting

2. **Permission Filtering** (`useNavbarPermissions.ts`):
   - Recursive `filterMenuItems()` function
   - Processes children before deciding parent visibility
   - Removes parents with no visible children (unless they have their own route)

3. **PrimeVue Conversion** (`useNavbarMenu.ts`):
   - Recursive `convertToPrimeMenuItem()` function
   - Translates labels at all levels
   - Preserves tree structure in output

## Menu Configuration Examples

### Example 1: Simple Dropdown (2 Levels)

```typescript
{
  id: 'content',
  label: 'navbar.menu.content',
  icon: 'pi pi-file',
  permissions: ['content:view'],
  items: [
    {
      id: 'content-list',
      label: 'navbar.menu.contentList',
      route: '/v2/content-table',
      permissions: ['content:view'],
    },
    {
      id: 'content-create',
      label: 'navbar.menu.contentCreate',
      route: '/v2/content-form',
      permissions: ['content:create'],
    },
  ],
}
```

**Renders as**:
```
Content ▼
  ├─ Content List
  └─ Create Content
```

### Example 2: Multi-level Nesting (3+ Levels)

```typescript
{
  id: 'admin',
  label: 'navbar.menu.admin',
  icon: 'pi pi-cog',
  permissions: ['system:configure'],
  items: [
    {
      id: 'settings',
      label: 'navbar.menu.settings',
      icon: 'pi pi-sliders-h',
      items: [
        {
          id: 'general',
          label: 'navbar.menu.generalSettings',
          route: '/v2/settings/general',
          permissions: ['system:configure'],
        },
        {
          id: 'security',
          label: 'navbar.menu.securitySettings',
          route: '/v2/settings/security',
          permissions: ['system:security:manage'],
        },
        {
          id: 'advanced',
          label: 'navbar.menu.advancedSettings',
          items: [
            {
              id: 'api',
              label: 'navbar.menu.apiSettings',
              route: '/v2/settings/advanced/api',
              permissions: ['system:api:configure'],
            },
            {
              id: 'integration',
              label: 'navbar.menu.integrationSettings',
              route: '/v2/settings/advanced/integration',
              permissions: ['system:integration:configure'],
            },
          ],
        },
      ],
    },
    {
      id: 'users',
      label: 'navbar.menu.userManagement',
      icon: 'pi pi-users',
      items: [
        {
          id: 'user-list',
          label: 'navbar.menu.users',
          route: '/v2/user-table',
          permissions: ['user:view'],
        },
        {
          id: 'roles',
          label: 'navbar.menu.roles',
          route: '/v2/roles',
          permissions: ['role:view'],
        },
      ],
    },
    {
      id: 'logs',
      label: 'navbar.menu.logs',
      icon: 'pi pi-list',
      route: '/v2/logs',
      permissions: ['system:logs:view'],
    },
  ],
}
```

**Renders as**:
```
Admin ▼
  ├─ Settings ▶
  │   ├─ General Settings
  │   ├─ Security Settings
  │   └─ Advanced Settings ▶
  │       ├─ API Settings
  │       └─ Integration Settings
  ├─ User Management ▶
  │   ├─ Users
  │   └─ Roles
  └─ Logs
```

### Example 3: Mixed Structure (Parent with Route + Children)

```typescript
{
  id: 'reports',
  label: 'navbar.menu.reports',
  icon: 'pi pi-chart-bar',
  route: '/v2/reports', // Parent has its own route
  permissions: ['reports:view'],
  items: [
    {
      id: 'reports-dashboard',
      label: 'navbar.menu.reportsDashboard',
      route: '/v2/reports/dashboard',
      permissions: ['reports:view'],
    },
    {
      id: 'reports-analytics',
      label: 'navbar.menu.analytics',
      route: '/v2/reports/analytics',
      permissions: ['reports:analytics:view'],
    },
    {
      separator: true, // Separator in submenu
    },
    {
      id: 'reports-export',
      label: 'navbar.menu.exportReports',
      route: '/v2/reports/export',
      permissions: ['reports:export'],
      icon: 'pi pi-download',
    },
  ],
}
```

**Behavior**:
- Clicking "Reports" navigates to `/v2/reports`
- Hovering/clicking dropdown arrow shows submenu with dashboard, analytics, and export options

### Example 4: Conditional Visibility by Permissions

```typescript
{
  id: 'admin',
  label: 'navbar.menu.admin',
  icon: 'pi pi-cog',
  permissions: ['system:configure'], // Parent requires permission
  items: [
    {
      id: 'users',
      label: 'navbar.menu.users',
      route: '/v2/users',
      permissions: ['user:view'], // Child requires different permission
    },
    {
      id: 'settings',
      label: 'navbar.menu.settings',
      route: '/v2/settings',
      permissions: ['system:configure'], // Same as parent
    },
    {
      id: 'audit',
      label: 'navbar.menu.audit',
      route: '/v2/audit',
      permissions: ['audit:view'], // Child requires different permission
    },
  ],
}
```

**Permission Scenarios**:

| User Permissions | Visible Menu Items |
|-----------------|-------------------|
| `system:configure` | Admin → Settings |
| `user:view` | *(Admin menu hidden - parent permission not met)* |
| `system:configure`, `user:view` | Admin → Users, Settings |
| `system:configure`, `audit:view` | Admin → Settings, Audit |
| `system:configure`, `user:view`, `audit:view` | Admin → Users, Settings, Audit |

**Important**: The parent item's permissions are checked independently. If the parent requires `system:configure` but the user only has `user:view`, the entire Admin menu will be hidden, even though the user has permission for the "Users" child item.

## Permission Logic

### Parent Item Visibility Rules

A parent menu item is **visible** if:

1. ✅ User has ANY of the parent's required permissions (or no permissions specified)
2. **AND** ONE of the following:
   - ✅ Has at least one visible child item (after filtering)
   - ✅ Has its own `route` property
   - ✅ Has its own `url` property

A parent menu item is **hidden** if:

- ❌ User lacks all parent permissions
- **OR**
- ❌ No visible children AND no direct route/url

### Child Item Visibility Rules

Each child is independently filtered by its own permissions.

### Recursive Permission Filtering

```typescript
// Pseudo-code algorithm
function filterMenuItems(items):
  for each item in items:
    if item.separator:
      include item (always visible)
    
    else if user has permission for item:
      if item has children:
        filteredChildren = filterMenuItems(item.children)
        
        if filteredChildren.length > 0 OR item has route/url:
          include item with filteredChildren
        else:
          exclude item (no visible children, no direct route)
      
      else:
        include item (leaf item with permission)
    
    else:
      exclude item (no permission)
  
  return filtered items
```

## Best Practices

### 1. **Permission Inheritance Pattern**

For most cases, use the same permissions at parent and child level:

```typescript
{
  id: 'users',
  label: 'navbar.menu.users',
  permissions: ['user:view'], // Parent permission
  items: [
    {
      id: 'user-list',
      label: 'navbar.menu.userList',
      route: '/v2/users',
      permissions: ['user:view'], // Same permission
    },
    {
      id: 'user-create',
      label: 'navbar.menu.createUser',
      route: '/v2/users/create',
      permissions: ['user:create'], // More specific permission
    },
  ],
}
```

### 2. **No Orphaned Parents**

Always give parents either:
- A direct route/url, OR
- Children that are likely to be visible

```typescript
// ❌ BAD: Parent with no route and children that might all be hidden
{
  id: 'admin',
  label: 'navbar.menu.admin',
  permissions: ['system:configure'],
  items: [
    {
      id: 'super-admin-only',
      label: 'navbar.menu.superAdmin',
      route: '/v2/super-admin',
      permissions: ['system:super:admin'], // Very restrictive
    },
  ],
}

// ✅ GOOD: Parent has fallback route
{
  id: 'admin',
  label: 'navbar.menu.admin',
  route: '/v2/admin', // Fallback route
  permissions: ['system:configure'],
  items: [
    // ... children
  ],
}
```

### 3. **Use Separators Wisely**

Separators help organize long submenus:

```typescript
{
  id: 'tools',
  label: 'navbar.menu.tools',
  items: [
    { id: 'tool1', label: 'navbar.menu.tool1', route: '/v2/tool1' },
    { id: 'tool2', label: 'navbar.menu.tool2', route: '/v2/tool2' },
    { separator: true }, // Visual grouping
    { id: 'tool3', label: 'navbar.menu.tool3', route: '/v2/tool3' },
    { id: 'tool4', label: 'navbar.menu.tool4', route: '/v2/tool4' },
  ],
}
```

### 4. **Limit Nesting Depth**

While unlimited nesting is supported, **3 levels is recommended maximum** for UX:

```
✅ GOOD: 1-3 levels
Main → Category → Item

⚠️ CAUTION: 4+ levels
Main → Category → Subcategory → Sub-subcategory → Item
(Users may get lost)
```

### 5. **Icon Usage**

Icons work at any level but are most impactful at:
- Top level (always visible)
- First submenu level

```typescript
{
  id: 'content',
  icon: 'pi pi-file', // ✅ Top level icon
  items: [
    {
      id: 'documents',
      icon: 'pi pi-file-pdf', // ✅ First level icon
      items: [
        {
          id: 'view-docs',
          icon: 'pi pi-eye', // ⚠️ Might be too much
        },
      ],
    },
  ],
}
```

## Technical Implementation

### Type Definition

```typescript
export interface NavbarMenuItem {
  id: string;
  label?: string;
  icon?: string;
  route?: string;
  url?: string;
  items?: NavbarMenuItem[]; // ← Recursive property enables tree structure
  permissions?: AccessRightId[];
  separator?: boolean;
  command?: () => void;
  badge?: string | number;
  badgeSeverity?: 'info' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  class?: string;
  style?: string;
}
```

### Recursive Filtering

From `useNavbarPermissions.ts`:

```typescript
const filterMenuItems = async (items: NavbarMenuItem[]): Promise<NavbarMenuItem[]> => {
  const filtered: NavbarMenuItem[] = [];

  for (const item of items) {
    if (item.separator) {
      filtered.push(item);
      continue;
    }

    const hasPermission = await hasAnyPermission(item.permissions || []);
    
    if (hasPermission) {
      const filteredItem = { ...item };
      
      if (item.items && item.items.length > 0) {
        const filteredChildren = await filterMenuItems(item.items); // ← Recursion
        
        if (filteredChildren.length > 0 || item.route || item.url) {
          filteredItem.items = filteredChildren;
          filtered.push(filteredItem);
        }
      } else {
        filtered.push(filteredItem);
      }
    }
  }

  return filtered;
};
```

### Recursive Conversion

From `useNavbarMenu.ts`:

```typescript
const convertToPrimeMenuItem = async (item: NavbarMenuItem): Promise<MenuItem> => {
  const primeItem: MenuItem = {
    label: item.label ? await loc.t(item.label) : undefined,
    icon: item.icon,
    route: item.route,
    url: item.url,
    separator: item.separator,
    command: item.command,
    disabled: item.disabled,
    class: item.class,
    style: item.style,
  };

  // Recursive conversion of children
  if (item.items && item.items.length > 0) {
    primeItem.items = await Promise.all(
      item.items.map(child => convertToPrimeMenuItem(child)) // ← Recursion
    );
  }

  return primeItem;
};
```

## Testing Tree Structures

### Unit Test Example

```typescript
describe('Nested Menu Items', () => {
  it('should filter nested items by permissions', async () => {
    const menu: NavbarMenuItem[] = [
      {
        id: 'admin',
        permissions: ['system:configure'],
        items: [
          {
            id: 'users',
            permissions: ['user:view'],
            route: '/users',
          },
          {
            id: 'settings',
            permissions: ['system:configure'],
            route: '/settings',
          },
        ],
      },
    ];

    // User has system:configure but not user:view
    mockAuthStore.hasPermission.mockImplementation(async (perm) => 
      perm === 'system:configure'
    );

    const filtered = await filterMenuItems(menu);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].items).toHaveLength(1);
    expect(filtered[0].items[0].id).toBe('settings');
  });
});
```

## Troubleshooting

### Issue: Parent menu item not showing

**Cause**: Parent has no visible children and no direct route

**Solution**: 
1. Add `route` or `url` to parent, OR
2. Ensure at least one child is visible to users

### Issue: Entire submenu tree hidden

**Cause**: Parent lacks required permissions

**Solution**: Check parent permissions - even if children have permissions, parent must be accessible first

### Issue: Menu structure looks flat

**Cause**: `items` property not set correctly

**Solution**: Verify `items` is an array of `NavbarMenuItem` objects

## PrimeVue Menubar Integration

The tree structure is natively supported by PrimeVue Menubar:

- **Dropdowns**: Automatically created for items with `items` property
- **Hover/Click**: PrimeVue handles interaction
- **Mobile**: Nested menus collapse into accordion on small screens
- **Icons**: Chevron icons added automatically to indicate submenus

No custom rendering logic needed! 🎉

## Related Documentation

- [menu-config.ts](../config/menu-config.ts) - Current menu configuration
- [navbar.types.ts](../types/navbar.types.ts) - Type definitions
- [useNavbarPermissions.ts](../composables/useNavbarPermissions.ts) - Permission filtering logic
- [useNavbarMenu.ts](../composables/useNavbarMenu.ts) - Menu loading and conversion
- [PrimeVue Menubar](https://primevue.org/menubar/) - Component documentation

---

**Summary**: The navbar menu system fully supports unlimited nesting with recursive permission filtering, localization, and PrimeVue Menubar integration. Tree structures are defined in the configuration, automatically filtered by permissions, and rendered by PrimeVue with no additional code required.
