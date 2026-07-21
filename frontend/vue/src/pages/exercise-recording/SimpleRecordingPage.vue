<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Audio Recording - Simple Test</h1>
    
    <div class="bg-blue-100 p-4 rounded mb-4">
      <p><strong>Route:</strong> {{ $route.path }}</p>
      <p><strong>Exercise ID:</strong> {{ exerciseId || 'none' }}</p>
    </div>

    <!-- Test 1: Basic HTML -->
    <div class="bg-green-100 p-4 rounded mb-4">
      <h2 class="font-bold">✅ Basic HTML rendering works</h2>
    </div>

    <!-- Test 2: Try importing one component at a time -->
    <div class="bg-yellow-100 p-4 rounded mb-4">
      <h2 class="font-bold mb-2">Testing Components:</h2>
      
      <div class="mb-2">
        <p>RecordingControls:</p>
        <Suspense>
          <RecordingControls
            :is-recording="false"
            :is-paused="false"
            :duration="0"
            @start="() => {}"
            @stop="() => {}"
            @pause="() => {}"
            @resume="() => {}"
          />
          <template #fallback>
            <p>Loading RecordingControls...</p>
          </template>
        </Suspense>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import RecordingControls from '@/components/RecordingControls.vue';

const route = useRoute();
const exerciseId = computed(() => route.params.exerciseId as string | undefined);
</script>
