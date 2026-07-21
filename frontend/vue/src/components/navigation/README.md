# Navigation System

## Overview

The AKI Sprachtraining navigation system provides a role-based, mobile-first navigation experience with large icon-enhanced buttons. The system is designed to simplify navigation by limiting each level to 3-4 key decisions, optimized for both therapists and patients.

## Architecture

### Components

#### 1. **NavigationItem.vue** (`src/components/navigation/NavigationItem.vue`)
Single navigation button component (atomic unit).

**Features:**
- Icon with optional badge
- Label and description
- Support for children (chevron indicator)
- Responsive sizing (small/medium/large)
- Orientation support (horizontal/vertical)
- Click handling and router integration
- Disabled state support

**Props:**
```typescript
{
  item: NavigationItem;           // Navigation item configuration
  size?: 'small' | 'medium' | 'large'; // Button size (default: 'large')
  orientation?: 'horizontal' | 'vertical'; // Layout direction
  showDescription?: boolean;      // Show description text (default: true)
}
```

**Events:**
- `click`: Emitted when item is clicked
- `navigate`: Emitted when navigation occurs

#### 2. **NavigationMenu.vue** (`src/components/navigation/NavigationMenu.vue`)
Container component that orchestrates multiple NavigationItems.

**Features:**
- Responsive layout (auto-detects mobile/desktop)
- Title with optional back button
- Role/permission filtering via config
- Empty state handling
- Animations
- Mobile: vertical full-screen layout
- Desktop: horizontal centered layout

**Props:**
```typescript
{
  items: NavigationItem[];        // Array of navigation items
  level?: number;                 // Navigation depth (default: 0)
  orientation?: 'auto' | 'horizontal' | 'vertical'; // Layout
  size?: 'small' | 'medium' | 'large'; // Item size
  title?: string;                 // Menu title
  showBackButton?: boolean;       // Show back button
  showDescriptions?: boolean;     // Show item descriptions
  animate?: boolean;              // Enable animations
  className?: string;             // Custom CSS class
  onBack?: () => void;            // Back button handler
}
```

**Events:**
- `item-click`: Emitted when any item is clicked
- `navigate`: Emitted when navigation occurs
- `back`: Emitted when back button is clicked

### Type Definitions

#### **NavigationItem** (`src/components/navigation/NavigationConfig.ts`)
```typescript
interface NavigationItem {
  // Identity
  id: string;                     // Unique identifier
  label: string;                  // Display text
  description?: string;           // Subtext description
  
  // Visual
  icon?: string;                  // PrimeIcons class (e.g., 'pi-home')
  iconColor?: string;             // Icon color (hex or CSS var)
  badge?: string;                 // Badge text (e.g., notification count)
  customClass?: string;           // Custom CSS class
  
  // Navigation
  route?: string;                 // Vue Router path
  action?: () => void;            // Custom click handler
  external?: boolean;             // External link (opens in new tab)
  
  // Hierarchy
  children?: NavigationItem[];    // Sub-navigation items
  parent?: string;                // Parent item ID
  
  // Access Control (filtered at config level, not in component)
  requiredRole?: string[];        // Required user roles
  requiredPermission?: string[];  // Required permissions
  
  // State
  disabled?: boolean;             // Disable interaction
  showOnMobile?: boolean;         // Show on mobile (default: true)
  showOnDesktop?: boolean;        // Show on desktop (default: true)
  
  // Metadata
  metadata?: Record<string, unknown>; // Custom data
}
```

## Role-Based Configurations

### Patient Navigation (`src/config/navigation/patientNav.ts`)

**Primary Items:**
1. **Continue Training** - Resume last session (green)
2. **Select Training** - Browse exercises (blue)
3. **Training Profile** - View progress and settings (purple)

**Usage:**
```typescript
import { patientNavigation, getPatientNavigation } from '@/config/navigation/patientNav';

// Static navigation
const items = patientNavigation;

// With dynamic badge (unfinished exercises count)
const items = getPatientNavigation(5); // Shows badge "5" on Continue Training
```

### Therapist Navigation (`src/config/navigation/therapistNav.ts`)

**Primary Items:**
1. **Patients** - Manage and view patient progress (blue)
   - Patient List
   - Add Patient
   - Progress Overview
2. **Exercises** - Create and manage exercises (green)
   - Exercise List
   - Create Exercise
   - Categories
3. **Reports** - View analytics and statistics (purple)
   - Overview
   - Patient Reports
   - Export

**Usage:**
```typescript
import { therapistNavigation, getTherapistNavigation } from '@/config/navigation/therapistNav';

// Static navigation
const items = therapistNavigation;

// With dynamic badge (patient alerts)
const items = getTherapistNavigation(3); // Shows badge "3" on Patients
```

### Admin Navigation (`src/config/navigation/adminNav.ts`)

**Primary Items:**
- All therapist items (Patients, Exercises, Reports)
- **Settings** - System configuration (red)
  - User Management
  - Roles & Permissions
  - System Settings
  - Backup

**Usage:**
```typescript
import { adminNavigation, getAdminNavigation } from '@/config/navigation/adminNav';

// Static navigation
const items = adminNavigation;

// With dynamic badges (patient alerts + system alerts)
const items = getAdminNavigation(3, 2); // Patients: 3, Settings: 2
```

### Universal Helper (`src/config/navigation/index.ts`)

**Get navigation by role:**
```typescript
import { getNavigationForRole, getNavigationForRoles } from '@/config/navigation';

// Single role
const patientNav = getNavigationForRole('patient', { continueCount: 5 });
const therapistNav = getNavigationForRole('therapist', { patientAlerts: 3 });
const adminNav = getNavigationForRole('admin', { patientAlerts: 3, systemAlerts: 2 });

// Multiple roles (highest privilege wins: admin > therapist > patient)
const userRoles = ['patient', 'therapist'];
const nav = getNavigationForRoles(userRoles, { patientAlerts: 3 });
```

