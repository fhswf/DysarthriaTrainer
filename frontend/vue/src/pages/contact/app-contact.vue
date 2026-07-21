<template>
    <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">
            {{ t('pages.contact.title') }}
        </h1>
        <p class="text-xl text-surface-600 dark:text-surface-400 mb-8">
            {{ t('pages.contact.subtitle') }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Contact Information -->
            <div class="bg-white dark:bg-surface-800 rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
                    {{ t('pages.contact.info.title') }}
                </h2>
                <div class="space-y-4">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-envelope text-primary-600 mt-1"></i>
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">{{ t('pages.contact.info.email')
                                }}</p>
                            <p class="text-surface-600 dark:text-surface-400">contact@example.com</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <i class="pi pi-phone text-primary-600 mt-1"></i>
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">{{ t('pages.contact.info.phone')
                                }}</p>
                            <p class="text-surface-600 dark:text-surface-400">+49 (0) 123 456789</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <i class="pi pi-map-marker text-primary-600 mt-1"></i>
                        <div>
                            <p class="font-medium text-surface-900 dark:text-surface-0">{{
                                t('pages.contact.info.address') }}</p>
                            <p class="text-surface-600 dark:text-surface-400">Example Street 123<br>12345 City, Germany
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contact Form Placeholder -->
            <div class="bg-white dark:bg-surface-800 rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
                    {{ t('pages.contact.form.title') }}
                </h2>
                <p class="text-surface-600 dark:text-surface-400">
                    {{ t('pages.contact.form.placeholder') }}
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
