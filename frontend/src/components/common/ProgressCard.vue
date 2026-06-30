<template>
  <div
    class="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group"
  >
    <div class="flex justify-between items-start mb-3">
      <div>
        <h3
          class="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors"
        >
          {{ subject }}
        </h3>
        <p class="text-sm text-slate-400">{{ grade }}</p>
      </div>
      <div v-if="icon" class="text-2xl">{{ icon }}</div>
    </div>

    <div class="space-y-2">
      <!-- Time -->
      <div class="flex items-center gap-2 text-sm text-slate-300">
        <span class="text-cyan-400">⏱️</span>
        <span>{{ formatTime(totalMinutes) }}</span>
      </div>

      <!-- Quizzes -->
      <div class="flex items-center gap-2 text-sm text-slate-300">
        <span class="text-purple-400">📊</span>
        <span
          >Quizzes: <span class="text-white">{{ passedQuizzes }}</span
          >/{{ totalQuizzes }} passed</span
        >
      </div>

      <!-- Units -->
      <div class="flex items-center gap-2 text-sm text-slate-300">
        <span class="text-emerald-400">📈</span>
        <span
          >Units: <span class="text-white">{{ completedUnits }}</span
          >/{{ totalUnits }} completed</span
        >
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
      <div
        class="h-full bg-linear-to-r from-cyan-500 to-emerald-500"
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  subject: String,
  grade: String,
  totalMinutes: { type: Number, default: 0 },
  passedQuizzes: { type: Number, default: 0 },
  totalQuizzes: { type: Number, default: 0 },
  completedUnits: { type: Number, default: 0 },
  totalUnits: { type: Number, default: 0 },
  icon: String,
});

const progressPercent = computed(() => {
  if (props.totalUnits === 0) return 0;
  return Math.min(100, (props.completedUnits / props.totalUnits) * 100);
});

function formatTime(minutes) {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
</script>
