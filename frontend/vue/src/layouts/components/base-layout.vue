<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

import layouts from '@/layouts'

interface Props {
  componentName: string
  elementProps?: Record<string, unknown>
}

const props = withDefaults(defineProps<Props>(), {
  elementProps: () => ({}),
})

const emit = defineEmits<{
  input: [value: unknown]
}>()

function onInput(value: unknown) {
  emit('input', value)
}

const component = computed<Component | undefined>(() => {
  return layouts[props.componentName] as Component | undefined
})
</script>

<template>
  <component @input="onInput" :is="component" v-bind="props.elementProps">
    <slot />
  </component>
</template>
