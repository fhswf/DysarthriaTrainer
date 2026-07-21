<template>
    <div class="flex flex-col h-screen bg-surface-ground">
        <!-- Dashboard Header with Background -->
        <div class="relative header-wrapper">
            <!-- Background Image with Gradient Overlay -->
            <img :src="backgroundImage" alt="" class="absolute inset-0 w-full h-full object-cover z-0" />
            <div class="absolute inset-0 z-0 brand-gradient"></div>

            <Toolbar
                class="border-0 border-b border-surface-200 dark:border-surface-700 shadow-sm app-dashboard-header relative">
                <!-- Logo/Brand -->
                <template #start>
                    <div class="flex items-center gap-3 sm:gap-4 relative z-10">
                        <!-- Brand Text - White like login title -->
                        <router-link :to="brandRoute"
                            class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <i class="pi pi-home text-xl text-white drop-shadow-lg" />
                            <span class="text-lg font-bold text-white drop-shadow-lg hidden sm:inline">
                                {{ brandName }}
                            </span>
                        </router-link>
                    </div>
                </template>

                <!-- User Actions -->
                <template #end>
                    <div v-if="userProfile" class="flex items-center gap-1 sm:gap-2 relative z-10">
                        <!-- User Avatar Button - White text on toolbar -->
                        <Button text rounded class="flex items-center gap-2 p-2 text-surface-900"
                            v-tooltip.bottom="userProfile.displayName">
                            <Avatar v-if="userProfile.avatar" :image="userProfile.avatar" shape="circle"
                                size="normal" />
                            <Avatar v-else :label="userInitials" shape="circle" size="normal"
                                class="bg-primary-600 text-white" />
                            <span class="text-sm font-medium hidden lg:inline">
                                {{ userProfile.displayName }}
                            </span>
                        </Button>

                        <!-- Action Buttons -->
                        <div class="hidden md:flex items-center gap-1">
                            <!-- Profile Link -->
                            <router-link to="/profile">
                                <Button icon="pi pi-user" text rounded severity="secondary"
                                    v-tooltip.bottom="t('dashboard.header.profileTooltip')" aria-label="Profile" />
                            </router-link>

                            <!-- Logout Button -->
                            <Button icon="pi pi-sign-out" text rounded severity="danger" @click="handleLogout"
                                v-tooltip.bottom="t('dashboard.header.logoutTooltip')" data-testid="logout-button"
                                aria-label="Logout" />
                        </div>

                        <!-- Mobile Menu Button - Only on small screens -->
                        <div class="md:hidden">
                            <Button icon="pi pi-bars" text rounded severity="secondary" @click="toggleMobileMenu"
                                aria-label="Menu" />
                        </div>
                    </div>
                </template>
            </Toolbar>
        </div>

        <!-- Mobile Menu Overlay -->
        <Popover ref="mobileMenuRef" class="md:hidden">
            <div class="flex flex-col gap-2 p-2 min-w-[200px]">
                <!-- Profile Button -->
                <router-link to="/profile" @click="closeMobileMenu">
                    <Button :label="t('dashboard.header.profile')" icon="pi pi-user" text
                        class="w-full justify-start" />
                </router-link>

                <Divider />

                <!-- Logout Button -->
                <Button :label="t('dashboard.header.logout')" icon="pi pi-sign-out" text severity="danger"
                    class="w-full justify-start" @click="handleLogoutAndCloseMenu" />
            </div>
        </Popover>

        <!-- Main Content Area (Scrollable) -->
        <main class="flex-1 overflow-y-auto">
            <RouterView />
        </main>

        <!-- Dashboard Footer -->
        <footer class="flex-shrink-0 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
            <!-- Mobile: Collapsible footer with expand button -->
            <div class="lg:hidden">
                <!-- Collapsed state: just copyright and expand button -->
                <div v-if="!footerExpanded" class="px-4 py-3 flex items-center justify-between">
                    <p class="text-xs text-surface-500 dark:text-surface-500">
                        © {{ currentYear }} {{ brandName }}
                    </p>
                    <Button icon="pi pi-chevron-up" text rounded size="small" @click="footerExpanded = true"
                        v-tooltip.top="t('dashboard.footer.showLinks')" aria-label="Show footer links"
                        class="text-surface-400 hover:text-surface-600" />
                </div>

                <!-- Expanded state: full footer -->
                <div v-else class="px-4 py-4">
                    <!-- Collapse button -->
                    <div class="flex justify-end mb-3">
                        <Button icon="pi pi-chevron-down" text rounded size="small" @click="footerExpanded = false"
                            v-tooltip.top="t('dashboard.footer.hideLinks')" aria-label="Hide footer links"
                            class="text-surface-400 hover:text-surface-600" />
                    </div>

                    <!-- Links -->
                    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-3">
                        <router-link to="/terms"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.terms') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/privacy"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.privacy') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/imprint"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.imprint') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/about"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.about') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/team"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.team') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/license"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.license') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/help"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.help') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/contact"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.contact') }}
                        </router-link>
                    </div>

                    <!-- Copyright -->
                    <div class="text-center">
                        <p class="text-xs text-surface-500 dark:text-surface-500">
                            {{ t('dashboard.footer.copyright', { year: currentYear, name: brandName }) }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Desktop: Always expanded footer -->
            <div class="hidden lg:block">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <!-- Single line link collection -->
                    <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4">
                        <router-link to="/terms"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.terms') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/privacy"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.privacy') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/imprint"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.imprint') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/about"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.about') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/team"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.team') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/license"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.license') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/help"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.help') }}
                        </router-link>
                        <span class="text-surface-400 dark:text-surface-600">•</span>
                        <router-link to="/contact"
                            class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {{ t('dashboard.footer.contact') }}
                        </router-link>
                    </div>

                    <!-- Copyright -->
                    <div class="text-center">
                        <p class="text-sm text-surface-500 dark:text-surface-500">
                            {{ t('dashboard.footer.copyright', { year: currentYear, name: brandName }) }}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getServiceAsync } from '@/services/serviceRegistry'
