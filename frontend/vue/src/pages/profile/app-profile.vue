<template>
    <div class="profile-container max-w-4xl mx-auto px-6 py-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ loc.t('profile.title') }}
            </h1>
            <p class="text-gray-600">
                {{ loc.t('profile.subtitle') }}
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Profile Information Card -->
            <div class="lg:col-span-2">
                <Card>
                    <template #header>
                        <div class="px-6 pt-6">
                            <h2 class="text-xl font-semibold text-gray-900">
                                {{ loc.t('profile.personalInfo') }}
                            </h2>
                        </div>
                    </template>
                    <template #content>
                        <form @submit.prevent="handleSubmit" class="space-y-6">
                            <!-- General Error Message -->
                            <Message v-if="formError" severity="error" :closable="false">
                                {{ formError }}
                            </Message>

                            <!-- Success Message -->
                            <Message v-if="successMessage" severity="success" closable @close="successMessage = ''">
                                {{ successMessage }}
                            </Message>

                            <!-- Email Field (Read-only) -->
                            <div class="form-field">
                                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                                    {{ loc.t('auth.fields.email') }}
                                </label>
                                <InputText id="email" v-model="formData.email" type="email" class="w-full" disabled />
                                <small class="text-gray-500">{{ loc.t('profile.emailNote') }}</small>
                            </div>

                            <!-- Username Field (Read-only) -->
                            <div class="form-field">
                                <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                                    {{ loc.t('auth.fields.username') }}
                                </label>
                                <InputText id="username" v-model="formData.username" class="w-full" disabled />
                                <small class="text-gray-500">{{ loc.t('profile.usernameNote') }}</small>
                            </div>

                            <!-- First Name Field -->
                            <div class="form-field">
                                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
                                    {{ loc.t('profile.firstName') }}
                                </label>
                                <InputText id="firstName" v-model="formData.first_name"
                                    :placeholder="loc.t('profile.enterFirstName')"
                                    :class="{ 'p-invalid': errors.first_name }" class="w-full" :disabled="isSubmitting"
                                    @input="clearError('first_name')" />
                                <small v-if="errors.first_name" class="p-error">{{ errors.first_name }}</small>
                            </div>

                            <!-- Last Name Field -->
                            <div class="form-field">
                                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
                                    {{ loc.t('profile.lastName') }}
                                </label>
                                <InputText id="lastName" v-model="formData.last_name"
                                    :placeholder="loc.t('profile.enterLastName')"
                                    :class="{ 'p-invalid': errors.last_name }" class="w-full" :disabled="isSubmitting"
                                    @input="clearError('last_name')" />
                                <small v-if="errors.last_name" class="p-error">{{ errors.last_name }}</small>
                            </div>

                            <!-- Submit Button -->
                            <div class="flex justify-end">
                                <Button type="submit" :label="loc.t('profile.saveChanges')" icon="pi pi-check"
                                    :loading="isSubmitting" :disabled="isSubmitting" severity="primary" />
                            </div>
                        </form>
                    </template>
                </Card>
            </div>

            <!-- Security Card -->
            <div class="lg:col-span-1">
                <Card>
                    <template #header>
                        <div class="px-6 pt-6">
                            <h2 class="text-xl font-semibold text-gray-900">
                                {{ loc.t('profile.security') }}
                            </h2>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            <!-- Change Password Button -->
                            <Button :label="loc.t('profile.changePassword')" icon="pi pi-lock" severity="secondary"
                                outlined class="w-full" @click="showPasswordDialog = true" />

                            <!-- Account Status -->
                            <div class="pt-4 border-t border-gray-200">
                                <p class="text-sm text-gray-600 mb-1">
                                    {{ loc.t('profile.accountStatus') }}
                                </p>
                                <Tag :value="(formData.is_active ?? false) ? loc.t('profile.active') : loc.t('profile.inactive')"
                                    :severity="(formData.is_active ?? false) ? 'success' : 'danger'" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Change Password Dialog -->
        <Dialog v-model:visible="showPasswordDialog" :header="loc.t('profile.changePassword')" modal closable
            :draggable="false" class="w-full max-w-md">
            <form @submit.prevent="handlePasswordChange" class="space-y-6">
                <!-- Password Error Message -->
                <Message v-if="passwordError" severity="error" :closable="false">
                    {{ passwordError }}
                </Message>

                <!-- Current Password -->
                <div class="form-field">
                    <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ loc.t('profile.currentPassword') }}
                        <span class="text-red-500">*</span>
                    </label>
                    <Password id="currentPassword" v-model="passwordForm.currentPassword"
                        :placeholder="loc.t('profile.enterCurrentPassword')"
                        :class="{ 'p-invalid': passwordErrors.currentPassword }" class="w-full" toggle-mask
                        :feedback="false" :disabled="isChangingPassword"
                        @input="clearPasswordError('currentPassword')" />
                    <small v-if="passwordErrors.currentPassword" class="p-error">
                        {{ passwordErrors.currentPassword }}
                    </small>
                </div>

                <!-- New Password -->
                <div class="form-field">
                    <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ loc.t('profile.newPassword') }}
                        <span class="text-red-500">*</span>
                    </label>
                    <Password id="newPassword" v-model="passwordForm.newPassword"
                        :placeholder="loc.t('profile.enterNewPassword')"
                        :class="{ 'p-invalid': passwordErrors.newPassword }" class="w-full" toggle-mask feedback
                        :strong-label="loc.t('auth.password.strong')" :medium-label="loc.t('auth.password.medium')"
                        :weak-label="loc.t('auth.password.weak')" :disabled="isChangingPassword"
                        @input="clearPasswordError('newPassword')">
                        <template #footer>
                            <h6>{{ loc.t('auth.password.requirements') }}</h6>
                            <Divider />
                            <ul class="text-xs space-y-1">
                                <li>{{ loc.t('auth.password.minLength') }}</li>
                                <li>{{ loc.t('auth.password.uppercase') }}</li>
                                <li>{{ loc.t('auth.password.lowercase') }}</li>
                                <li>{{ loc.t('auth.password.number') }}</li>
                                <li>{{ loc.t('auth.password.special') }}</li>
                            </ul>
                        </template>
                    </Password>
                    <small v-if="passwordErrors.newPassword" class="p-error">
                        {{ passwordErrors.newPassword }}
                    </small>
                </div>

                <!-- Confirm New Password -->
                <div class="form-field">
                    <label for="confirmNewPassword" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ loc.t('profile.confirmNewPassword') }}
                        <span class="text-red-500">*</span>
                    </label>
                    <Password id="confirmNewPassword" v-model="passwordForm.confirmPassword"
                        :placeholder="loc.t('profile.confirmNewPassword')"
                        :class="{ 'p-invalid': passwordErrors.confirmPassword }" class="w-full" toggle-mask
                        :feedback="false" :disabled="isChangingPassword"
                        @input="clearPasswordError('confirmPassword')" />
                    <small v-if="passwordErrors.confirmPassword" class="p-error">
                        {{ passwordErrors.confirmPassword }}
                    </small>
                </div>

                <!-- Dialog Actions -->
                <div class="flex justify-end gap-3 pt-4">
                    <Button :label="loc.t('common.cancel')" severity="secondary" text @click="closePasswordDialog"
                        :disabled="isChangingPassword" />
                    <Button type="submit" :label="loc.t('profile.updatePassword')" :loading="isChangingPassword"
                        :disabled="isChangingPassword" severity="primary" />
                </div>
            </form>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLocalizationStore } from '@/stores/localization';
