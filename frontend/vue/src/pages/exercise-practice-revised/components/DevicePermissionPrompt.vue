<template>
    <Card class="permission-prompt max-w-md mx-auto">
        <!-- Header -->
        <template #header>
            <div class="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20">
                <i :class="[
                    'text-3xl',
                    permissionState === 'denied' ? 'pi pi-times-circle text-red-500' :
                        permissionState === 'granted' ? 'pi pi-check-circle text-green-500' :
                            permissionState === 'checking' ? 'pi pi-spin pi-spinner text-blue-500' :
                                'pi pi-microphone text-blue-500'
                ]" />
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
                    {{ permissionState === 'denied' ? labels.permissionDenied : labels.permissionRequired }}
                </h3>
            </div>
        </template>

        <!-- Content -->
        <template #content>
            <!-- Message -->
            <div class="space-y-4">
                <!-- Main message -->
                <p class="text-surface-700 dark:text-surface-300">
                    {{ customMessage || (permissionState === 'denied' ? labels.deniedMessage : labels.message) }}
                </p>

                <!-- Denied state instructions -->
                <div v-if="permissionState === 'denied' && showInstructions"
                    class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 space-y-3">
                    <p class="font-medium text-surface-900 dark:text-surface-100">
                        {{ labels.instructions }}
                    </p>
                    <ol class="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                        <li>{{ labels.step1 }}</li>
                        <li>{{ labels.step2 }}</li>
                        <li>{{ labels.step3 }}</li>
                    </ol>
                </div>

                <!-- Privacy notice -->
                <div class="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <i class="pi pi-info-circle text-blue-500 mt-0.5" />
                    <p class="text-sm text-surface-700 dark:text-surface-300">
                        {{ labels.privacyNotice }}
                    </p>
                </div>
            </div>
        </template>

        <!-- Footer with actions -->
        <template #footer>
            <div class="flex gap-3 justify-end">
                <Button v-if="permissionState !== 'granted'" :label="labels.dismiss" severity="secondary" text
                    @click="emit('dismiss')" />
                <Button v-if="permissionState !== 'granted'" :label="labels.allow"
                    :loading="permissionState === 'checking'" :disabled="permissionState === 'checking'"
                    icon="pi pi-microphone" @click="handleRequestPermission" />
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Card from 'primevue/card'
import Button from 'primevue/button'

interface Props {
    /** Permission state */
    permissionState: 'prompt' | 'denied' | 'granted' | 'checking'

    /** Show detailed instructions */
    showInstructions?: boolean

    /** Custom message */
    customMessage?: string
}

withDefaults(defineProps<Props>(), {
    showInstructions: true,
    customMessage: undefined
})

interface Emits {
    (e: 'request-permission'): void
    (e: 'dismiss'): void
}

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

const labels = ref({
    permissionRequired: '',
    permissionDenied: '',
    message: '',
    deniedMessage: '',
    instructions: '',
    step1: '',
    step2: '',
    step3: '',
    privacyNotice: '',
    allow: '',
    dismiss: ''
})

onMounted(() => {
    labels.value.permissionRequired = loc.t('recording.permissions.title')
    labels.value.permissionDenied = loc.t('recording.permissions.denied')
    labels.value.message = loc.t('recording.permissions.prompt')
    labels.value.deniedMessage = loc.t('recording.permissions.deniedMessage')
    labels.value.instructions = loc.t('recording.permissions.instructions')
    labels.value.step1 = loc.t('recording.permissions.step1')
    labels.value.step2 = loc.t('recording.permissions.step2')
    labels.value.step3 = loc.t('recording.permissions.step3')
    labels.value.privacyNotice = loc.t('recording.permissions.privacyNotice')
    labels.value.allow = loc.t('recording.permissions.allow')
    labels.value.dismiss = loc.t('common.cancel')
})

function handleRequestPermission() {
    emit('request-permission')
}
</script>
