<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-2xl border flex items-center gap-3 transform transition-all',
          toast.type === 'success'
            ? 'bg-slate-900/90 border-emerald-500/50 text-emerald-400'
            : '',
          toast.type === 'error'
            ? 'bg-slate-900/90 border-red-500/50 text-red-400'
            : '',
          toast.type === 'info'
            ? 'bg-slate-900/90 border-cyan-500/50 text-cyan-400'
            : '',
          toast.type === 'warning'
            ? 'bg-slate-900/90 border-amber-500/50 text-amber-400'
            : '',
        ]"
      >
        <!-- Icon -->
        <span class="text-xl">
          {{ toast.type === "success" ? "✅" : "" }}
          {{ toast.type === "error" ? "❌" : "" }}
          {{ toast.type === "info" ? "ℹ️" : "" }}
          {{ toast.type === "warning" ? "⚠️" : "" }}
        </span>

        <p class="text-sm font-medium text-white">{{ toast.message }}</p>

        <!-- Close -->
        <button
          @click="removeToast(toast.id)"
          class="ml-auto text-slate-500 hover:text-white transition-colors border-none p-0"
        >
          ✕
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from "../../composables/useToast";
const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
