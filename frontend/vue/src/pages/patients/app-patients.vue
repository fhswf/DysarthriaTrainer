<template>
    <div class="patients-container p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {{ t('patients.title') }}
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ t('patients.subtitle') }}
                </p>
            </div>
            <Button :label="t('patients.actions.addPatient')" icon="pi pi-plus" severity="primary"
                @click="showCreateDialog = true" />
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
            <div class="flex-1">
                <IconField iconPosition="left">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="searchQuery" :placeholder="t('patients.search.placeholder')" class="w-full"
                        @input="handleSearch" />
                </IconField>
            </div>
            <div class="flex gap-2">
                <Select v-model="selectedStatus" :options="statusOptions" optionLabel="label" optionValue="value"
                    :placeholder="t('patients.filters.status')" class="w-48" showClear @change="loadPatients" />
                <Button icon="pi pi-filter-slash" :label="t('patients.actions.clearFilters')" severity="secondary"
                    outlined @click="clearFilters" />
            </div>
        </div>

        <!-- Patients DataTable -->
        <Card>
            <template #content>
                <DataTable :value="patients" :loading="loading" stripedRows paginator :rows="10"
                    :rowsPerPageOptions="[5, 10, 20, 50]" dataKey="id" :globalFilterFields="['full_name', 'email']"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :currentPageReportTemplate="t('patients.table.pageReport')">
                    <!-- Empty State -->
                    <template #empty>
                        <div class="text-center py-8 text-gray-500">
                            <i class="pi pi-users text-4xl mb-4 block opacity-50"></i>
                            <p>{{ t('patients.table.empty') }}</p>
                        </div>
                    </template>

                    <!-- Loading State -->
                    <template #loading>
                        <div class="text-center py-8">
                            <ProgressSpinner style="width: 50px; height: 50px" />
                        </div>
                    </template>

                    <!-- Columns -->
                    <Column field="full_name" :header="t('patients.table.columns.name')" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-3">
                                <Avatar :label="getInitials(data.full_name)" shape="circle" size="normal" />
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-gray-100">
                                        {{ data.full_name || t('patients.table.noName') }}
                                    </div>
                                    <div class="text-sm text-gray-500">{{ data.username }}</div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="email" :header="t('patients.table.columns.email')" sortable>
                        <template #body="{ data }">
                            <span class="text-gray-700 dark:text-gray-300">{{ data.email }}</span>
                        </template>
                    </Column>

                    <Column field="created_at" :header="t('patients.table.columns.registeredAt')" sortable>
                        <template #body="{ data }">
                            <span class="text-gray-700 dark:text-gray-300">
                                {{ formatDate(data.created_at) }}
                            </span>
                        </template>
                    </Column>

                    <Column field="is_active" :header="t('patients.table.columns.status')" sortable>
                        <template #body="{ data }">
                            <Tag :value="data.is_active ? t('patients.status.active') : t('patients.status.inactive')"
                                :severity="data.is_active ? 'success' : 'danger'" rounded />
                        </template>
                    </Column>

                    <Column :header="t('patients.table.columns.actions')" :exportable="false">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button icon="pi pi-eye" severity="info" text rounded
                                    v-tooltip.top="t('patients.actions.view')" @click="viewPatient(data)" />
                                <Button icon="pi pi-pencil" severity="secondary" text rounded
                                    v-tooltip.top="t('patients.actions.edit')" @click="editPatient(data)" />
                                <Button icon="pi pi-trash" severity="danger" text rounded
                                    v-tooltip.top="t('patients.actions.delete')" @click="deletePatient(data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Create/Edit Patient Dialog -->
        <Dialog v-model:visible="showCreateDialog"
            :header="isEditMode ? t('patients.dialog.editTitle') : t('patients.dialog.createTitle')" modal
            :draggable="false" class="w-full max-w-2xl">
            <form @submit.prevent="handleSubmit" class="space-y-6 py-4">
                <!-- Error Message -->
                <Message v-if="formError" severity="error" :closable="false">
                    {{ formError }}
                </Message>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Username -->
                    <div class="form-field">
                        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {{ t('patients.fields.username') }}
                            <span class="text-red-500">*</span>
                        </label>
                        <InputText id="username" v-model="formData.username"
                            :placeholder="t('patients.fields.usernamePlaceholder')"
                            :class="{ 'p-invalid': errors.username }" class="w-full"
                            :disabled="isEditMode || isSubmitting" @input="clearError('username')" />
                        <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
                    </div>

                    <!-- Email -->
                    <div class="form-field">
                        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {{ t('patients.fields.email') }}
                            <span class="text-red-500">*</span>
                        </label>
                        <InputText id="email" v-model="formData.email" type="email"
                            :placeholder="t('patients.fields.emailPlaceholder')" :class="{ 'p-invalid': errors.email }"
                            class="w-full" :disabled="isSubmitting" @input="clearError('email')" />
                        <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
                    </div>

                    <!-- First Name -->
                    <div class="form-field">
                        <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {{ t('patients.fields.firstName') }}
                        </label>
                        <InputText id="firstName" v-model="formData.first_name"
                            :placeholder="t('patients.fields.firstNamePlaceholder')" class="w-full"
                            :disabled="isSubmitting" />
                    </div>

                    <!-- Last Name -->
                    <div class="form-field">
                        <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {{ t('patients.fields.lastName') }}
                        </label>
                        <InputText id="lastName" v-model="formData.last_name"
                            :placeholder="t('patients.fields.lastNamePlaceholder')" class="w-full"
                            :disabled="isSubmitting" />
                    </div>

                    <!-- Password (only for create) -->
                    <div v-if="!isEditMode" class="form-field md:col-span-2">
                        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {{ t('patients.fields.password') }}
                            <span class="text-red-500">*</span>
                        </label>
                        <Password id="password" v-model="formData.password"
                            :placeholder="t('patients.fields.passwordPlaceholder')"
                            :class="{ 'p-invalid': errors.password }" class="w-full" toggleMask :feedback="false"
                            :disabled="isSubmitting" @input="clearError('password')" />
                        <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
                        <small class="text-gray-500">{{ t('patients.fields.passwordHint') }}</small>
                    </div>

                    <!-- Active Status -->
                    <div class="form-field md:col-span-2">
                        <div class="flex items-center gap-2">
                            <Checkbox id="isActive" v-model="formData.is_active" binary :disabled="isSubmitting" />
                            <label for="isActive" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {{ t('patients.fields.isActive') }}
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Dialog Actions -->
                <div class="flex justify-end gap-3 pt-4">
                    <Button :label="t('common.cancel')" severity="secondary" text @click="closeDialog"
                        :disabled="isSubmitting" />
                    <Button type="submit" :label="isEditMode ? t('common.save') : t('common.create')"
                        :loading="isSubmitting" :disabled="isSubmitting" severity="primary" />
                </div>
            </form>
        </Dialog>

        <!-- View Patient Dialog -->
        <Dialog v-model:visible="showViewDialog" :header="t('patients.dialog.viewTitle')" modal :draggable="false"
            class="w-full max-w-2xl">
            <div v-if="selectedPatient" class="space-y-6 py-4">
                <!-- Patient Info Card -->
                <div class="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <Avatar :label="getInitials(selectedPatient.full_name)" shape="circle" size="xlarge" />
                    <div class="flex-1">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {{ selectedPatient.full_name || t('patients.table.noName') }}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400">@{{ selectedPatient.username }}</p>
                    </div>
                    <Tag :value="selectedPatient.is_active ? t('patients.status.active') : t('patients.status.inactive')"
                        :severity="selectedPatient.is_active ? 'success' : 'danger'" />
                </div>

                <!-- Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm font-medium text-gray-500 mb-1">{{ t('patients.fields.email') }}</p>
                        <p class="text-gray-900 dark:text-gray-100">{{ selectedPatient.email }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500 mb-1">{{ t('patients.table.columns.registeredAt') }}
                        </p>
                        <p class="text-gray-900 dark:text-gray-100">{{ formatDate(selectedPatient.created_at) }}</p>
                    </div>
                    <div v-if="selectedPatient.roles && selectedPatient.roles.length > 0" class="md:col-span-2">
                        <p class="text-sm font-medium text-gray-500 mb-1">{{ t('patients.fields.roles') }}</p>
                        <div class="flex gap-2 flex-wrap">
                            <Tag v-for="role in selectedPatient.roles" :key="role" :value="role" severity="info" />
                        </div>
                    </div>
                </div>

                <!-- Placeholder for future features -->
                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-info-circle text-blue-600 text-xl flex-shrink-0 mt-0.5"></i>
                        <div>
                            <p class="font-medium text-blue-800 dark:text-blue-200">
                                {{ t('patients.view.futureFeatures') }}
                            </p>
                            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                {{ t('patients.view.featuresDescription') }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button :label="t('common.close')" severity="secondary" @click="showViewDialog = false" />
                <Button :label="t('patients.actions.edit')" icon="pi pi-pencil" severity="primary"
                    @click="editFromView" />
            </template>
        </Dialog>

        <!-- Placeholder Notice -->
        <div
            class="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div class="flex items-start gap-3">
                <i class="pi pi-info-circle text-yellow-600 text-xl flex-shrink-0 mt-0.5"></i>
                <div>
                    <p class="font-medium text-yellow-800 dark:text-yellow-200">
                        {{ t('patients.placeholder.title') }}
                    </p>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {{ t('patients.placeholder.description') }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLocalizationStore } from '@/stores/localization';
import { useMessagingStore } from '@/stores/messaging';
import { useConfirm } from 'primevue/useconfirm';
import type { User } from '@/api/users/users.types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Checkbox from 'primevue/checkbox';
import ProgressSpinner from 'primevue/progressspinner';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const loc = useLocalizationStore();
const messaging = useMessagingStore();
const confirm = useConfirm();

// Translation helper
const t = (key: string) => loc.t(key);

// State
const patients = ref<User[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedStatus = ref<string | null>(null);
const showCreateDialog = ref(false);
const showViewDialog = ref(false);
const isEditMode = ref(false);
const selectedPatient = ref<User | null>(null);
const isSubmitting = ref(false);
const formError = ref('');
const errors = ref<Record<string, string>>({});

// Form data
const formData = ref({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_active: true,
});

// Mock data for demonstration
const mockPatients: User[] = [
    {
        id: '1',
        username: 'patient001',
        email: 'anna.mueller@example.com',
        full_name: 'Anna Müller',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        is_active: true,
        roles: ['user', 'patient'],
    },
    {
        id: '2',
        username: 'patient002',
        email: 'thomas.schmidt@example.com',
        full_name: 'Thomas Schmidt',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        is_active: true,
        roles: ['user', 'patient'],
    },
    {
        id: '3',
        username: 'patient003',
        email: 'maria.weber@example.com',
        full_name: 'Maria Weber',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        is_active: false,
        roles: ['user', 'patient'],
    },
];

// Status filter options
const statusOptions = ref([
    { label: t('patients.status.all'), value: null },
    { label: t('patients.status.active'), value: true },
    { label: t('patients.status.inactive'), value: false },
]);

// Methods
const loadPatients = async () => {
    loading.value = true;
    try {
        // TODO: Replace with real API call
        // const { usersApi } = await import('@/api/users');
        // patients.value = await usersApi.list({ role: 'patient' });

        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500));
        patients.value = mockPatients.filter(p => {
            if (selectedStatus.value !== null && p.is_active !== Boolean(selectedStatus.value)) {
                return false;
            }
            return true;
        });
    } catch {
        void messaging.error(t('patients.errors.loadFailed'));
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => {
    // TODO: Implement search when API is ready
    void loadPatients();
};

const clearFilters = () => {
    searchQuery.value = '';
    selectedStatus.value = null;
    void loadPatients();
};

const viewPatient = (patient: User) => {
    selectedPatient.value = patient;
    showViewDialog.value = true;
};

const editPatient = (patient: User) => {
    isEditMode.value = true;
    selectedPatient.value = patient;
    formData.value = {
        username: patient.username,
        email: patient.email,
        password: '',
        first_name: patient.first_name ?? '',
        last_name: patient.last_name ?? '',
        is_active: patient.is_active ?? true,
    };
    showCreateDialog.value = true;
};

const editFromView = () => {
    showViewDialog.value = false;
    if (selectedPatient.value) {
        editPatient(selectedPatient.value);
    }
};

const deletePatient = (patient: User) => {
    const patientName = patient.full_name ?? patient.username;
    confirm.require({
        message: `${t('patients.delete.confirmMessage')} ${patientName}?`,
        header: t('patients.delete.confirmTitle'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t('common.delete'),
        rejectLabel: t('common.cancel'),
        acceptClass: 'p-button-danger',
        accept: () => {
            // TODO: Implement delete API call
            void messaging.success(t('patients.delete.success'));
            void loadPatients();
        },
    });
};

const clearError = (field: string) => {
    errors.value[field] = '';
    formError.value = '';
};

const validateForm = (): boolean => {
    errors.value = {};

    if (!formData.value.username) {
        errors.value.username = t('patients.validation.usernameRequired');
    }

    if (!formData.value.email) {
        errors.value.email = t('patients.validation.emailRequired');
    }

    if (!isEditMode.value && !formData.value.password) {
        errors.value.password = t('patients.validation.passwordRequired');
    }

    return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    isSubmitting.value = true;
    formError.value = '';

    try {
        // TODO: Implement create/update API calls
        const action = isEditMode.value ? 'updated' : 'created';
        void messaging.success(t(`patients.success.${action}`));
        closeDialog();
        await loadPatients();
    } catch {
        formError.value = t('patients.errors.submitFailed');
    } finally {
        isSubmitting.value = false;
    }
};

const closeDialog = () => {
    showCreateDialog.value = false;
    isEditMode.value = false;
    selectedPatient.value = null;
    formData.value = {
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        is_active: true,
    };
    errors.value = {};
    formError.value = '';
};

const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(loc.currentLocale === 'de' ? 'de-DE' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Lifecycle
onMounted(() => {
    void loadPatients();
});
</script>

<style scoped>
.patients-container {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.form-field {
    margin-bottom: 0.5rem;
}

/* Ensure password component takes full width */
:deep(.p-password) {
    width: 100%;
}

:deep(.p-password-input) {
    width: 100%;
}
</style>