## Dashboard Integration

The dashboard (`src/pages/dashboard/app-dashboard.vue`) automatically loads the appropriate navigation based on user roles:

**Features:**
- Time-based greeting (Good Morning/Afternoon/Evening)
- Personalized welcome message
- Automatic role detection
- Loading state
- Empty state (no navigation available)
- Dynamic badge support (future)

**Flow:**
1. Load current user from auth store
2. Extract user roles
3. Get navigation config for roles
4. Render NavigationMenu with items

## Responsive Design

### Mobile (< 768px)
- **Layout:** Vertical, full-screen
- **Button Size:** Large (80-100px height)
- **Orientation:** Vertical stacking
- **Navigation:** Full viewport height
- **Back Button:** Sticky header with back button

### Tablet (768px - 1024px)
- **Layout:** Horizontal, centered
- **Button Size:** Large (100-120px height)
- **Orientation:** Horizontal with wrapping
- **Navigation:** Centered with max-width

### Desktop (> 1024px)
- **Layout:** Horizontal, centered
- **Button Size:** Extra Large (120-160px height)
- **Orientation:** Horizontal with wrapping
- **Navigation:** Centered with max-width (1200px)

## Adding New Navigation Items

### 1. Update Configuration File

**Patient:**
```typescript
// src/config/navigation/patientNav.ts
export const patientNavigation: NavigationItem[] = [
  // ... existing items
  {
    id: 'new-item',
    label: 'New Feature',
    description: 'Description here',
    icon: 'pi-star',
    iconColor: '#f59e0b',
    route: '/new-feature',
    requiredRole: ['patient'],
  },
];
```

**Therapist/Admin:**
```typescript
// src/config/navigation/therapistNav.ts
export const therapistNavigation: NavigationItem[] = [
  {
    id: 'new-parent',
    label: 'New Section',
    icon: 'pi-folder',
    route: '/new-section',
    requiredRole: ['therapist', 'admin'],
    children: [
      {
        id: 'new-child',
        label: 'Sub Item',
        icon: 'pi-file',
        route: '/new-section/child',
        requiredRole: ['therapist', 'admin'],
      },
    ],
  },
];
```

### 2. Register Route

```typescript
// Routes are auto-generated from src/pages/ directory
// Create: src/pages/new-feature/NewFeaturePage.vue
```

### 3. Test Access Control

Ensure routes have correct `requiresAuth` and role checks in route guards.

## Dynamic Badges

Badges show counts/alerts on navigation items. Update in dashboard or navigation config helper:

**Example:**
```typescript
// In dashboard or service
const continueCount = await exerciseService.getUnfinishedCount();
const patientAlerts = await patientService.getAlertCount();

const nav = getNavigationForRoles(userRoles, {
  continueCount,      // Patient: Continue Training badge
  patientAlerts,      // Therapist/Admin: Patients badge
  systemAlerts,       // Admin: Settings badge
});
```

## Accessibility

- **Keyboard Navigation:** All buttons are focusable and keyboard-accessible
- **Screen Readers:** ARIA labels on navigation and back button
- **Focus Indicators:** Visible focus outlines on all interactive elements
- **Semantic HTML:** Proper use of `<nav>`, `<button>`, and headings
- **Color Contrast:** Meets WCAG 2.1 AA standards

## Best Practices

### 1. **Limit Navigation Depth**
- Keep primary navigation to 3-4 items
- Use children for sub-navigation (1 level deep max)
- If more depth needed, create new primary item

### 2. **Role-Based Filtering**
- Filter navigation **before** passing to NavigationMenu
- Use `getNavigationForRoles()` helper
- Don't rely on component-level filtering

### 3. **Icon Selection**
- Use PrimeIcons for consistency
- Choose recognizable, intuitive icons
- Apply color for visual grouping

### 4. **Badge Usage**
- Use for counts/alerts only
- Keep text short (1-3 characters)
- Update dynamically based on user data

### 5. **Responsive Testing**
- Test on mobile (< 768px)
- Test on tablet (768px - 1024px)
- Test on desktop (> 1024px)
- Verify touch targets (min 44x44px)

## Troubleshooting

### Navigation Not Showing
**Check:**
1. User is authenticated
2. User has required roles
3. Navigation config is not empty
4. Dashboard is loading successfully

### Wrong Navigation for Role
**Check:**
1. User roles are correct in auth store
2. `getNavigationForRoles()` priority order
3. Route requires correct role in meta

### Styling Issues
**Check:**
1. PrimeVue theme variables are loaded
2. Tailwind v4 is configured
3. Custom CSS class is valid
4. Responsive breakpoints

### Back Button Not Working
**Check:**
1. `onBack` prop is provided
2. Parent component handles `back` event
3. Router history is available

## Future Enhancements

- [ ] **Nested Navigation:** Multi-level navigation with breadcrumbs
- [ ] **Search:** Global navigation search
- [ ] **Favorites:** User-customizable favorites
- [ ] **Recent:** Recently accessed items
- [ ] **Shortcuts:** Keyboard shortcuts (Cmd+K)
- [ ] **Notifications:** Real-time badge updates
- [ ] **Animations:** Page transitions
- [ ] **Persistence:** Remember last visited section

## Related Documentation

- [Architecture Guide](../../../.github/docs/navigation-structure.md) - Full design specifications
- [Interface Design](../../../.github/instructions/interface-design.md) - UI/UX patterns
- [Coding Style](../../../.github/instructions/coding-style.md) - Code conventions
