<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    @click.self="$emit('cancel')"
  >
    <div
      class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-[450px] max-w-full shadow-2xl scale-in-center"
    >
      <div class="flex items-center gap-4 mb-4">
        <div
          class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-2xl"
        >
          ⚠️
        </div>
        <div>
          <h3 class="text-xl font-bold text-white">{{ title }}</h3>
          <p class="text-slate-400 text-sm mt-1">
            This action cannot be undone.
          </p>
        </div>
      </div>

      <p class="text-slate-300 mb-8 leading-relaxed">
        {{ message }}
      </p>

      <div class="flex gap-3 justify-end mt-4">
        <button
          @click="$emit('cancel')"
          class="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all active:scale-95"
        >
          {{ cancelText }}
        </button>
        <button
          @click="$emit('confirm')"
          class="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 active:scale-95"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: {
    type: String,
    default: "Confirm Action",
  },
  message: {
    type: String,
    default: "Are you sure you want to proceed?",
  },
  confirmText: {
    type: String,
    default: "Delete",
  },
  cancelText: {
    type: String,
    default: "Cancel",
  },
});

defineEmits(["confirm", "cancel"]);
</script>

<style scoped>
.scale-in-center {
  animation: scale-in-center 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes scale-in-center {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
