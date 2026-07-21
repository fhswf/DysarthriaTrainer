<template>
    <div class="verify-email-container max-w-md w-full px-6 py-8">
        <Card>
            <template #content>
                <!-- Loading State -->
                <div v-if="verificationState === 'loading'" class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary-600 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        {{ loc.t('auth.verifyEmail.verifying') }}
                    </h2>
                    <p class="text-gray-600">
                        {{ loc.t('auth.verifyEmail.pleaseWait') }}
                    </p>
                </div>

                <!-- Success State -->
                <div v-else-if="verificationState === 'success'" class="text-center py-8">
                    <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        {{ loc.t('auth.verifyEmail.success.title') }}
                    </h2>
                    <p class="text-gray-600 mb-6">
                        {{ loc.t('auth.verifyEmail.success.message') }}
                    </p>
                    <p class="text-sm text-gray-500 mb-4">
                        {{ loc.t('auth.verifyEmail.redirecting', { seconds: countdown }) }}
                    </p>
                    <Button :label="loc.t('auth.verifyEmail.goToLogin')" icon="pi pi-sign-in" @click="redirectToLogin"
                        class="w-full" />
                </div>

                <!-- Error State -->
                <div v-else-if="verificationState === 'error'" class="text-center py-8">
                    <i class="pi pi-times-circle text-6xl text-red-500 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        {{ loc.t('auth.verifyEmail.error.title') }}
                    </h2>
                    <Message severity="error" :closable="false" class="mb-4">
                        {{ errorMessage }}
                    </Message>
                    <p class="text-sm text-gray-600 mb-6">
                        {{ loc.t('auth.verifyEmail.error.message') }}
                    </p>
                    <div class="flex flex-col gap-3">
                        <Button :label="loc.t('auth.verifyEmail.goToLogin')" icon="pi pi-sign-in"
                            @click="redirectToLogin" class="w-full" />
                        <Button :label="loc.t('auth.verifyEmail.requestNew')" icon="pi pi-envelope" severity="secondary"
                            outlined @click="redirectToRegister" class="w-full" />
                    </div>
                </div>

                <!-- Invalid Token State (No Token in URL) -->
                <div v-else-if="verificationState === 'invalid'" class="text-center py-8">
                    <i class="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        {{ loc.t('auth.verifyEmail.invalid.title') }}
                    </h2>
                    <p class="text-gray-600 mb-6">
                        {{ loc.t('auth.verifyEmail.invalid.message') }}
                    </p>
                    <Button :label="loc.t('auth.verifyEmail.goToLogin')" icon="pi pi-sign-in" @click="redirectToLogin"
                        class="w-full" />
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
import Message from 'primevue/message';

type VerificationState = 'loading' | 'success' | 'error' | 'invalid';

const route = useRoute();
const router = useRouter();
const loc = useLocalizationStore();
const api = useApiStore();
const messaging = useMessagingStore();

const verificationState = ref<VerificationState>('loading');
const errorMessage = ref('');
const countdown = ref(5);
let countdownInterval: NodeJS.Timeout | null = null;

/**
 * Verify email with token from URL
 */
const verifyEmail = async (token: string) => {
    try {
        verificationState.value = 'loading';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authApi = createAuthApiService(api as any);
        await authApi.verifyEmail(token);

        // Success
        verificationState.value = 'success';
        await messaging.success(loc.t('auth.verifyEmail.success.toast'));

        // Start countdown for auto-redirect
        startCountdown();

    } catch (error: unknown) {
        verificationState.value = 'error';

        // Handle specific error cases
        if (error && typeof error === 'object' && 'response' in error) {
            const apiError = error as { response?: { status: number; data?: { detail?: string } } };
            const detail = apiError.response?.data?.detail ?? '';
            if (apiError.response?.status === 400) {
                if (detail.toLowerCase().includes('invalid')) {
                    errorMessage.value = loc.t('auth.verifyEmail.error.invalidToken');
                } else if (detail.toLowerCase().includes('expired')) {
                    errorMessage.value = loc.t('auth.verifyEmail.error.expiredToken');
                } else if (detail.toLowerCase().includes('already verified')) {
                    errorMessage.value = loc.t('auth.verifyEmail.error.alreadyVerified');
                    // Already verified is success-ish, redirect to login
                    setTimeout(() => redirectToLogin(), 3000);
                } else {
                    errorMessage.value = detail;
                }
            } else if (apiError.response?.status === 404) {
                errorMessage.value = loc.t('auth.verifyEmail.error.notFound');
            } else {
                errorMessage.value = loc.t('auth.verifyEmail.error.network');
            }
        } else {
            errorMessage.value = loc.t('auth.verifyEmail.error.network');
        }
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
 * Redirect to register page
 */
const redirectToRegister = () => {
    void router.push('/register');
};

/**
 * Extract token from URL and verify on mount
 */
onMounted(() => {
    const token = route.query.token as string;

    if (!token) {
        verificationState.value = 'invalid';
        return;
    }

    // Auto-verify on page load
    void verifyEmail(token);
});
</script>

<style scoped>
.verify-email-container {
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

/* Icon animations */
.pi-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
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
