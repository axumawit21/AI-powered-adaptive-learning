<template>
  <div v-if="show" class="fixed bottom-4 right-4 z-50">
    <!-- Floating Button -->
    <button
      v-if="!showEditor"
      @click="showEditor = true"
      class="w-10 h-10 md:w-14 md:h-14 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
      title="Quick Note"
    >
      <span class="text-lg md:text-2xl">📝</span>
    </button>

    <!-- Quick Editor -->
    <div
      v-else
      class="bg-slate-800 border border-slate-700 rounded-2xl p-4 w-72 md:w-80 shadow-2xl animate-scale-in"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-white font-bold">✨ Quick Note</h3>
        <button
          @click="close"
          class="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <div class="space-y-3">
        <input
          v-model="title"
          type="text"
          placeholder="Title..."
          maxlength="200"
          class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
        />
        <textarea
          v-model="content"
          rows="4"
          placeholder="What's on your mind?"
          maxlength="5000"
          class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-sm"
        ></textarea>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            @click="close"
            class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            @click="save"
            :disabled="!canSave"
            class="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { notesService } from "../../services/notes";
import { useToast } from "../../composables/useToast";

const props = defineProps({
  show: { type: Boolean, default: true },
});

const emit = defineEmits(["saved"]);

const showEditor = ref(false);
const title = ref("");
const content = ref("");
const toast = useToast();

const canSave = computed(() => {
  return title.value.trim() && content.value.trim();
});

async function save() {
  if (!canSave.value) return;

  try {
    await notesService.createNote({
      title: title.value,
      content: content.value,
    });

    emit("saved");
    close();
  } catch (error) {
    console.error("Failed to save quick note:", error);
    toast.error("Failed to save note. Please try again.");
  }
}

function close() {
  showEditor.value = false;
  title.value = "";
  content.value = "";
}
</script>

<style scoped>
@keyframes scale-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
</style>
