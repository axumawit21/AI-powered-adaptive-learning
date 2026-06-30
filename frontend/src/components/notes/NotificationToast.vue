<template>
  <div
    v-if="show"
    class="fixed bottom-4 right-4 z-50 bg-slate-800 border border-cyan-500 rounded-xl p-4 w-96 shadow-2xl shadow-cyan-500/20 animate-slide-in"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🔔</span>
        <div>
          <h3 class="text-white font-bold">{{ notification.title }}</h3>
          <p v-if="notification.subject" class="text-xs text-slate-400">
            {{ notification.subject }}
          </p>
        </div>
      </div>
      <button
        @click="dismiss"
        class="text-slate-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>

    <!-- Content -->
    <p class="text-slate-300 text-sm mb-4 line-clamp-3">
      {{ notification.content }}
    </p>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        @click="snooze(10)"
        class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
      >
        ⏰ 10 min
      </button>
      <button
        @click="snooze(60)"
        class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
      >
        ⏰ 1 hour
      </button>
      <button
        @click="viewNote"
        class="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors"
      >
        View
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { notesService } from "../../services/notes";

const props = defineProps({
  notification: Object,
  show: Boolean,
});

const emit = defineEmits(["close", "snooze"]);
const router = useRouter();

async function snooze(minutes) {
  try {
    await notesService.snoozeReminder(props.notification.noteId, minutes);
    emit("snooze", minutes);
    emit("close");
  } catch (error) {
    console.error("Failed to snooze reminder:", error);
  }
}

function viewNote() {
  router.push("/notes");
  emit("close");
}

function dismiss() {
  emit("close");
}

// Auto-dismiss after 30 seconds
let timeout;
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      timeout = setTimeout(() => {
        emit("close");
      }, 30000);
    } else {
      if (timeout) clearTimeout(timeout);
    }
  }
);
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes slide-in {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
