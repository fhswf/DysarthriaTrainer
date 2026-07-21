<script setup lang="ts">
import { computed } from 'vue'
import Badge from 'primevue/badge'
import type { Exercise } from '@/api/exercises/exercises.types'
import { useLocalizationStore } from '@/stores/localization'

interface Props {
    exercise: Exercise
    compact?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
    select: [exercise: Exercise]
}>()

const loc = useLocalizationStore()

/**
 * Get icon class for difficulty level
 */
function getDifficultyIcon(difficulty?: string): string {
    switch (difficulty) {
        case 'beginner':
            return 'pi pi-star'
        case 'intermediate':
            return 'pi pi-star-fill'
        case 'advanced':
            return 'pi pi-bolt'
        default:
            return 'pi pi-bookmark'
    }
}

/**
 * Handle card click
 */
function handleClick() {
    emit('select', props.exercise)
}

/**
 * Get display text for difficulty badge
 */
const difficultyText = computed(() => {
    if (!props.exercise.difficulty_level) return null
    const key = `common.difficulty.${props.exercise.difficulty_level}`
    return loc.t(key)
})
</script>

<template>
    <button type="button" class="exercise-card" @click="handleClick" @keydown.enter="handleClick"
        @keydown.space.prevent="handleClick"
        :aria-label="`${loc.t('exerciseSelection.selectExercise')}: ${exercise.title}`">
        <!-- Icon with Badge -->
        <div class="exercise-card-icon-wrapper">
            <i :class="getDifficultyIcon(exercise.difficulty_level)" class="exercise-card-icon" aria-hidden="true"></i>
            <Badge v-if="exercise.estimated_duration_minutes" :value="`${exercise.estimated_duration_minutes}min`"
                severity="info" class="exercise-card-badge" />
        </div>

        <!-- Content -->
        <div class="exercise-card-content">
            <!-- Title -->
            <span class="exercise-card-title">{{ exercise.title }}</span>

            <!-- Subtitle -->
            <span v-if="exercise.subtitle" class="exercise-card-subtitle">
                {{ exercise.subtitle }}
            </span>

            <!-- Scope (description) -->
            <span v-if="exercise.scope && !compact" class="exercise-card-description">
                {{ exercise.scope }}
            </span>

            <!-- Difficulty Badge -->
            <div v-if="difficultyText" class="exercise-card-meta">
                <span class="difficulty-badge">
                    {{ difficultyText }}
                </span>
            </div>
        </div>

        <!-- Chevron -->
        <i class="pi pi-chevron-right exercise-card-chevron" aria-hidden="true"></i>
    </button>
</template>

<style scoped>
/* Base Exercise Card Styles (matching NavigationItem) */
.exercise-card {
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
    width: 100%;
    box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06);
}

.exercise-card:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
    border-width: 2px;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.exercise-card:active {
    transform: translateY(0);
}

.exercise-card:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

/* Icon Wrapper */
.exercise-card-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.exercise-card-icon {
    font-size: 2.5rem;
    color: var(--primary-color);
    transition: transform 0.2s ease;
}

.exercise-card:hover .exercise-card-icon {
    transform: scale(1.1);
}

.exercise-card-badge {
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
}

/* Content */
.exercise-card-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
}

.exercise-card-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.4;
}

.exercise-card-subtitle {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color-secondary);
    line-height: 1.4;
}

.exercise-card-description {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    line-height: 1.5;
    margin-top: 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.exercise-card-meta {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.difficulty-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    background: var(--surface-100);
    color: var(--text-color);
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
}

/* Chevron */
.exercise-card-chevron {
    font-size: 1.25rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
    transition: transform 0.2s ease;
}

.exercise-card:hover .exercise-card-chevron {
    transform: translateX(4px);
}

/* Touch-optimized */
@media (max-width: 768px) {
    .exercise-card {
        padding: 1rem;
        gap: 0.75rem;
    }

    .exercise-card-icon {
        font-size: 2rem;
    }

    .exercise-card-title {
        font-size: 1rem;
    }

    .exercise-card-description {
        -webkit-line-clamp: 1;
        line-clamp: 1;
    }
}

/* Tablet and up */
@media (min-width: 768px) {
    .exercise-card {
        padding: 1.25rem 1.75rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .exercise-card {
        padding: 1.5rem 2rem;
    }

    .exercise-card-icon {
        font-size: 3rem;
    }
}
</style>
