<template>
  <Menubar :model="filteredMenuItems" class="border-0 border-b border-gray-300 rounded-none shadow-sm app-navbar">
    <!-- Brand/Logo -->
    <template #start>
      <router-link :to="brandRoute" class="flex items-center gap-3 mr-6">
        <img v-if="brandLogo" :src="brandLogo" alt="Logo" class="h-8 w-auto" />
      </router-link>
    </template>

    <!-- Custom menu item template for router-link support -->
    <template #item="{ item, props, hasSubmenu, root }">
      <router-link v-if="item.route" v-slot="{ href, navigate, isActive }" :to="item.route" custom>
        <a v-ripple :href="href" v-bind="props.action" @click="navigate"
          class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
          :class="{ 'bg-primary-50 text-primary-700 font-medium': isActive }">
          <i v-if="item.icon" :class="item.icon" class="mr-2" />
          <span>{{ item.label }}</span>
          <Badge v-if="item.badge" :value="item.badge" :severity="item.badgeSeverity" class="ml-2" />
          <i v-if="hasSubmenu" :class="['ml-auto', root ? 'pi pi-angle-down' : 'pi pi-angle-right']" />
        </a>
      </router-link>

      <a v-else-if="item.url" v-ripple :href="item.url" target="_blank" rel="noopener noreferrer" v-bind="props.action"
        class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors">
        <i v-if="item.icon" :class="item.icon" class="mr-2" />
        <span>{{ item.label }}</span>
        <i class="pi pi-external-link ml-2 text-xs" />
      </a>

      <a v-else-if="item.command" v-ripple v-bind="props.action"
        class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
        <i v-if="item.icon" :class="item.icon" class="mr-2" />
        <span>{{ item.label }}</span>
      </a>

      <!-- Dropdown parent without route (just has submenu) -->
      <a v-else v-ripple v-bind="props.action"
        class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
        <i v-if="item.icon" :class="item.icon" class="mr-2" />
        <span>{{ item.label }}</span>
        <Badge v-if="item.badge" :value="item.badge" :severity="item.badgeSeverity" class="ml-2" />
        <i v-if="hasSubmenu" :class="['ml-auto', root ? 'pi pi-angle-down' : 'pi pi-angle-right']" />
      </a>
    </template>

    <!-- User Profile + Logout -->
    <template #end>
      <div v-if="isUserAuthenticated" class="flex items-center gap-3">
        <!-- User Switch Icon (Only visible if user can switch) -->
        <Button v-if="canSwitch" text rounded icon="pi pi-user-edit" @click="openUserSwitchDialog"
          v-tooltip.bottom="switchUserLabel" :severity="isSwitched ? 'warning' : 'secondary'"
          class="transition-colors" />

        <!-- User Profile Menu -->
        <Menu ref="userMenuRef" :model="userMenuItems" :popup="true">
          <template #item="{ item }">
            <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
              <a v-ripple :href="href" @click="navigate"
                class="flex items-center px-4 py-3 hover:bg-gray-100 transition-colors">
                <i v-if="item.icon" :class="item.icon" class="mr-2" />
                <span>{{ item.label }}</span>
              </a>
            </router-link>

            <a v-else-if="item.command" v-ripple
              :data-testid="typeof item.label === 'string' && (item.label.includes('Logout') || item.label.includes('Abmelden')) ? 'logout-button' : undefined"
              class="flex items-center px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer">
              <i v-if="item.icon" :class="[
                item.icon,
                { 'text-red-600': typeof item.label === 'string' && (item.label.includes('Logout') || item.label.includes('Abmelden')) }
              ]" class="mr-2" />
              <span :class="{
                'text-red-600 font-medium': typeof item.label === 'string' && (item.label.includes('Logout') || item.label.includes('Abmelden'))
              }">
                {{ item.label }}
              </span>
            </a>
          </template>
        </Menu>

        <Button text rounded class="flex items-center gap-2" @click="toggleUserMenu" data-testid="user-menu-button"
          v-tooltip.bottom="userProfile?.displayName">
          <Avatar v-if="userProfile?.avatar" :image="userProfile.avatar" shape="circle" size="normal" />
          <Avatar v-else :label="userInitials" shape="circle" size="normal" class="bg-primary-600 text-white" />
          <span class="text-sm font-medium hidden md:block">
            {{ userProfile?.displayName }}
          </span>
          <i class="pi pi-angle-down text-xs" />
        </Button>
      </div>

      <!-- Login Button (not authenticated) -->
      <router-link v-else to="/login">
        <Button :label="loginLabel" icon="pi pi-sign-in" text />
      </router-link>
    </template>
  </Menubar>

  <!-- User Switch Dialog -->
  <!-- TODO: Implement UserSwitchDialog component -->
  <!--
  <UserSwitchDialog
    v-model:modelValue="showUserSwitchDialog"
    @user-switched="handleUserSwitched"
  />
  -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Menubar from 'primevue/menubar';
import Menu from 'primevue/menu';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';
import type { MenuItem } from 'primevue/menuitem'
import { getServiceAsync } from '@/services/serviceRegistry'
import type { useAuthStore } from '@/stores/auth'
import type { useLocalizationStore } from '@/stores/localization'
import type { useMessagingStore } from '@/stores/messaging'
import { useNavbarMenu } from './composables/useNavbarMenu'
// TODO: Create user-switching component
// import { UserSwitchDialog } from '@/components/user-switching'

