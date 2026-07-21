<template>
    <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">
            {{ t('pages.license.title') }}
        </h1>
        <div class="prose prose-lg dark:prose-invert max-w-none">
            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.license.software.title') }}</h2>
                <p>{{ t('pages.license.software.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.license.content.title') }}</h2>
                <p>{{ t('pages.license.content.content') }}</p>
            </section>

            <section class="mb-8">
                <h2 class="text-2xl font-semibold mb-4">{{ t('pages.license.thirdparty.title') }}</h2>
                <p>{{ t('pages.license.thirdparty.content') }}</p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'

const loc = useLocalizationStore()
const t = (key: string, params?: Record<string, any>) => loc.t(key, params)
</script>
