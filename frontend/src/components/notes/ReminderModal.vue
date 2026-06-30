<template>
  <div v-if="show" class="fixed bottom-6 right-6 z-[100] animate-slide-up">
    <div
      class="bg-gray-900 border-l-4 border-cyan-500 text-white rounded-lg p-6 w-[400px] shadow-2xl shadow-black/50 flex flex-col gap-4"
    >
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-cyan-500/20 rounded-full animate-pulse">
            <span class="text-2xl">⏰</span>
          </div>
          <div>
            <h3 class="font-bold text-lg text-cyan-400">Reminder</h3>
            <p
              v-if="notification?.title"
              class="text-sm text-gray-300 font-medium"
            >
              {{ notification.title }}
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div
        class="bg-gray-800/50 rounded p-3 border border-gray-700 max-h-[150px] overflow-y-auto custom-scrollbar"
      >
        <p class="text-gray-300 text-sm whitespace-pre-wrap">
          {{ notification?.content }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 justify-end mt-1">
        <button
          @click="$emit('snooze', 10)"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm font-semibold transition-colors"
        >
          Snooze 10m
        </button>
        <button
          @click="$emit('turnOff')"
          class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold shadow-lg shadow-red-900/30 transition-transform active:scale-95"
        >
          Turn Off
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  notification: Object,
});

defineEmits(["turnOff", "snooze"]);
</script>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
