<template>
    <button type="button" :class="itemClasses" :disabled="item.disabled" :aria-label="itemLabel" @click="handleClick"
        @keydown.enter="handleClick" @keydown.space.prevent="handleClick">
        <!-- Icon -->
        <div class="nav-item-icon-wrapper">
            <i :class="iconClass" :style="iconStyle" aria-hidden="true"></i>
            <Badge v-if="item.badge" :value="item.badge" :severity="item.badgeSeverity || 'info'"
                class="nav-item-badge" />
        </div>

        <!-- Content -->
        <div class="nav-item-content">
            <span class="nav-item-label">{{ itemLabel }}</span>
            <span v-if="showDescription && item.description" class="nav-item-description">
                {{ item.description }}
            </span>
        </div>

        <!-- Chevron for items with children -->
        <i v-if="item.children && item.children.length > 0" class="pi pi-chevron-right nav-item-chevron"
            aria-hidden="true"></i>
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Badge from 'primevue/badge';
import type { NavigationItem } from './NavigationConfig';

interface Props {
    item: NavigationItem;
    size?: 'small' | 'medium' | 'large';
    orientation?: 'horizontal' | 'vertical';
    showDescription?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    orientation: 'vertical',
    showDescription: false,
});

const emit = defineEmits<{
    click: [item: NavigationItem];
    navigate: [item: NavigationItem];
}>();

const router = useRouter();

// Computed properties
const itemClasses = computed(() => [
    'navigation-item',
    `navigation-item--${props.size}`,
    `navigation-item--${props.orientation}`,
    {
        'navigation-item--disabled': props.item.disabled,
        'navigation-item--has-children': props.item.children && props.item.children.length > 0,
    },
    props.item.customClass,
]);

const iconClass = computed(() => {
    if (props.item.icon.startsWith('pi-')) {
        return `pi ${props.item.icon}`;
    }
    return props.item.icon;
});

const iconStyle = computed(() => {
    if (props.item.iconColor) {
        return { color: props.item.iconColor };
    }
    return undefined;
});

const itemLabel = computed(() => {
    // If label starts with a dot, treat it as a translation key
    if (props.item.label.startsWith('.')) {
        // In a real implementation, use i18n here
        return props.item.label.substring(1);
    }
    return props.item.label;
});

// Methods
const handleClick = () => {
    if (props.item.disabled) {
        return;
    }

    emit('click', props.item);

    // Execute custom action if provided
    if (props.item.action) {
        void props.item.action();
        return;
    }

    // Navigate to route if provided
    if (props.item.route) {
        if (props.item.external) {
            window.open(props.item.route, '_blank');
        } else {
            void router.push(props.item.route);
            emit('navigate', props.item);
        }
    }
};
</script>

<style scoped>
/* Base Navigation Item Styles */
.navigation-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: var(--surface-0);
    border: 2px solid var(--surface-border);
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-family: inherit;
    box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06);
}

.navigation-item:hover:not(.navigation-item--disabled) {
    background: var(--surface-hover);
    border-color: var(--primary-color);
    border-width: 2px;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.navigation-item:active:not(.navigation-item--disabled) {
    transform: translateY(0);
}

.navigation-item:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

.navigation-item--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Icon Wrapper */
.nav-item-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.nav-item-icon-wrapper i {
    font-size: 2.5rem;
    color: var(--primary-color);
    transition: transform 0.2s ease;
}

.navigation-item:hover:not(.navigation-item--disabled) .nav-item-icon-wrapper i {
    transform: scale(1.1);
}

.nav-item-badge {
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
}

/* Content */
.nav-item-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
}

.nav-item-label {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.4;
}

.nav-item-description {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    line-height: 1.4;
}

/* Chevron */
.nav-item-chevron {
    font-size: 1.25rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
    transition: transform 0.2s ease;
}

.navigation-item:hover:not(.navigation-item--disabled) .nav-item-chevron {
    transform: translateX(4px);
}

/* Size Variants */
.navigation-item--small {
    padding: 0.75rem 1rem;
}

.navigation-item--small .nav-item-icon-wrapper i {
    font-size: 1.5rem;
}

.navigation-item--small .nav-item-label {
    font-size: 0.875rem;
}

.navigation-item--small .nav-item-description {
    font-size: 0.75rem;
}

.navigation-item--medium {
    padding: 1rem 1.5rem;
}

.navigation-item--medium .nav-item-icon-wrapper i {
    font-size: 2.5rem;
}

.navigation-item--large {
    padding: 1.5rem 2rem;
}

.navigation-item--large.navigation-item--horizontal {
    padding-bottom: 3rem;
}

.navigation-item--large .nav-item-icon-wrapper i {
    font-size: 3.5rem;
}

.navigation-item--large .nav-item-label {
    font-size: 1.25rem;
}

.navigation-item--large .nav-item-description {
    font-size: 1rem;
}

/* Orientation: Vertical (Mobile default) */
.navigation-item--vertical {
    flex-direction: row;
    justify-content: flex-start;
    width: 100%;
}

/* Orientation: Horizontal (Desktop) */
.navigation-item--horizontal {
    flex-direction: column;
    text-align: center;
    min-width: 180px;
    width: auto;
    flex: 0 1 auto;
    padding-bottom: 2.5rem;
}

.navigation-item--horizontal .nav-item-content {
    align-items: center;
}

.navigation-item--horizontal .nav-item-chevron {
    position: absolute;
    bottom: 0.75rem;
    right: 50%;
    transform: translateX(50%) rotate(90deg);
    font-size: 1.5rem;
}

.navigation-item--horizontal:hover:not(.navigation-item--disabled) .nav-item-chevron {
    transform: translateX(50%) rotate(90deg) translateY(4px);
}

/* Responsive adjustments */
@media (min-width: 768px) {
    .navigation-item--large {
        min-height: 140px;
    }

    .navigation-item--large.navigation-item--horizontal {
        min-width: 200px;
    }
}
</style>
