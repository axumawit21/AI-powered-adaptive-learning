<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4 mb-6">
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
      <div class="flex flex-col">
        <h3 class="text-2xl font-bold text-white">Select Unit</h3>
        <span class="text-sm text-slate-400"
          >From {{ subjectName || "Current Subject" }}</span
        >
      </div>
    </div>

    <!-- No Subject Selected -->
    <div v-if="!units" class="p-8 text-center glass-panel rounded-2xl">
      <p class="text-slate-400 mb-4">
        Please select a subject from the top bar first.
      </p>
    </div>

    <!-- No Units Available -->
    <div
      v-else-if="units.length === 0"
      class="p-8 text-center glass-panel rounded-2xl"
    >
      <p class="text-slate-400">No units found for this subject.</p>
    </div>

    <!-- Unit List -->
    <div
      v-else
      class="glass-panel rounded-2xl p-2 max-h-[60vh] overflow-y-auto"
    >
      <button
        v-for="unit in units"
        :key="unit.id"
        @click="$emit('select', unit)"
        class="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200"
        :class="
          isSelected(unit)
            ? 'bg-cyan-500/20 border border-cyan-500 shadow-lg shadow-cyan-500/10'
            : 'hover:bg-slate-800/80 border border-transparent'
        "
      >
        <span
          class="font-medium text-lg"
          :class="isSelected(unit) ? 'text-cyan-400' : 'text-slate-300'"
        >
          {{ unit.title || unit.name }}
        </span>
        <div
          class="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center transition-colors"
          :class="isSelected(unit) ? 'bg-cyan-500 border-cyan-500' : ''"
        >
          <svg
            v-if="isSelected(unit)"
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
    <div v-if="units && units.length > 0" class="mt-6 flex justify-end">
      <button
        @click="$emit('start-exam')"
        :disabled="!selectedUnit"
        class="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        Start Unit Exam
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// Props
const props = defineProps({
  units: {
    type: Array,
    default: null,
  },
  selectedUnit: {
    type: Object,
    default: null,
  },
  subjectName: {
    type: String,
    default: "",
  },
});

// Emits
defineEmits(["back", "select", "start-exam"]);

// Helper to check if unit is selected
const isSelected = computed(() => (unit) => {
  if (!props.selectedUnit) return false;
  return props.selectedUnit.id === unit.id;
});
</script>
