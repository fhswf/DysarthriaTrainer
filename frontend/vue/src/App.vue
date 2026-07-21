<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import BaseLayout from '@/layouts/components/base-layout.vue'
import { useMessagingStore } from '@/stores/messaging'

/**
 * change layout to route meta layout, set in routes/index.ts
 */
const router = useRouter()
const layout = ref('default-layout')
const toast = useToast()
const messagingStore = useMessagingStore()

// Inject PrimeVue toast into messaging service
onMounted(async () => {
  await messagingStore.setPrimeVueToast(toast)
})

router.beforeEach((to) => {
  if (to.meta?.layout) {
    layout.value = to.meta?.layout as string
  } else {
    layout.value = 'default-layout'
  }
})
</script>

<template>
  <Toast position="bottom-right" />
  <BaseLayout :component-name="layout">
    <RouterView />
  </BaseLayout>
</template>

<style scoped></style>
