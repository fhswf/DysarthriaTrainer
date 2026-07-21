<template>
    <Tag :value="label" :severity="severity" :icon="icon" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

interface Props {
    level: 'beginner' | 'intermediate' | 'advanced';
}

const props = defineProps<Props>();

const severityMap = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger',
} as const;

const iconMap = {
    beginner: 'pi pi-star',
    intermediate: 'pi pi-star-fill',
    advanced: 'pi pi-bolt',
} as const;

const labelMap = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
} as const;

const severity = computed(() => severityMap[props.level]);
const icon = computed(() => iconMap[props.level]);
const label = computed(() => labelMap[props.level]);
</script>
