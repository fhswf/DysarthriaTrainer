/**
 * Navbar Menu Composable
 * 
 * Manages navbar menu configuration, localization, and permission filtering.
 * Converts internal menu structure to PrimeVue MenuItem format.
 * 
 * Uses service registry pattern to avoid Pinia initialization order issues.
 */

import { ref, computed, onMounted, watch, type Ref } from 'vue';
import type { MenuItem } from 'primevue/menuitem';
import { getServiceAsync } from '@/services/serviceRegistry';
import { useNavbarPermissions } from './useNavbarPermissions';
import { NAVBAR_MENU_CONFIG } from '../config/menu-config';
import type { NavbarMenuItem, NavbarMenuConfig, NavbarUserProfile } from '../types/navbar.types';
import type { useLocalizationStore } from '@/stores/localization';
import type { useAuthStore } from '@/stores/auth';

/**
 * Navbar menu composable
 * 
 * @returns {Object} Menu state, data, and methods
 */
export const useNavbarMenu = () => {
  const { filterMenuItems, isAuthenticated } = useNavbarPermissions();

  const isLoading = ref(true);
  const menuConfig = ref<NavbarMenuConfig>(NAVBAR_MENU_CONFIG);
  const filteredMenuItems: Ref<MenuItem[]> = ref([]);
  const filteredUserMenu: Ref<MenuItem[]> = ref([]);

  /**
   * Convert NavbarMenuItem to PrimeVue MenuItem with localized labels
   * 
   * @param item - Menu item to convert
   * @returns Promise<MenuItem> - PrimeVue menu item
   */
  const convertToPrimeMenuItem = async (item: NavbarMenuItem): Promise<MenuItem> => {
    const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
    
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

    // Add badge if present
    if (item.badge !== undefined) {
      primeItem.badge = String(item.badge);
      primeItem.badgeSeverity = item.badgeSeverity;
    }

    // Convert children recursively
    if (item.items && item.items.length > 0) {
      primeItem.items = await Promise.all(
        item.items.map(child => convertToPrimeMenuItem(child))
      );
    }

    return primeItem;
  };

  /**
   * Load and filter menu items
   * 
   * Filters menu items by user permissions and converts them to PrimeVue format.
   */
  const loadMenu = async () => {
    isLoading.value = true;

    try {
      // Load user profile first
      await loadUserProfile();

      // Filter main menu items by permissions
      const filtered = await filterMenuItems(menuConfig.value.items);
      
      // Convert to PrimeVue format with localized labels
      filteredMenuItems.value = await Promise.all(
        filtered.map(item => convertToPrimeMenuItem(item))
      );

      // Filter and convert user menu
      const filteredUser = await filterMenuItems(menuConfig.value.userMenu);
      filteredUserMenu.value = await Promise.all(
        filteredUser.map(item => convertToPrimeMenuItem(item))
      );
    } catch (error) {
      console.error('Failed to load navbar menu:', error);
      filteredMenuItems.value = [];
      filteredUserMenu.value = [];
      userProfile.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * User profile data for display
   * 
   * Extracts user information from auth store for navbar display.
   */
  const userProfile = ref<NavbarUserProfile | null>(null);

  /**
   * Load user profile from auth store
   * 
   * Uses getActiveUser() to display the currently active user (either logged in or switched to).
   * Converts backend snake_case fields to camelCase for UI consistency.
   */
  const loadUserProfile = async () => {
    const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
    
    // Use getActiveUser to show the currently active user (supports user switching)
    const user = await auth.getActiveUser();
    console.log('[Navbar] Active user profile loaded:', user);
    if (!user) {
      userProfile.value = null;
      return;
    }

    // Map backend fields to UI fields
    // Backend stores full_name as single field, frontend uses first_name/last_name
    const fullName = user.full_name ?? '';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') ?? '';
    
    // Display name: use full_name if available, otherwise username
    const displayName = fullName.trim() || user.username;

    userProfile.value = {
      id: user.id,
      username: user.username,
      firstName,
      lastName,
      displayName,
      avatar: user.avatar,
      role: user.roles?.[0], // Primary role
      email: user.email,
    };
  };

  /**
   * Brand label (localized)
   */
  const brandLabel = computed(async () => {
    if (!menuConfig.value.brand) return '';
    const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
    return await loc.t(menuConfig.value.brand.label);
  });

  /**
   * Brand route
   */
  const brandRoute = computed(() => menuConfig.value.brand?.route || '/');

  /**
   * Brand logo URL
   * Files in public folder need absolute paths starting with /
   */
  const brandLogo = computed(() => {
    const logo = menuConfig.value.brand?.logo;
    if (!logo) return undefined;
    
    // If logo already starts with / or http(s):, return as-is
    if (logo.startsWith('/') || logo.startsWith('http')) {
      return logo;
    }
    
    // Otherwise, prepend / to reference public folder
    return `/${logo}`;
  });

  // Load menu on mount
  onMounted(() => {
    loadMenu();
  });

  // Watch for authentication state changes and reload menu
  watch(isAuthenticated, async (newValue, oldValue) => {
    // Only reload if auth state actually changed
    if (newValue !== oldValue) {
      console.log('[Navbar] Auth state changed, reloading menu...');
      await loadMenu();
    }
  });

  return {
    isLoading,
    isAuthenticated,
    filteredMenuItems,
    filteredUserMenu,
    userProfile,
    brandLabel,
    brandRoute,
    brandLogo,
    reloadMenu: loadMenu,
  };
};
