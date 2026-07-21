<template>
    <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">
            {{ t('legal.terms.title') }}
        </h1>
        <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-surface-600 dark:text-surface-400 mb-4">
                {{ t('legal.terms.lastUpdated', { date: '2025-01-01' }) }}
            </p>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('legal.terms.section1.title') }}</h2>
                <p>{{ t('legal.terms.section1.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('legal.terms.section2.title') }}</h2>
                <p>{{ t('legal.terms.section2.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('legal.terms.section3.title') }}</h2>
                <p>{{ t('legal.terms.section3.content') }}</p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'

const loc = useLocalizationStore()
const t = (key: string, params?: Record<string, any>) => loc.t(key, params)
</script>
