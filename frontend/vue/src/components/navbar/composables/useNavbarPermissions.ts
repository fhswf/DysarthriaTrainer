/**
 * Navbar Permissions Composable
 * 
 * Filters menu items based on user permissions using the RBAC system.
 * Items without permissions are visible to all authenticated users.
 * Items with permissions require at least ONE matching permission (ANY logic).
 * 
 * Uses service registry pattern to avoid Pinia initialization order issues.
 */

import { ref } from 'vue';
import { getServiceAsync } from '@/services/serviceRegistry';
import type { NavbarMenuItem } from '../types/navbar.types';
import type { AccessRightId } from '@/auth/access-rights';
import type { useAuthStore } from '@/stores/auth';

/**
 * Navbar permissions composable
 * 
 * @returns {Object} Permission checking and filtering functions
 */
export const useNavbarPermissions = () => {
  /**
   * Check if user has ANY of the required permissions
   * 
   * @param permissions - Array of permission IDs to check
   * @returns Promise<boolean> - True if user has at least one permission or permissions array is empty
   * 
   * @example
   * // Returns true if user has 'user:view' OR 'user:edit'
   * await hasAnyPermission(['user:view', 'user:edit']);
   * 
   * @example
   * // Returns true (no permissions required)
   * await hasAnyPermission([]);
   */
  const hasAnyPermission = async (permissions: AccessRightId[]): Promise<boolean> => {
    // No permissions required = visible to all authenticated users
    if (!permissions || permissions.length === 0) {
      return true;
    }

    const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');

    // Check each permission until we find a match
    for (const permission of permissions) {
      try {
        const hasPermission = await auth.hasPermission(permission as string);
        if (hasPermission) {
          return true; // Found a matching permission
        }
      } catch (error) {
        console.error(`Error checking permission ${permission}:`, error);
        // Continue checking other permissions
      }
    }

    return false; // No matching permissions found
  };

  /**
   * Filter menu items recursively based on permissions
   * 
   * - Items without permissions are kept
   * - Items with permissions are kept only if user has at least ONE matching permission
   * - Recursively filters children
   * - Parent items with children:
   *   - Shown if they have at least one visible child (acts as dropdown)
   *   - Shown if they have a valid route AND visible children (clickable parent)
   *   - Hidden if they have no visible children and no valid route
   * - Parent items without route property act as pure dropdown menus
   * - Parent items with empty route ('') are treated as having no route
   * 
   * @param items - Array of menu items to filter
   * @returns Promise<NavbarMenuItem[]> - Filtered array of menu items
   * 
   * @example
   * const filtered = await filterMenuItems(menuConfig.items);
   */
  const filterMenuItems = async (items: NavbarMenuItem[]): Promise<NavbarMenuItem[]> => {
    const filtered: NavbarMenuItem[] = [];

    for (const item of items) {
      // Skip separators (always visible)
      if (item.separator) {
        filtered.push(item);
        continue;
      }

      // Check if user has permission for this item
      const hasPermission = await hasAnyPermission(item.permissions || []);
      
      if (hasPermission) {
        // Create shallow copy to avoid mutating original
        const filteredItem = { ...item };
        
        // Recursively filter children if they exist
        if (item.items && item.items.length > 0) {
          const filteredChildren = await filterMenuItems(item.items);
          
          // Only include parent if it has visible children
          // Parent items can have no route (or empty route) to act as dropdown menus
          if (filteredChildren.length > 0) {
            filteredItem.items = filteredChildren;
            filtered.push(filteredItem);
          }
          // If no visible children and item has a non-empty route, include it as a clickable item
          else if (item.route && item.route.trim() !== '' || item.url) {
            filteredItem.items = filteredChildren;
            filtered.push(filteredItem);
          }
          // If no visible children and no valid route, omit the parent
        } else {
          // Leaf item with permission - include it
          filtered.push(filteredItem);
        }
      }
    }

    return filtered;
  };

  /**
   * Check if user is authenticated (reactive ref)
   */
  const isAuthenticated = ref(false);

  /**
   * Update authentication state
   */
  const updateAuthState = async () => {
    try {
      const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
      isAuthenticated.value = await auth.isAuthenticated();
    } catch (error) {
      console.error('Failed to check authentication state:', error);
      isAuthenticated.value = false;
    }
  };

  // Initialize auth state
  updateAuthState();

  // Poll for auth state changes every 2 seconds (for after login)
  setInterval(() => {
    updateAuthState();
  }, 2000);

  return {
    hasAnyPermission,
    filterMenuItems,
    isAuthenticated,
  };
};