import { useAuthStore } from '@/stores/auth';
import { useMessagingStore } from '@/stores/messaging';
import { useApiStore } from '@/stores/api';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';

const router = useRouter();
const loc = useLocalizationStore();
const auth = useAuthStore();
const messaging = useMessagingStore();
const apiStore = useApiStore();

// Profile form data
const formData = ref({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    is_active: false,
    is_staff: false,
    is_superuser: false,
});

const errors = ref<Record<string, string>>({});
const formError = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);

// Password dialog state
const showPasswordDialog = ref(false);
const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
});
const passwordErrors = ref<Record<string, string>>({});
const passwordError = ref('');
const isChangingPassword = ref(false);

/**
 * Load user profile data
 */
const loadProfile = async () => {
    try {
        // Get fresh user data from backend
        const { usersApi } = await import('@/api/users/users.api');
        const user = await usersApi.getCurrentUser();
        
        if (user) {
            // Split full_name into first_name and last_name for editing
            const fullName = user.full_name ?? '';
            const nameParts = fullName.trim().split(/\s+/);
            const firstName = nameParts[0] ?? '';
            const lastName = nameParts.slice(1).join(' ') ?? '';
            
            formData.value = {
                email: user.email,
                username: user.username,
                first_name: firstName,
                last_name: lastName,
                is_active: true, // Backend doesn't return these fields
                is_staff: false,
                is_superuser: false,
            };
        }
    } catch (error: unknown) {
        // eslint-disable-next-line no-console
        console.error('[Profile] Failed to load profile:', error);
        
        // If auth error (401/403), redirect to login
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseStatus = (error as any)?.response?.status;
        if (responseStatus === 401 || responseStatus === 403) {
            // eslint-disable-next-line no-console
            console.warn('[Profile] Authentication error - redirecting to login');
            const authStore = useAuthStore();
            await authStore.forceLogout();
            void router.push('/login?redirect=/profile');
        } else {
            // Show error message for other errors
            const messagingStore = useMessagingStore();
            await messagingStore.error('Failed to load profile data. Please try again.');
        }
    }
};

