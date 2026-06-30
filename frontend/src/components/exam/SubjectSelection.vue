<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-3 mb-8">
      <button
        @click="$emit('back')"
        class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5"></path>
          <path d="M12 19l-7-7 7-7"></path>
        </svg>
      </button>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center"
        >
          <span class="text-2xl">📚</span>
        </div>
        <h3 class="text-2xl font-bold text-white">Choose a Subject</h3>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!subjects || subjects.length === 0"
      class="glass-panel rounded-2xl p-12 text-center"
    >
      <div class="text-6xl mb-4">📚</div>
      <h4 class="text-xl font-bold text-white mb-2">No Subjects Available</h4>
      <p class="text-slate-400">
        Please add subjects to your curriculum first.
      </p>
    </div>

    <!-- Subject List -->
    <div
      v-else
      class="glass-panel rounded-2xl p-4 max-h-[60vh] overflow-y-auto space-y-2"
    >
      <button
        v-for="(subj, index) in subjects"
        :key="subj.id || index"
        @click="$emit('select', subj)"
        :class="[
          'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left border-l-4',
          isSelected(subj)
            ? 'bg-cyan-500/10 border-cyan-500'
            : 'bg-transparent border-transparent hover:bg-slate-800/60 hover:border-slate-600',
        ]"
      >
        <div class="text-3xl">📘</div>
        <div class="flex-1">
          <h4
            class="text-lg font-bold mb-1 transition-colors"
            :class="isSelected(subj) ? 'text-cyan-400' : 'text-white'"
          >
            {{ subj.name }}
          </h4>
          <p class="text-xs text-slate-400">
            {{ subj.units?.length || 0 }} units • Comprehensive exam
          </p>
        </div>
        <div
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
          :class="
            isSelected(subj)
              ? 'border-cyan-500 bg-cyan-500'
              : 'border-slate-600 bg-transparent'
          "
        >
          <svg
            v-if="isSelected(subj)"
            xmlns="http://www.w3.org/2000/svg"
            class="w-3.5 h-3.5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </button>
    </div>

    <!-- Action Button -->
    <div class="mt-6 flex justify-end">
      <button
        @click="$emit('start-exam')"
        :disabled="!selectedSubject"
        class="px-6 py-3 bg-linear-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        Start Exam
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// Props
const props = defineProps({
  subjects: {
    type: Array,
    default: () => [],
  },
  selectedSubject: {
    type: Object,
    default: null,
  },
});

// Emits
defineEmits(["back", "select", "start-exam"]);

// Helper to check if subject is selected
const isSelected = computed(() => (subj) => {
  if (!props.selectedSubject) return false;
  return props.selectedSubject.id === subj.id;
});
</script>
