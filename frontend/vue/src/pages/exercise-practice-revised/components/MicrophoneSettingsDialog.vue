<template>
    <Dialog v-model:visible="dialogVisible" modal header="Mikrofoneinstellungen" :style="{ width: '500px' }"
        :draggable="false">
        <template #header>
            <div class="flex items-center gap-2">
                <i class="pi pi-microphone text-xl" />
                <span>Mikrofoneinstellungen</span>
            </div>
        </template>

        <div class="flex flex-col gap-4">
            <!-- Device Selector Section -->
            <div class="flex flex-col gap-2">
                <label class="font-semibold text-surface-900 dark:text-surface-0">
                    Mikrofonquelle
                </label>
                <Select v-model="selectedValue" :options="deviceOptions" option-label="label" option-value="value"
                    :placeholder="labels.selectDevice" :disabled="disabled || loading || !hasDevices" :loading="loading"
                    class="w-full" @change="handleSelect">
                    <template #value="slotProps">
                        <div v-if="slotProps.value" class="flex items-center gap-2">
                            <i class="pi pi-microphone text-surface-600" />
                            <span>{{ getSelectedDeviceLabel() }}</span>
                        </div>
                        <div v-else class="flex items-center gap-2">
                            <i class="pi pi-microphone text-surface-400" />
                            <span class="text-surface-500">{{ labels.selectDevice }}</span>
                        </div>
                    </template>

                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-microphone text-surface-600" />
                            <span>{{ slotProps.option.label }}</span>
                        </div>
                    </template>

                    <template #empty>
                        <div class="p-3 text-center text-surface-500">
                            {{ labels.noDevices }}
                        </div>
                    </template>
                </Select>
            </div>

            <!-- Connection Status Section -->
            <div class="flex flex-col gap-2">
                <label class="font-semibold text-surface-900 dark:text-surface-0">
                    Verbindungsstatus
                </label>
                <div class="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div :class="[
                        'w-3 h-3 rounded-full',
                        connectionStatusClass
                    ]" />
                    <span class="text-sm">{{ connectionStatusText }}</span>
                </div>
            </div>

            <!-- Device Info (when device is selected) -->
            <div v-if="selectedDeviceInfo" class="flex flex-col gap-2">
                <label class="font-semibold text-surface-900 dark:text-surface-0">
                    Geräteinformationen
                </label>
                <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg text-sm">
                    <div class="grid grid-cols-2 gap-2">
                        <span class="text-surface-600 dark:text-surface-400">Name:</span>
                        <span class="font-medium">{{ selectedDeviceInfo.label || 'Standard-Mikrofon' }}</span>
                        <span class="text-surface-600 dark:text-surface-400">ID:</span>
                        <span class="font-mono text-xs">{{ selectedDeviceInfo.deviceId.substring(0, 20) }}...</span>
                    </div>
                </div>
            </div>

            <!-- Help Text -->
            <div
                class="text-sm text-surface-600 dark:text-surface-400 border-t border-surface-200 dark:border-surface-700 pt-3">
                <i class="pi pi-info-circle mr-2" />
                Wählen Sie das Mikrofon aus, das für die Aufnahme verwendet werden soll.
            </div>
        </div>

        <template #footer>
            <Button label="Schließen" icon="pi pi-times" text @click="dialogVisible = false" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Button from 'primevue/button'

interface Props {
    /** Dialog visibility */
    visible: boolean

    /** Currently selected device ID */
    modelValue: string | null

    /** List of available devices */
    devices: MediaDeviceInfo[] | { deviceId: string; label: string; groupId: string }[]

    /** Show loading state while enumerating */
    loading?: boolean

    /** Disabled state */
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    disabled: false
})

interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'update:modelValue', value: string): void
    (e: 'select', deviceId: string, device: MediaDeviceInfo | { deviceId: string; label: string; groupId: string }): void
    (e: 'change', deviceId: string): void
}

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
})

const selectedValue = computed({
    get: () => props.modelValue,
    set: (value) => {
        if (value) {
            emit('update:modelValue', value)
        }
    }
})

const labels = ref({
    selectDevice: '',
    noDevices: '',
    defaultMicrophone: '',
    deviceConnected: '',
    deviceDisconnected: ''
})

onMounted(() => {
    labels.value.selectDevice = loc.t('recording.device.select')
    labels.value.noDevices = loc.t('recording.device.none')
    labels.value.defaultMicrophone = loc.t('recording.device.default')
    labels.value.deviceConnected = loc.t('recording.device.connected')
    labels.value.deviceDisconnected = loc.t('recording.device.disconnected')
})

const hasDevices = computed(() => props.devices.length > 0)

const deviceOptions = computed(() => {
    if (!hasDevices.value) return []

    return props.devices.map(device => ({
        label: device.label || labels.value.defaultMicrophone,
        value: device.deviceId,
        device
    }))
})

const selectedDeviceInfo = computed(() => {
    if (!props.modelValue) return null
    return props.devices.find(d => d.deviceId === props.modelValue) ?? null
})

const connectionStatusClass = computed(() => {
    if (props.loading) return 'bg-blue-500 animate-pulse'
    if (!hasDevices.value) return 'bg-red-500'
    if (props.modelValue) return 'bg-green-500'
    return 'bg-yellow-500'
})

const connectionStatusText = computed(() => {
    if (props.loading) return 'Geräte werden erkannt...'
    if (!hasDevices.value) return 'Kein Mikrofon gefunden'
    if (props.modelValue) return 'Verbunden und bereit'
    return 'Kein Gerät ausgewählt'
})

function getSelectedDeviceLabel(): string {
    if (!props.modelValue) return labels.value.selectDevice
    const option = deviceOptions.value.find(opt => opt.value === props.modelValue)
    return option?.label ?? labels.value.defaultMicrophone
}

function handleSelect(event: { value: string }) {
    const deviceId = event.value
    if (!deviceId) return

    const device = props.devices.find(d => d.deviceId === deviceId)
    if (!device) return

    emit('update:modelValue', deviceId)
    emit('select', deviceId, device)
    emit('change', deviceId)
}

// Auto-select first device if none selected
watch(() => props.devices, (newDevices) => {
    if (newDevices.length > 0 && !props.modelValue) {
        const defaultDevice = newDevices.find(d => d.deviceId === 'default') ?? newDevices[0]
        if (defaultDevice) {
            emit('update:modelValue', defaultDevice.deviceId)
        }
    }
}, { immediate: true })
</script>
