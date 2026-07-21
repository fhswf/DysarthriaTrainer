<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4">Ultra Simple Test</h1>
    
    <div class="mb-4 p-4 bg-blue-100 rounded">
      <p>✅ Vue component is rendering!</p>
      <p>✅ Route: {{ $route.path }}</p>
      <p>✅ Current time: {{ currentTime }}</p>
    </div>

    <button 
      @click="testClick"
      class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
      Click me to test reactivity
    </button>

    <p v-if="clicked" class="mt-4 text-xl">✅ Button was clicked {{ clickCount }} times!</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const currentTime = new Date().toLocaleTimeString();
const clicked = ref(false);
const clickCount = ref(0);

const testClick = () => {
  clicked.value = true;
  clickCount.value++;
  console.log('Button clicked!', clickCount.value);
};

console.log('✅ UltraSimplePage component loaded');
</script>
