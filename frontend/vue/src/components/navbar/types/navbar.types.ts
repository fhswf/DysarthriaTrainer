/**
 * Navbar Type Definitions
 * 
 * Type definitions for the navbar component system.
 * Extends PrimeVue MenuItem interface with permission support.
 */

import type { AccessRightId } from '@/auth/access-rights';

/**
 * Menu item configuration
 * 
 * Extends PrimeVue MenuItem interface with RBAC permission support.
 * Items without permissions are visible to all authenticated users.
 */
export interface NavbarMenuItem {
  /** Unique identifier */
  id: string;
  
  /** Display label (localization key) - Optional for separator items */
  label?: string;
  
  /** PrimeIcons class (e.g., 'pi pi-home') */
  icon?: string;
  
  /** Vue Router route path */
  route?: string;
  
  /** External URL (opens in new tab) */
  url?: string;
  
  /** Submenu items */
  items?: NavbarMenuItem[];
  
  /** 
   * Required permissions (ANY match = visible)
   * If empty or undefined, item is visible to all authenticated users
   */
  permissions?: AccessRightId[];
  
  /** Separator item (when true, label is not required) */
  separator?: boolean;
  
  /** Custom command callback */
  command?: () => void;
  
  /** Badge value */
  badge?: string | number;
  
  /** Badge severity */
  badgeSeverity?: 'info' | 'success' | 'warning' | 'danger';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** CSS class */
  class?: string;
  
  /** Inline style */
  style?: string;
}

/**
 * Menu configuration structure
 */
export interface NavbarMenuConfig {
  /** Brand/Logo configuration */
  brand?: {
    label: string;
    route: string;
    logo?: string;
  };
  
  /** Main navigation items */
  items: NavbarMenuItem[];
  
  /** User menu items (profile, settings, logout) */
  userMenu: NavbarMenuItem[];
}

/**
 * User profile data for display in navbar
 * 
 * Transformed from backend User interface (snake_case) to UI-friendly format (camelCase)
 * Source: @/api/users/users.types.ts User interface
 */
export interface NavbarUserProfile  {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatar?: string;
  role?: string;
}
