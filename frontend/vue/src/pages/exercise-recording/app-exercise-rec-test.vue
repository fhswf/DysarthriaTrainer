<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">🎙️ Audio Recording Test</h1>
    
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <p class="font-semibold">✅ Die Seite lädt erfolgreich!</p>
      <p class="text-sm text-gray-600 mt-2">Wenn du das siehst, funktioniert das Routing.</p>
    </div>

    <div class="space-y-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h2 class="font-semibold mb-2">📍 Aktuelle Route</h2>
        <code class="text-sm bg-gray-100 p-2 rounded block">{{ $route.fullPath }}</code>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h2 class="font-semibold mb-2">🔐 Auth Status</h2>
        <p class="text-sm">Angemeldet: <span class="font-mono">{{ isLoggedIn ? '✅ Ja' : '❌ Nein' }}</span></p>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h2 class="font-semibold mb-2">🎤 Mikrofon-Test</h2>
        <button 
          @click="testMicrophone"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Mikrofon testen
        </button>
        <p v-if="micStatus" class="mt-2 text-sm">{{ micStatus }}</p>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h2 class="font-semibold mb-2">📝 Nächste Schritte</h2>
        <ul class="list-disc list-inside text-sm space-y-1">
          <li>Stelle sicher, dass du eingeloggt bist</li>
          <li>Öffne: <code class="bg-gray-100 px-2 py-1 rounded">/exercise-recording</code> (ohne 's')</li>
          <li>Erlaube Mikrofon-Zugriff im Browser</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const isLoggedIn = ref(false);
const micStatus = ref('');

onMounted(async () => {
  const authStore = useAuthStore();
  isLoggedIn.value = await authStore.isAuthenticated();
});

const testMicrophone = async () => {
  try {
    micStatus.value = '🔄 Frage nach Berechtigung...';
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStatus.value = '✅ Mikrofon funktioniert!';
    stream.getTracks().forEach(track => track.stop());
  } catch (error: any) {
    micStatus.value = `❌ Fehler: ${error.message}`;
  }
};
</script>
