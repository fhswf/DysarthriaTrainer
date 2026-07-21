<template>
    <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">
            {{ t('pages.help.title') }}
        </h1>
        <div class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-xl text-surface-600 dark:text-surface-400 mb-8">
                {{ t('pages.help.subtitle') }}
            </p>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.help.gettingStarted.title') }}</h2>
                <p>{{ t('pages.help.gettingStarted.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.help.faq.title') }}</h2>
                <p>{{ t('pages.help.faq.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.help.troubleshooting.title') }}</h2>
                <p>{{ t('pages.help.troubleshooting.content') }}</p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'

const loc = useLocalizationStore()
const t = (key: string, params?: Record<string, any>) => loc.t(key, params)
</script>