import type { useAuthStore } from '@/stores/auth'
import type { useLocalizationStore } from '@/stores/localization'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Popover from 'primevue/popover'
import Divider from 'primevue/divider'
import backgroundImage from './background_login.png'

const router = useRouter()

// Services loaded asynchronously
const auth = ref<ReturnType<typeof useAuthStore> | null>(null)
const loc = ref<ReturnType<typeof useLocalizationStore> | null>(null)

// Mobile menu ref
const mobileMenuRef = ref()

// Footer expanded state for mobile
const footerExpanded = ref(false)

// Translation helper
const t = (key: string, params?: Record<string, string | number>) => loc.value?.t(key, params) ?? key

// Brand configuration
const brandName = ref('AKI Sprachtraining')
const brandRoute = ref('/dashboard')

// Load services on mount
onMounted(async () => {
    auth.value = await getServiceAsync<ReturnType<typeof useAuthStore>>('auth')
    loc.value = await getServiceAsync<ReturnType<typeof useLocalizationStore>>('localization')

    // Load user profile after auth service is available
    await loadUserProfile()
})

/**
 * Load user profile from auth store
 * Uses getActiveUser() to show the currently active user (supports user switching)
 */
const loadUserProfile = async () => {
    if (!auth.value) return

    const user = await auth.value.getActiveUser()
    if (!user) {
        userProfile.value = null
        return
    }

    // Map backend fields to UI fields
    const fullName = user.full_name ?? ''
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts.slice(1).join(' ') ?? ''

    const displayName = fullName.trim() || user.username

    userProfile.value = {
        ...user,
        fullName,
        displayName,
        firstName,
        lastName,
        username: user.username,
        avatar: user.avatar,
    }
}

// User profile with computed properties
const userProfile = ref<{
    fullName: string
    displayName: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
} | null>(null)

// Current year for copyright
const currentYear = computed(() => new Date().getFullYear())

// User initials for avatar (matching navbar logic)
const userInitials = computed(() => {
    if (!userProfile.value) return '?'

    const { firstName, lastName, displayName, username } = userProfile.value

    // Use firstName and lastName if available
    if (firstName && lastName) {
        return (firstName[0] + lastName[0]).toUpperCase()
    } else if (firstName) {
        return firstName[0].toUpperCase()
    } else if (lastName) {
        return lastName[0].toUpperCase()
    }

    // Fallback: try to extract from displayName
    const parts = displayName?.split(' ').filter(p => p.length > 0) || []
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    } else if (parts.length === 1 && parts[0].length > 0) {
        return parts[0][0].toUpperCase()
    }

    // Last resort: use username
    return username ? username[0].toUpperCase() : '?'
})

// Logout handler
const handleLogout = async () => {
    try {
        if (auth.value) {
            await auth.value.logout()
        }
        await router.push('/login')
    } catch (_error) {
        // Error handling for logout/navigation
    }
}

// Mobile menu handlers
const toggleMobileMenu = (event: Event) => {
    mobileMenuRef.value?.toggle(event)
}

const closeMobileMenu = () => {
    mobileMenuRef.value?.hide()
}

const handleLogoutAndCloseMenu = async () => {
    closeMobileMenu()
    await handleLogout()
}
</script>

<style scoped>
/* Header wrapper for background positioning */
.header-wrapper {
    overflow: hidden;
}

/* Ensure dashboard header appears above content */
.app-dashboard-header {
    position: relative;
    z-index: 999;
    background: transparent !important;
}

/* Gradient overlay on background image */
.brand-gradient {
    background: linear-gradient(to right, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 30%, rgba(255, 255, 255, 0.95) 70%, rgba(255, 255, 255, 1) 100%);
    pointer-events: none;
}

/* Override PrimeVue toolbar default padding for better mobile spacing */
:deep(.p-toolbar) {
    padding: 0.75rem 1rem;
    background: transparent !important;
}

@media (min-width: 640px) {
    :deep(.p-toolbar) {
        padding: 0.75rem 1.5rem;
    }
}

@media (min-width: 1024px) {
    :deep(.p-toolbar) {
        padding: 0.75rem 2rem;
    }
}
</style>
