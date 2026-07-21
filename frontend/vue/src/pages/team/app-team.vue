<template>
    <div class="max-w-6xl mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4 text-center">
            {{ t('pages.team.title') }}
        </h1>
        <p class="text-xl text-surface-600 dark:text-surface-400 mb-12 text-center">
            {{ t('pages.team.subtitle') }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Placeholder team members -->
            <div v-for="i in 6" :key="i" class="bg-white dark:bg-surface-800 rounded-lg shadow-md p-6 text-center">
                <div
                    class="w-32 h-32 mx-auto mb-4 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                    <i class="pi pi-user text-4xl text-surface-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
                    {{ t('pages.team.member') }} {{ i }}
                </h3>
                <p class="text-surface-600 dark:text-surface-400 mb-4">
                    {{ t('pages.team.role') }}
                </p>
                <p class="text-sm text-surface-500 dark:text-surface-500">
                    {{ t('pages.team.description') }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'

const loc = useLocalizationStore()
const t = (key: string, params?: Record<string, any>) => loc.t(key, params)
</script>
