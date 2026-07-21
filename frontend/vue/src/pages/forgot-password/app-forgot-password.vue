<template>
    <div class="forgot-password-container max-w-md w-full px-6 py-8">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ loc.t('auth.forgotPassword.title') }}
            </h1>
            <p class="text-gray-600">
                {{ loc.t('auth.forgotPassword.subtitle') }}
            </p>
        </div>

        <!-- Forgot Password Form -->
        <Card>
            <template #content>
                <!-- Success State -->
                <div v-if="requestState === 'success'" class="text-center py-6">
                    <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">
                        {{ loc.t('auth.forgotPassword.success.title') }}
                    </h2>
                    <p class="text-gray-600 mb-4">
                        {{ loc.t('auth.forgotPassword.success.message') }}
                    </p>
                    <Message severity="info" :closable="false" class="mb-6">
                        {{ loc.t('auth.forgotPassword.success.securityNote') }}
                    </Message>
                    <Button :label="loc.t('auth.forgotPassword.backToLogin')" icon="pi pi-sign-in" @click="goToLogin"
                        class="w-full" />
                </div>

                <!-- Form State -->
                <form v-else @submit.prevent="handleSubmit" class="space-y-6">
                    <!-- General Error Message -->
                    <Message v-if="formError" severity="error" :closable="false">
                        {{ formError }}
                    </Message>

                    <!-- Email Field -->
                    <div class="form-field">
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                            {{ loc.t('auth.fields.email') }}
                            <span class="text-red-500">*</span>
                        </label>
                        <InputText id="email" v-model="email" type="email"
                            :placeholder="loc.t('auth.placeholders.email')" :class="{ 'p-invalid': emailError }"
                            class="w-full" autocomplete="email" :disabled="isSubmitting" @blur="validateEmail"
                            @input="clearEmailError" />
                        <small v-if="emailError" class="p-error">{{ emailError }}</small>
                    </div>

                    <!-- Info Message -->
                    <Message severity="info" :closable="false">
                        {{ loc.t('auth.forgotPassword.securityNote') }}
                    </Message>

                    <!-- Submit Button -->
                    <Button type="submit" :label="loc.t('auth.forgotPassword.submit')" :loading="isSubmitting"
                        :disabled="isSubmitting || !email" class="w-full" severity="primary" />

                    <!-- Links -->
                    <div class="text-center pt-4 border-t border-gray-200">
                        <p class="text-sm text-gray-600 mb-2">
                            {{ loc.t('auth.forgotPassword.rememberPassword') }}
                            <router-link to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
                                {{ loc.t('auth.forgotPassword.loginLink') }}
                            </router-link>
                        </p>
                        <p class="text-sm text-gray-600">
                            {{ loc.t('auth.forgotPassword.noAccount') }}
                            <router-link to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
                                {{ loc.t('auth.forgotPassword.registerLink') }}
                            </router-link>
                        </p>
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLocalizationStore } from '@/stores/localization';
import { useApiStore } from '@/stores/api';
import { useMessagingStore } from '@/stores/messaging';
import { createAuthApiService } from '@/api/auth';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';

type RequestState = 'form' | 'success';

const router = useRouter();
const loc = useLocalizationStore();
const api = useApiStore();
const messaging = useMessagingStore();

const email = ref('');
const emailError = ref('');
const formError = ref('');
const isSubmitting = ref(false);
const requestState = ref<RequestState>('form');

/**
 * Validate email field
 */
const validateEmail = () => {
    emailError.value = '';

    if (!email.value) {
        emailError.value = loc.t('auth.forgotPassword.errors.emailRequired');
        return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        emailError.value = loc.t('auth.forgotPassword.errors.emailInvalid');
        return false;
    }

    return true;
};

/**
 * Clear email error on input
 */
const clearEmailError = () => {
    emailError.value = '';
    formError.value = '';
};

/**
 * Handle form submission
 */
const handleSubmit = async () => {
    // Validate email
    if (!validateEmail()) {
        return;
    }

    try {
        isSubmitting.value = true;
        formError.value = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authApi = createAuthApiService(api as any);

        // Call password reset request API
        await authApi.requestPasswordReset(email.value);

        // Success - show generic message (security: don't reveal if email exists)
        requestState.value = 'success';
        await messaging.success(loc.t('auth.forgotPassword.success.toast'));

    } catch (error: unknown) {
        // Handle errors - but still show generic success message for security
        // (don't reveal if email exists in system)
        if (error && typeof error === 'object' && 'response' in error) {
            const apiError = error as { response?: { status: number; data?: { detail?: string } } };

            // For security, we show success even on errors (except network errors)
            if (apiError.response?.status === 400 || apiError.response?.status === 404) {
                // Email doesn't exist or invalid - still show success
                requestState.value = 'success';
            } else {
                // Network or server error - show actual error
                formError.value = loc.t('auth.forgotPassword.errors.network');
            }
        } else {
            formError.value = loc.t('auth.forgotPassword.errors.network');
        }
    } finally {
        isSubmitting.value = false;
    }
};

/**
 * Navigate to login page
 */
const goToLogin = () => {
    void router.push('/login');
};
</script>

<style scoped>
.forgot-password-container {
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

/* Success icon animation */
.pi-check-circle {
    animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
    from {
        transform: scale(0);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
