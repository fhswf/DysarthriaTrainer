/**
 * Navigation Configuration Types
 * 
 * Defines the structure for navigation items used throughout the application.
 * Supports role-based filtering, nested navigation, and dynamic actions.
 */

export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string;

  /** Display label (translation key or direct text) */
  label: string;

  /** Icon name (PrimeIcons class or custom icon identifier) */
  icon: string;

  /** Vue Router route path (optional if action is provided) */
  route?: string;

  /** Custom action function (alternative to route) */
  action?: () => void | Promise<void>;

  /** Badge text or count to display on the item */
  badge?: number | string;

  /** Badge severity level for styling */
  badgeSeverity?: 'success' | 'info' | 'warning' | 'danger';

  /** Child navigation items for multi-level navigation */
  children?: NavigationItem[];

  /** Required role(s) to view this item */
  requiredRole?: string[];

  /** Required permission(s) to view this item */
  requiredPermission?: string[];

  /** Whether the item is currently disabled */
  disabled?: boolean;

  /** Custom CSS class for the item */
  customClass?: string;

  /** Item description (for tooltips or subtitles) */
  description?: string;

  /** Color theme for the icon */
  iconColor?: string;

  /** Whether to show this item in mobile navigation */
  showOnMobile?: boolean;

  /** Whether to show this item in desktop navigation */
  showOnDesktop?: boolean;

  /** External link (opens in new tab) */
  external?: boolean;

  /** Metadata for analytics or tracking */
  metadata?: Record<string, unknown>;
}

export interface NavigationMenuProps {
  /** Array of navigation items to display */
  items: NavigationItem[];

  /** Navigation level (0 = primary, 1 = secondary, etc.) */
  level?: number;

  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical' | 'auto';

  /** Button size variant */
  size?: 'small' | 'medium' | 'large';

  /** Show back button (for nested navigation) */
  showBackButton?: boolean;

  /** Custom back button action */
  onBack?: () => void;

  /** Title for the navigation section */
  title?: string;

  /** Whether to show item descriptions */
  showDescriptions?: boolean;

  /** Whether to enable animations */
  animate?: boolean;

  /** Custom CSS class for the container */
  className?: string;
}

export interface NavigationState {
  /** Current navigation level */
  currentLevel: number;

  /** History of visited navigation items */
  history: string[];

  /** Currently active item ID */
  activeItemId?: string;

  /** Whether navigation is in mobile mode */
  isMobile: boolean;
}

export type NavigationOrientation = 'horizontal' | 'vertical' | 'auto';
export type NavigationSize = 'small' | 'medium' | 'large';
export type BadgeSeverity = 'success' | 'info' | 'warning' | 'danger';
