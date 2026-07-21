<template>
    <div class="flex flex-col h-screen">
        <AppNavbar />
        <main class="flex-1 overflow-auto">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/navbar/AppNavbar.vue';
</script>
