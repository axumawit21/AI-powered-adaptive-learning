<template>
  <div
    class="bg-linear-to-br from-orange-600 to-red-600 rounded-xl p-6 text-white shadow-lg"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold">Daily Streak</h3>
      <span class="text-4xl animate-pulse">🔥</span>
    </div>

    <div class="text-center mb-4">
      <div class="text-5xl font-bold mb-2">{{ stats.currentStreak || 0 }}</div>
      <p class="text-sm opacity-90">days in a row</p>
      <p class="text-xs opacity-75 mt-2">
        Best: {{ stats.longestStreak || 0 }} days
      </p>
    </div>

    <div class="flex gap-1 justify-center">
      <div
        v-for="day in 7"
        :key="day"
        class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
        :class="
          isActiveDay(day)
            ? 'bg-white text-orange-600 scale-110'
            : 'bg-white/20'
        "
      >
        {{ getDayLabel(day) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
});

const isActiveDay = (dayOffset) => {
  return dayOffset <= (props.stats.currentStreak || 0);
};

const getDayLabel = (day) => {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();
  return days[(today - 7 + day + 7) % 7];
};
</script>