const router = useRouter();
const {
  isLoading,
  isAuthenticated,
  filteredMenuItems,
  filteredUserMenu,
  userProfile,
  brandLabel,
  brandRoute,
  brandLogo,
  reloadMenu,
} = useNavbarMenu();

const userMenuRef = ref();
const brandLabelText = ref('');
const loginLabel = ref('');
const isUserAuthenticated = ref(false);
const switchUserLabel = ref('');

// User switching state
const canSwitch = ref(false);
const isSwitched = ref(false);
const showUserSwitchDialog = ref(false);

/**
 * Get user initials for avatar
 */
const userInitials = computed(() => {
  if (!userProfile.value) return '?';

  const { firstName, lastName, displayName, username } = userProfile.value;

  // Use firstName and lastName if available
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  } else if (firstName) {
    return firstName[0].toUpperCase();
  } else if (lastName) {
    return lastName[0].toUpperCase();
  }

  // Fallback: try to extract from displayName
  const parts = displayName.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    return parts[0][0].toUpperCase();
  }

  // Last resort: use username
  return username ? username[0].toUpperCase() : '?';
});

/**
 * Load localized strings and check auth
 */
const loadLocalizedStrings = async () => {
  const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
  brandLabelText.value = await brandLabel.value;
  loginLabel.value = await loc.t('auth.login');
  // switchUserLabel.value = await loc.t('navbar.menu.userSwitch'); // Removed - user switching feature not needed
  isUserAuthenticated.value = isAuthenticated.value; // isAuthenticated is now a ref, not a Promise
};

/**
 * Check user switching permissions
 */
const checkUserSwitchPermissions = async () => {
  try {
    const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
    canSwitch.value = await auth.canSwitchUsers();
    isSwitched.value = auth.isUserSwitched();
  } catch (error) {
    console.error('Failed to check user switch permissions:', error);
    canSwitch.value = false;
    isSwitched.value = false;
  }
};

/**
 * Open user switch dialog
 */
const openUserSwitchDialog = () => {
  showUserSwitchDialog.value = true;
};

/**
 * Handle successful user switch
 */
const handleUserSwitched = async () => {
  showUserSwitchDialog.value = false;
  isSwitched.value = true;

  // Show success message
  const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
  const messaging = await getServiceAsync<ReturnType<typeof useMessagingStore>>('messaging');
  const successMsg = await loc.t('userSwitch.messages.switchSuccess');
  await messaging.success(successMsg);

  // Reload page to apply the switched user's context to all components
  // This ensures data, permissions, and UI elements reflect the new user
  window.location.reload();
};

/**
 * User menu items with logout handler
 */
const userMenuItems = computed<MenuItem[]>(() => {
  return filteredUserMenu.value.map(item => {
    // Check if this is the logout item by label content
    const labelStr = typeof item.label === 'string' ? item.label : '';
    const isLogoutItem = labelStr.includes('Logout') || labelStr.includes('Abmelden');

    if (isLogoutItem) {
      return {
        ...item,
        command: handleLogout,
      };
    }
    return item;
  });
});

/**
 * Toggle user profile menu
 */
const toggleUserMenu = (event: Event) => {
  userMenuRef.value?.toggle(event);
};

/**
 * Handle logout
 */
const handleLogout = async () => {
  try {
    const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
    const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
    const messaging = await getServiceAsync<ReturnType<typeof useMessagingStore>>('messaging');

    await auth.logout();
    const successMsg = await loc.t('auth.logoutSuccess');
    await messaging.success(successMsg);
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    const loc = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization');
    const messaging = await getServiceAsync<ReturnType<typeof useMessagingStore>>('messaging');
    const errorMsg = await loc.t('auth.logoutFailed');
    await messaging.error(errorMsg);
  }
};

// Load localized strings on mount
onMounted(() => {
  loadLocalizedStrings();
  checkUserSwitchPermissions();
});

// Watch for authentication state changes (isAuthenticated is now a ref, not a Promise)
watch(isAuthenticated, (newValue) => {
  isUserAuthenticated.value = newValue;
  console.log('[Navbar] User authenticated:', isUserAuthenticated.value);
  if (newValue) {
    checkUserSwitchPermissions();
  }
}, { immediate: true });

// Watch for user profile changes
watch(userProfile, (newProfile) => {
  if (newProfile) {
    console.log('[Navbar] User profile loaded:', {
      displayName: newProfile.displayName,
      firstName: newProfile.firstName,
      lastName: newProfile.lastName,
      username: newProfile.username
    });
  }
}, { immediate: true, deep: true });

// Watch for user switch state changes (multi-tab sync)
const checkSwitchState = async () => {
  try {
    const auth = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth');
    isSwitched.value = auth.isUserSwitched();
  } catch (error) {
    console.error('Failed to check switch state:', error);
    isSwitched.value = false;
  }
};

// Poll for switch state changes every 2 seconds
setInterval(checkSwitchState, 2000);

// Listen for storage events (multi-tab sync)
window.addEventListener('storage', (event) => {
  if (event.key === 'v2_user_switch_session') {
    checkSwitchState();
    reloadMenu(); // Reload menu when switch state changes in another tab
  }
});
</script>

<style scoped>
/* Ensure navbar and its dropdowns appear above all content including spreadsheets */
.app-navbar {
  position: relative;
  z-index: 1000;
}

/* PrimeVue menu dropdown panels need high z-index to appear above sticky spreadsheet elements */
:deep(.p-menubar-root-list .p-submenu-list) {
  z-index: 1001 !important;
}

:deep(.p-menubar .p-menubar-root-list) {
  z-index: 1001;
}
</style>
