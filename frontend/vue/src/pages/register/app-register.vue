<template>
    <div class="register-container max-w-md w-full px-6 py-8">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ loc.t('auth.register.title') }}
            </h1>
            <p class="text-gray-600">
                {{ loc.t('auth.register.subtitle') }}
            </p>
        </div>

        <!-- Registration Form -->
        <Card>
            <template #content>
                <form @submit.prevent="handleSubmit" class="space-y-6">
                    <!-- Email Field -->
                    <div class="form-field">
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                            {{ loc.t('auth.fields.email') }}
                            <span class="text-red-500">*</span>
                        </label>
                        <InputText id="email" v-model="formData.email" type="email"
                            :placeholder="loc.t('auth.placeholders.email')" :class="{ 'p-invalid': errors.email }"
                            class="w-full" autocomplete="email" @blur="validateField('email')"
                            @input="clearError('email')" />
                        <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
                    </div>

                    <!-- Username Field -->
                    <div class="form-field">
                        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                            {{ loc.t('auth.fields.username') }}
                            <span class="text-red-500">*</span>
                        </label>
                        <InputText id="username" v-model="formData.username" type="text"
                            :placeholder="loc.t('auth.placeholders.username')" :class="{ 'p-invalid': errors.username }"
                            class="w-full" autocomplete="username" @blur="validateField('username')"
                            @input="clearError('username')" />
                        <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
                    </div>

                    <!-- Full Name Field (Optional) -->
                    <div class="form-field">
                        <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
                            {{ loc.t('auth.fields.fullName') }}
                        </label>
                        <InputText id="full_name" v-model="formData.full_name" type="text"
                            :placeholder="loc.t('auth.placeholders.fullName')"
                            :class="{ 'p-invalid': errors.full_name }" class="w-full" autocomplete="name"
                            @blur="validateField('full_name')" @input="clearError('full_name')" />
                        <small v-if="errors.full_name" class="p-error">{{ errors.full_name }}</small>
                    </div>

                    <!-- Password Field -->
                    <div class="form-field">
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                            {{ loc.t('auth.fields.password') }}
                            <span class="text-red-500">*</span>
                        </label>
                        <Password id="password" v-model="formData.password"
                            :placeholder="loc.t('auth.placeholders.password')" :class="{ 'p-invalid': errors.password }"
                            class="w-full" toggle-mask feedback :strong-label="loc.t('auth.password.strong')"
                            :medium-label="loc.t('auth.password.medium')" :weak-label="loc.t('auth.password.weak')"
                            autocomplete="new-password" @blur="validateField('password')"
                            @input="clearError('password')">
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
                        <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
                    </div>

                    <!-- Confirm Password Field -->
                    <div class="form-field">
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                            {{ loc.t('auth.fields.confirmPassword') }}
                            <span class="text-red-500">*</span>
                        </label>
                        <Password id="confirmPassword" v-model="formData.confirmPassword"
                            :placeholder="loc.t('auth.placeholders.confirmPassword')"
                            :class="{ 'p-invalid': errors.confirmPassword }" class="w-full" toggle-mask
                            :feedback="false" autocomplete="new-password" @blur="validateField('confirmPassword')"
                            @input="clearError('confirmPassword')" />
                        <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
                    </div>

                    <!-- General Error Message -->
                    <Message v-if="errors.general" severity="error" :closable="false">
                        {{ errors.general }}
                    </Message>

                    <!-- Submit Button -->
                    <Button type="submit" :label="loc.t('auth.register.submit')" :loading="isSubmitting"
                        :disabled="isSubmitting" class="w-full" severity="primary" />
                </form>

                <!-- Login Link -->
                <div class="text-center mt-6 pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                        {{ loc.t('auth.register.haveAccount') }}
                        <router-link to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
                            {{ loc.t('auth.register.loginLink') }}
                        </router-link>
                    </p>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization';
import { useRegisterForm } from './composables/useRegisterForm';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Divider from 'primevue/divider';

const loc = useLocalizationStore();
const { formData, errors, isSubmitting, validateField, handleSubmit, clearError } = useRegisterForm();
</script>

<style scoped>
.register-container {
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
</style>
