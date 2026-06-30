<template>
  <div
    class="glass-panel p-6 rounded-2xl"
    :style="{ border: '1px solid var(--border-color)' }"
  >
    <h3
      class="text-lg font-bold mb-4 flex items-center gap-2"
      :style="{ color: 'var(--text-primary)' }"
    >
      <span>clock</span> Recent Activity
    </h3>
    <div v-if="history.length > 0" class="space-y-3">
      <div
        v-for="h in history.slice(0, 3)"
        :key="h._id"
        class="flex items-center justify-between p-3 rounded-lg transition-colors border"
        :style="{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
        }"
      >
        <div>
          <div
            class="font-medium flex items-center gap-2"
            :style="{ color: 'var(--text-primary)' }"
          >
            <span>{{ h.subjectName || "Subject" }}</span>
            <span
              class="text-xs font-normal opacity-60"
              :style="{ color: 'var(--text-secondary)' }"
              >|</span
            >
            <span
              class="text-xs font-normal"
              :style="{ color: 'var(--text-secondary)' }"
            >
              {{ h.type === "subject" ? "Subject Mastery" : "Unit Checkup" }}
            </span>
          </div>
          <div class="text-xs mt-1" :style="{ color: 'var(--text-secondary)' }">
            {{ formatDate(h.completedAt || h.createdAt) }}
          </div>
        </div>
        <div
          class="px-3 py-1 rounded-full text-sm font-bold"
          :class="getScoreColorRaw(h.score, h.totalQuestions).bg"
        >
          <span :class="getScoreColorRaw(h.score, h.totalQuestions).text">
            {{ Math.round((h.score / h.totalQuestions) * 100) }}%
          </span>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-slate-500 py-4">
      No recent exams found.
    </div>
  </div>
</template>

<script setup>
defineProps({
  history: {
    type: Array,
    default: () => [],
  },
});

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
}

function getScoreColorRaw(score, total) {
  const p = score / total;
  if (p >= 0.9) return { bg: "bg-emerald-500/20", text: "text-emerald-400" };
  if (p >= 0.7) return { bg: "bg-cyan-500/20", text: "text-cyan-400" };
  return { bg: "bg-orange-500/20", text: "text-orange-400" };
}
</script>
