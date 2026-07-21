<template>
    <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">
            {{ t('legal.imprint.title') }}
        </h1>
        <div class="prose prose-lg dark:prose-invert max-w-none">
            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('legal.imprint.company.title') }}</h2>
                <p>{{ t('legal.imprint.company.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('legal.imprint.contact.title') }}</h2>
                <p>{{ t('legal.imprint.contact.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('legal.imprint.responsibility.title') }}</h2>
                <p>{{ t('legal.imprint.responsibility.content') }}</p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'

const loc = useLocalizationStore()
const t = (key: string, params?: Record<string, any>) => loc.t(key, params)
</script>
