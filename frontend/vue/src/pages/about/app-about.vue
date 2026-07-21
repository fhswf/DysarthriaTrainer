<template>
    <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">
            {{ t('pages.about.title') }}
        </h1>
        <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-xl text-surface-600 dark:text-surface-400 mb-8">
                {{ t('pages.about.subtitle') }}
            </p>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.about.mission.title') }}</h2>
                <p>{{ t('pages.about.mission.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.about.vision.title') }}</h2>
                <p>{{ t('pages.about.vision.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.about.values.title') }}</h2>
                <p>{{ t('pages.about.values.content') }}</p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'

const loc = useLocalizationStore()
const t = (key: string, params?: Record<string, any>) => loc.t(key, params)
</script>
