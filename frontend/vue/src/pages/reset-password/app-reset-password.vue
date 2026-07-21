<template>
    <div class="reset-password-container max-w-md w-full px-6 py-8">
        <Card>
            <template #content>
                <!-- Success State -->
                <div v-if="resetState === 'success'" class="text-center py-6">
                    <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        {{ loc.t('auth.resetPassword.success.title') }}
                    </h2>
                    <p class="text-gray-600 mb-4">
                        {{ loc.t('auth.resetPassword.success.message') }}
                    </p>
                    <p class="text-sm text-gray-500 mb-6">
                        {{ loc.t('auth.resetPassword.redirecting', { seconds: countdown }) }}
                    </p>
                    <Button :label="loc.t('auth.resetPassword.goToLogin')" icon="pi pi-sign-in" @click="redirectToLogin"
                        class="w-full" />
                </div>

                <!-- Invalid Token State -->
                <div v-else-if="resetState === 'invalid'" class="text-center py-6">
                    <i class="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        {{ loc.t('auth.resetPassword.invalid.title') }}
                    </h2>
                    <p class="text-gray-600 mb-6">
                        {{ loc.t('auth.resetPassword.invalid.message') }}
                    </p>
                    <div class="flex flex-col gap-3">
                        <Button :label="loc.t('auth.resetPassword.goToLogin')" icon="pi pi-sign-in"
                            @click="redirectToLogin" class="w-full" />
                        <Button :label="loc.t('auth.resetPassword.requestNew')" icon="pi pi-envelope"
                            severity="secondary" outlined @click="redirectToForgotPassword" class="w-full" />
                    </div>
                </div>

                <!-- Form State -->
                <div v-else>
                    <!-- Header -->
                    <div class="text-center mb-6">
                        <h1 class="text-2xl font-bold text-gray-900 mb-2">
                            {{ loc.t('auth.resetPassword.title') }}
                        </h1>
                        <p class="text-gray-600">
                            {{ loc.t('auth.resetPassword.subtitle') }}
                        </p>
                    </div>

                    <form @submit.prevent="handleSubmit" class="space-y-6">
                        <!-- General Error Message -->
                        <Message v-if="formError" severity="error" :closable="false">
                            {{ formError }}
                        </Message>

                        <!-- New Password Field -->
                        <div class="form-field">
                            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                                {{ loc.t('auth.resetPassword.newPassword') }}
                                <span class="text-red-500">*</span>
                            </label>
                            <Password id="password" v-model="newPassword"
                                :placeholder="loc.t('auth.placeholders.password')"
                                :class="{ 'p-invalid': passwordError }" class="w-full" toggle-mask feedback
                                :strong-label="loc.t('auth.password.strong')"
                                :medium-label="loc.t('auth.password.medium')" :weak-label="loc.t('auth.password.weak')"
                                autocomplete="new-password" :disabled="isSubmitting" @blur="validatePassword"
                                @input="clearPasswordError">
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
                            <small v-if="passwordError" class="p-error">{{ passwordError }}</small>
                        </div>

                        <!-- Confirm Password Field -->
                        <div class="form-field">
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                                {{ loc.t('auth.fields.confirmPassword') }}
                                <span class="text-red-500">*</span>
                            </label>
                            <Password id="confirmPassword" v-model="confirmPassword"
                                :placeholder="loc.t('auth.placeholders.confirmPassword')"
                                :class="{ 'p-invalid': confirmError }" class="w-full" toggle-mask :feedback="false"
                                autocomplete="new-password" :disabled="isSubmitting" @blur="validateConfirmPassword"
                                @input="clearConfirmError" />
                            <small v-if="confirmError" class="p-error">{{ confirmError }}</small>
                        </div>

                        <!-- Info Message -->
                        <Message severity="info" :closable="false">
                            {{ loc.t('auth.resetPassword.sessionNote') }}
                        </Message>

                        <!-- Submit Button -->
                        <Button type="submit" :label="loc.t('auth.resetPassword.submit')" :loading="isSubmitting"
                            :disabled="isSubmitting || !newPassword || !confirmPassword" class="w-full"
                            severity="primary" />
                    </form>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLocalizationStore } from '@/stores/localization';
import { useApiStore } from '@/stores/api';
import { useMessagingStore } from '@/stores/messaging';
import { createAuthApiService } from '@/api/auth';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Password from 'primevue/password';
import Message from 'primevue/message';
import Divider from 'primevue/divider';

type ResetState = 'form' | 'success' | 'invalid';

const route = useRoute();
const router = useRouter();
const loc = useLocalizationStore();
const api = useApiStore();
const messaging = useMessagingStore();