/**
 * Clear field error
 */
const clearError = (field: string) => {
    errors.value[field] = '';
    formError.value = '';
};

/**
 * Clear password field error
 */
const clearPasswordError = (field: string) => {
    passwordErrors.value[field] = '';
    passwordError.value = '';
};

/**
 * Handle profile form submission
 */
const handleSubmit = async () => {
    try {
        isSubmitting.value = true;
        formError.value = '';
        errors.value = {};
        successMessage.value = '';

        // Dynamically import users API service
        const { usersApi } = await import('@/api/users/users.api');

        // Combine first_name and last_name into full_name for API
        const fullName = `${formData.value.first_name} ${formData.value.last_name}`.trim();

        // Call backend API to update profile
        await usersApi.updateCurrentUser({
            fullName: fullName || null,
        });

        successMessage.value = loc.t('profile.updateSuccess');
        await messaging.success(loc.t('profile.updateSuccess'));

        // Update auth store with new user data (refreshes navbar)
        await auth.updateCurrentUser({ full_name: fullName });
        
        // Reload profile to reflect changes
        await loadProfile();

    } catch (error: unknown) {
        // Handle specific error cases
        if (error && typeof error === 'object' && 'response' in error) {
            const err = error as { response?: { status?: number; data?: { detail?: string } } };
            if (err.response?.status === 400) {
                // Validation error
                formError.value = err.response.data?.detail ?? loc.t('profile.updateError');
            } else {
                formError.value = loc.t('profile.updateError');
            }
        } else {
            formError.value = loc.t('profile.updateError');
        }
    } finally {
        isSubmitting.value = false;
    }
};

/**
 * Validate password form
 */
const validatePasswordForm = (): boolean => {
    passwordErrors.value = {};

    if (!passwordForm.value.currentPassword) {
        passwordErrors.value.currentPassword = loc.t('profile.errors.currentPasswordRequired');
    }

    if (!passwordForm.value.newPassword) {
        passwordErrors.value.newPassword = loc.t('profile.errors.newPasswordRequired');
    } else if (passwordForm.value.newPassword.length < 8) {
        passwordErrors.value.newPassword = loc.t('auth.password.minLength');
    }

    if (!passwordForm.value.confirmPassword) {
        passwordErrors.value.confirmPassword = loc.t('profile.errors.confirmPasswordRequired');
    } else if (passwordForm.value.confirmPassword !== passwordForm.value.newPassword) {
        passwordErrors.value.confirmPassword = loc.t('profile.errors.passwordMismatch');
    }

    return Object.keys(passwordErrors.value).length === 0;
};

/**
 * Handle password change
 */
const handlePasswordChange = async () => {
    if (!validatePasswordForm()) {
        return;
    }

    try {
        isChangingPassword.value = true;
        passwordError.value = '';

        // Get API service and create auth API
        const { createAuthApiService } = await import('@/api/auth');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authApi = createAuthApiService(apiStore as any);
        
        const response = await authApi.changePassword({
            current_password: passwordForm.value.currentPassword,
            new_password: passwordForm.value.newPassword,
        });

        if (response.data) {
            await messaging.success(response.data.message);
            closePasswordDialog();
            
            // Logout user since all sessions are invalidated
            setTimeout(() => {
                void auth.logout();
            }, 2000);
        }

    } catch (error) {
        const err = error as { response?: { status?: number; data?: { detail?: string } } };
        if (err?.response?.status === 401) {
            passwordError.value = loc.t('profile.errors.currentPasswordIncorrect');
        } else if (err?.response?.data?.detail) {
            passwordError.value = err.response.data.detail;
        } else {
            passwordError.value = loc.t('profile.passwordChangeError');
        }
    } finally {
        isChangingPassword.value = false;
    }
};

/**
 * Close password dialog and reset form
 */
const closePasswordDialog = () => {
    showPasswordDialog.value = false;
    passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    };
    passwordErrors.value = {};
    passwordError.value = '';
};

// Load profile on mount
onMounted(() => {
    void loadProfile();
});
</script>

<style scoped>
.profile-container {
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
    margin-bottom: 1.5rem;
}

/* Ensure password component takes full width */
:deep(.p-password) {
    width: 100%;
}

:deep(.p-password-input) {
    width: 100%;
}

/* Dialog styling */
:deep(.p-dialog) {
    max-width: 90vw;
}
</style>
