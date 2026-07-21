<template>
    <div class="w-full px-4 py-6 bg-surface-ground md:px-8 md:py-8">
        <div class="flex justify-center items-center">
            <NavigationMenu v-if="navigationItems.length > 0" :items="navigationItems" :title="navigationTitle"
                size="large" orientation="auto" animate :show-back-button="menuConfig.showBackButton"
                :on-back="handleBack" />

            <!-- Loading state -->
            <div v-else-if="isLoading" class="flex flex-col items-center gap-4 text-center text-surface-500">
                <i class="pi pi-spin pi-spinner text-5xl text-blue-500"></i>
                <p>{{ t('common.loading') }}</p>
            </div>

            <!-- No navigation available -->
            <div v-else
                class="flex flex-col items-center gap-6 p-12 bg-surface-card rounded-xl shadow-md max-w-lg text-center">
                <i class="pi pi-compass text-5xl text-surface-400"></i>
                <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 m-0">{{
                    t('navigation.noNavigation') }}</h2>
                <p class="text-base text-surface-600 dark:text-surface-400 m-0 leading-relaxed">{{
                    t('navigation.noNavigationDescription') }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLocalizationStore } from '@/stores/localization';
import { useAuthStore } from '@/stores/auth';
import NavigationMenu from '@/components/navigation/NavigationMenu.vue';
import { getNavigationByMenu } from '@/config/navigation';
import type { MenuConfig } from '@/config/navigation';
import type { NavigationItem } from '@/components/navigation/NavigationConfig';
import { exercisesApi } from '@/api/exercises';

const route = useRoute();
const router = useRouter();
const loc = useLocalizationStore();
const auth = useAuthStore();

const isLoading = ref(true);
const navigationItems = ref<NavigationItem[]>([]);
const userRoles = ref<string[]>([]);
const menuConfig = ref<MenuConfig>({
    items: [],
    titleDe: 'Hauptmenü',
    titleEn: 'Main Menu',
    showBackButton: false,
});

// Translation helper
const t = (key: string) => loc.t(key);

// Get current menu type from URL params
const currentMenu = computed(() => {
    return (route.query.menu as string) || 'main';
});

// Computed properties
const navigationTitle = computed(() => {
    return loc.currentLocale === 'de' ? menuConfig.value.titleDe : menuConfig.value.titleEn;
});

// Handle continue training action
const handleContinueTraining = async () => {
    try {
        const firstExercise = await exercisesApi.getFirstExercise();
        if (firstExercise) {
            // Pass backTo param to return to dashboard after exercise
            await router.push(`/exercise-practice-revised?backTo=/dashboard`);
        } else {
            // No exercises available, navigate to exercise list
            await router.push('/exercise-selection');
        }
    } catch {
        // Fallback to exercise list on error
        await router.push('/exercise-selection');
    }
};

// Handle back button
const handleBack = () => {
    if (menuConfig.value.backRoute) {
        void router.push(menuConfig.value.backRoute);
    } else {
        void router.push('/dashboard');
    }
};

// Bind dynamic actions to navigation items
const bindNavigationActions = (items: NavigationItem[]): NavigationItem[] => {
    return items.map(item => {
        // Translate label and description if they are localization keys
        const translatedItem = {
            ...item,
            label: item.label.includes('.') ? loc.t(item.label) : item.label,
            description: item.description && item.description.includes('.') ? loc.t(item.description) : item.description,
        };

        // Bind continue-training action
        if (item.metadata?.actionType === 'continue-training') {
            return {
                ...translatedItem,
                action: handleContinueTraining,
            };
        }
        return translatedItem;
    });
};

// Load user data and navigation
const loadDashboard = async () => {
    try {
        isLoading.value = true;

        // Get current user
        const user = await auth.getCurrentUser();
        if (user) {
            userRoles.value = user.roles || [];
        }

        // Get navigation based on menu type and user roles
        if (userRoles.value.length > 0) {
            // TODO: In the future, load dynamic badge counts from API
            // const continueCount = await exerciseService.getUnfinishedCount();
            // const patientAlerts = await patientService.getAlertCount();
            // const systemAlerts = await systemService.getAlertCount();

            menuConfig.value = getNavigationByMenu(currentMenu.value, userRoles.value, {
                // continueCount,
                // patientAlerts,
                // systemAlerts,
            });

            // Bind dynamic actions
            navigationItems.value = bindNavigationActions(menuConfig.value.items);
        }
    } catch {
        // Error loading dashboard - navigation will remain empty
    } finally {
        isLoading.value = false;
    }
};

// Watch for menu query param changes
watch(currentMenu, () => {
    void loadDashboard();
});

// Lifecycle
onMounted(() => {
    void loadDashboard();
});
</script>
