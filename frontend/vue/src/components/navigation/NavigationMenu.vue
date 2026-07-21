<template>
    <nav :class="containerClasses" :aria-label="title || 'Navigation'">
        <!-- Title (optional) -->
        <div v-if="title" class="navigation-menu-header">
            <button v-if="showBackButton" type="button" class="navigation-back-button" @click="handleBack"
                aria-label="Go back">
                <i class="pi pi-arrow-left"></i>
            </button>
            <h2 class="navigation-menu-title">
                <i class="pi pi-compass" aria-hidden="true"></i>
                <span>{{ title }}</span>
            </h2>
        </div>

        <!-- Navigation Items -->
        <div :class="itemsContainerClasses">
            <NavigationItem v-for="item in visibleItems" :key="item.id" :item="item" :size="size"
                :orientation="effectiveOrientation" :show-description="showDescriptions" @click="handleItemClick"
                @navigate="handleNavigate" />
        </div>

        <!-- Empty State -->
        <div v-if="visibleItems.length === 0" class="navigation-empty-state">
            <i class="pi pi-compass" aria-hidden="true"></i>
            <p>No navigation items available</p>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import NavigationItem from './NavigationItem.vue';
import type { NavigationItem as NavigationItemType, NavigationMenuProps } from './NavigationConfig';

const props = withDefaults(defineProps<NavigationMenuProps>(), {
    level: 0,
    orientation: 'auto',
    size: 'large',
    showBackButton: false,
    showDescriptions: true,
    animate: true,
});

const emit = defineEmits<{
    'item-click': [item: NavigationItemType];
    navigate: [item: NavigationItemType];
    back: [];
}>();

const isMobile = ref(false);

// Computed properties
const containerClasses = computed(() => [
    'navigation-menu',
    `navigation-menu--level-${props.level}`,
    `navigation-menu--${props.size}`,
    {
        'navigation-menu--mobile': isMobile.value,
        'navigation-menu--animate': props.animate,
    },
    props.className,
]);

const effectiveOrientation = computed(() => {
    if (props.orientation !== 'auto') {
        return props.orientation;
    }
    // Auto: vertical on mobile, horizontal on desktop
    return isMobile.value ? 'vertical' : 'horizontal';
});

const itemsContainerClasses = computed(() => [
    'navigation-items',
    `navigation-items--${effectiveOrientation.value}`,
]);

const visibleItems = computed(() => {
    return props.items.filter((item) => {
        // Filter by mobile/desktop visibility
        if (isMobile.value && item.showOnMobile === false) {
            return false;
        }
        if (!isMobile.value && item.showOnDesktop === false) {
            return false;
        }

        // Note: Role and permission filtering should be done when creating
        // the navigation config, not here. The config passed to NavigationMenu
        // should already be filtered for the current user's roles/permissions.
        // This keeps the component synchronous and makes the navigation config
        // the single source of truth for what items a user can see.

        return true;
    });
});

// Methods
const handleItemClick = (item: NavigationItemType) => {
    emit('item-click', item);
};

const handleNavigate = (item: NavigationItemType) => {
    emit('navigate', item);
};

const handleBack = () => {
    if (props.onBack) {
        props.onBack();
    } else {
        emit('back');
    }
};

const updateIsMobile = () => {
    // Use 640px breakpoint - only phones are vertical, tablets+ are horizontal
    isMobile.value = window.innerWidth < 640;
};

// Lifecycle
onMounted(() => {
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
});

onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});
</script>

<style scoped>
/* Navigation Menu Container */
.navigation-menu {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 1rem;
    gap: 1rem;
}

/* Header */
.navigation-menu-header {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    position: sticky;
    top: 0;
    z-index: 10;
    background: #ffffff !important;
    background-color: #ffffff !important;
    padding: 0.5rem 0;
    margin: -0.5rem -1rem 1rem -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
}

.navigation-back-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background: var(--surface-0);
    border: 1px solid var(--surface-border);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
}

.navigation-back-button:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
}

.navigation-back-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

.navigation-back-button i {
    font-size: 1.25rem;
    color: var(--text-color);
}

.navigation-menu-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.navigation-menu-title i {
    font-size: 2rem;
    color: var(--primary-color);
}

/* Items Container */
.navigation-items {
    display: flex;
    gap: 1rem;
    width: 100%;
}

/* Vertical Layout (Mobile) */
.navigation-items--vertical {
    flex-direction: column;
}

/* Horizontal Layout (Desktop) */
.navigation-items--horizontal {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
}

/* Empty State */
.navigation-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-color-secondary);
}

.navigation-empty-state i {
    font-size: 3rem;
    opacity: 0.5;
}

.navigation-empty-state p {
    font-size: 1rem;
    margin: 0;
}

/* Size Variants */
.navigation-menu--small {
    padding: 0.5rem;
}

.navigation-menu--small .navigation-items {
    gap: 0.5rem;
}

.navigation-menu--medium {
    padding: 1rem;
}

.navigation-menu--medium .navigation-items {
    gap: 1rem;
}

.navigation-menu--large {
    padding: 1.5rem;
}

.navigation-menu--large .navigation-items {
    gap: 1.5rem;
}

/* Level Variants (for nested navigation) */
.navigation-menu--level-0 {
    /* Primary navigation - full width */
    max-width: 100%;
}

.navigation-menu--level-1 {
    /* Secondary navigation - slightly constrained */
    max-width: 100%;
}

/* Animations */
.navigation-menu--animate .navigation-items {
    animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive Breakpoints */

/* Tablet (768px+) */
@media (min-width: 768px) {
    .navigation-menu {
        padding: 2rem;
    }

    .navigation-menu--level-0 .navigation-items--horizontal {
        max-width: 1200px;
        margin: 0 auto;
    }

    .navigation-menu-title {
        font-size: 1.75rem;
    }

    .navigation-menu-title i {
        font-size: 2.25rem;
    }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
    .navigation-menu {
        padding: 3rem 2rem;
    }

    .navigation-menu--large .navigation-items {
        gap: 2rem;
    }

    .navigation-menu-title {
        font-size: 2rem;
    }

    .navigation-menu-title i {
        font-size: 2.5rem;
    }
}

/* Mobile-specific styles */
.navigation-menu--mobile .navigation-items {
    /* Ensure items fill mobile screen vertically */
    min-height: calc(100vh - 200px);
}

.navigation-menu--mobile .navigation-menu-header {
    position: sticky;
    top: 0;
    background: var(--surface-ground);
    z-index: 10;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--surface-border);
}
</style>