const token = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const confirmError = ref('');
const formError = ref('');
const isSubmitting = ref(false);
const resetState = ref<ResetState>('form');
const countdown = ref(5);
let countdownInterval: NodeJS.Timeout | null = null;

// Password validation patterns
const passwordPatterns = {
    minLength: /.{8,}/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*(),.?":{}|<>]/,
};

/**
 * Validate password field
 */
const validatePassword = () => {
    passwordError.value = '';

    if (!newPassword.value) {
        passwordError.value = loc.t('auth.resetPassword.errors.passwordRequired');
        return false;
    }

    if (!passwordPatterns.minLength.test(newPassword.value)) {
        passwordError.value = loc.t('auth.password.minLength');
        return false;
    }

    if (!passwordPatterns.uppercase.test(newPassword.value)) {
        passwordError.value = loc.t('auth.password.uppercase');
        return false;
    }

    if (!passwordPatterns.lowercase.test(newPassword.value)) {
        passwordError.value = loc.t('auth.password.lowercase');
        return false;
    }

    if (!passwordPatterns.number.test(newPassword.value)) {
        passwordError.value = loc.t('auth.password.number');
        return false;
    }

    if (!passwordPatterns.special.test(newPassword.value)) {
        passwordError.value = loc.t('auth.password.special');
        return false;
    }

    return true;
};

/**
 * Validate confirm password field
 */
const validateConfirmPassword = () => {
    confirmError.value = '';

    if (!confirmPassword.value) {
        confirmError.value = loc.t('auth.resetPassword.errors.confirmRequired');
        return false;
    }

    if (confirmPassword.value !== newPassword.value) {
        confirmError.value = loc.t('auth.resetPassword.errors.passwordMismatch');
        return false;
    }

    return true;
};

/**
 * Clear password error
 */
const clearPasswordError = () => {
    passwordError.value = '';
    formError.value = '';
};

/**
 * Clear confirm password error
 */
const clearConfirmError = () => {
    confirmError.value = '';
    formError.value = '';
};

/**
 * Handle form submission
 */
const handleSubmit = async () => {
    // Validate both fields
    const passwordValid = validatePassword();
    const confirmValid = validateConfirmPassword();

    if (!passwordValid || !confirmValid) {
        return;
    }

    try {
        isSubmitting.value = true;
        formError.value = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authApi = createAuthApiService(api as any);

        // Call password reset confirm API
        await authApi.confirmPasswordReset({
            token: token.value,
            new_password: newPassword.value,
        });

        // Success
        resetState.value = 'success';
        await messaging.success(loc.t('auth.resetPassword.success.toast'));

        // Start countdown for auto-redirect
        startCountdown();

    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
            const apiError = error as { response?: { status: number; data?: { detail?: string } } };
            const detail = apiError.response?.data?.detail ?? '';

            if (apiError.response?.status === 400) {
                if (detail.toLowerCase().includes('invalid')) {
                    formError.value = loc.t('auth.resetPassword.errors.invalidToken');
                    resetState.value = 'invalid';
                } else if (detail.toLowerCase().includes('expired')) {
                    formError.value = loc.t('auth.resetPassword.errors.expiredToken');
                    resetState.value = 'invalid';
                } else if (detail.toLowerCase().includes('weak')) {
                    formError.value = loc.t('auth.resetPassword.errors.weakPassword');
                } else {
                    formError.value = detail;
                }
            } else if (apiError.response?.status === 404) {
                formError.value = loc.t('auth.resetPassword.errors.notFound');
                resetState.value = 'invalid';
            } else {
                formError.value = loc.t('auth.resetPassword.errors.network');
            }
        } else {
            formError.value = loc.t('auth.resetPassword.errors.network');
        }
    } finally {
        isSubmitting.value = false;
    }
};

/**
 * Start countdown timer for auto-redirect
 */
const startCountdown = () => {
    countdown.value = 5;
    countdownInterval = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            if (countdownInterval) clearInterval(countdownInterval);
            redirectToLogin();
        }
    }, 1000);
};

/**
 * Redirect to login page
 */
const redirectToLogin = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    void router.push('/login');
};

/**
 * Redirect to forgot password page
 */
const redirectToForgotPassword = () => {
    void router.push('/forgot-password');
};

/**
 * Initialize component with token from URL
 */
onMounted(() => {
    const urlToken = route.query.token as string;

    if (!urlToken) {
        resetState.value = 'invalid';
        return;
    }

    token.value = urlToken;
});
</script>

<style scoped>
.reset-password-container {
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

/* Success/warning icon animations */
.pi-check-circle,
.pi-exclamation-triangle {
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
