<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat"
    :style="backgroundStyle">
    <!-- App Title -->
    <div class="absolute top-8 left-0 right-0 text-center">
      <h1 class="text-5xl font-bold text-white drop-shadow-2xl">
        {{ loc.t('auth.appTitle') }}
      </h1>
    </div>

    <!-- Login Card -->
    <Card class="w-full max-w-md mx-4 shadow-2xl">
      <template #header>
        <div class="text-center pt-6">
          <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
            {{ loc.t('auth.loginPage.title') }}
          </h2>
          <p class="text-surface-600 dark:text-surface-400 mt-2">
            {{ loc.t('auth.loginPage.subtitle') }}
          </p>
        </div>
      </template>

      <template #content>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- General Error -->
          <Message v-if="errors.general" severity="error" :closable="false">
            {{ errors.general }}
          </Message>

          <!-- Email Field -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-surface-700 dark:text-surface-300">
              {{ loc.t('auth.fields.email') }}
            </label>
            <InputText id="email" v-model="formData.email" type="email" :placeholder="loc.t('auth.placeholders.email')"
              autocomplete="email" class="w-full" :class="{ 'p-invalid': errors.email }" :disabled="isSubmitting"
              @blur="validateField('email')" @focus="clearError('email')" />
            <small v-if="errors.email" class="text-red-500">
              {{ errors.email }}
            </small>
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="password" class="block text-sm font-medium text-surface-700 dark:text-surface-300">
                {{ loc.t('auth.fields.password') }}
              </label>
              <router-link to="/forgot-password" class="text-sm text-primary hover:underline" tabindex="-1">
                {{ loc.t('auth.loginPage.forgotPassword') }}
              </router-link>
            </div>
            <Password id="password" v-model="formData.password" :feedback="false" toggleMask
              :placeholder="loc.t('auth.placeholders.password')" autocomplete="current-password" class="w-full"
              :class="{ 'p-invalid': errors.password }" :disabled="isSubmitting" @blur="validateField('password')"
              @focus="clearError('password')" />
            <small v-if="errors.password" class="text-red-500">
              {{ errors.password }}
            </small>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center">
            <Checkbox inputId="rememberMe" v-model="formData.rememberMe" :binary="true" :disabled="isSubmitting" />
            <label for="rememberMe" class="ml-2 text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
              {{ loc.t('auth.rememberMe') }}
            </label>
          </div>

          <!-- Quick Test Login Buttons -->
          <div class="border-t border-surface-200 dark:border-surface-700 pt-4">
            <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">{{ loc.t('auth.loginPage.quickTestLogin') }}
            </p>
            <div class="flex gap-2">
              <Button :label="loc.t('auth.loginPage.testUser')" size="small" outlined severity="secondary"
                @click="fillTestCredentials('user')" class="flex-1" />
              <Button :label="loc.t('auth.loginPage.testTherapist')" size="small" outlined severity="secondary"
                @click="fillTestCredentials('therapist')" class="flex-1" />
              <Button :label="loc.t('auth.loginPage.testAdmin')" size="small" outlined severity="secondary"
                @click="fillTestCredentials('admin')" class="flex-1" />
            </div>
          </div>

          <!-- Submit Button -->
          <Button type="submit" :label="loc.t('auth.loginPage.signIn')" icon="pi pi-sign-in" :loading="isSubmitting"
            class="w-full" size="large" />

          <!-- Register Link -->
          <div class="text-center text-sm text-surface-600 dark:text-surface-400">
            {{ loc.t('auth.loginPage.noAccount') }}
            <router-link to="/register" class="text-primary font-medium hover:underline">
              {{ loc.t('auth.loginPage.createAccount') }}
            </router-link>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLoginForm } from './composables/useLoginForm';
import { useLocalizationStore } from '@/stores/localization';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';

const loc = useLocalizationStore();

const {
  formData,
  errors,
  isSubmitting,
  validateField,
  handleSubmit,
  clearError,
} = useLoginForm();

// Background image styling
const backgroundStyle = computed(() => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${new URL('./background_login.png', import.meta.url).href})`,
}));

/**
 * Fill form with test credentials for quick testing and submit
 * @param role - user, therapist, or admin
 */
const fillTestCredentials = async (role: 'user' | 'therapist' | 'admin') => {
  const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
  formData.value.email = `${role}@example.com`;
  formData.value.password = `${roleCapitalized}123!`;
  // Clear any existing errors
  clearError('email');
  clearError('password');
  clearError('general');
  // Submit the form
  await handleSubmit();
};
</script>
