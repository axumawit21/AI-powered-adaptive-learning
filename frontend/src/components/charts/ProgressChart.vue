<template>
  <div class="w-full max-w-4xl border" :style="{ borderColor: 'transparent' }">
    <div class="flex justify-between items-center mb-6">
      <h2
        class="text-xl font-bold flex items-center gap-2"
        :style="{ color: 'var(--text-primary)' }"
      >
        <span>📊</span> Study Progress
      </h2>
      <div
        class="flex rounded-lg p-1"
        :style="{ background: 'var(--bg-surface-solid)' }"
      >
        <button
          v-for="range in ['weekly', 'monthly']"
          :key="range"
          @click="$emit('update:range', range)"
          class="px-3 py-1 text-sm font-medium rounded-md transition-all capitalize"
          :class="
            selectedRange === range
              ? 'bg-cyan-500 text-white shadow-md'
              : 'hover:text-cyan-500'
          "
          :style="
            selectedRange !== range ? { color: 'var(--text-secondary)' } : {}
          "
        >
          {{ range }}
        </button>
      </div>
    </div>
    <div class="relative h-64 w-full">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from "vue";
import Chart from "chart.js/auto";
import { useTheme } from "../../composables/useTheme";

const props = defineProps({
  data: { type: Array, default: () => [] },
  selectedRange: { type: String, default: "weekly" }, // 'weekly' | 'monthly'
});

const emit = defineEmits(["update:range"]);
const { isDark } = useTheme();

const chartCanvas = ref(null);
let chartInstance = null;

const renderChart = () => {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = chartCanvas.value.getContext("2d");
  const labels = props.data.map((d) => d.date); // Maybe format short date?
  const values = props.data.map((d) => d.minutes);

  // Theme colors
  const textColor = isDark.value ? "#94a3b8" : "#64748b";
  const gridColor = isDark.value
    ? "rgba(148, 163, 184, 0.1)"
    : "rgba(148, 163, 184, 0.2)";
  const tooltipBg = isDark.value
    ? "rgba(15, 23, 42, 0.9)"
    : "rgba(255, 255, 255, 0.95)";
  const tooltipText = isDark.value ? "#e2e8f0" : "#1e293b";
  const tooltipTitle = isDark.value ? "#22d3ee" : "#0891b2";
  const tooltipBorder = isDark.value
    ? "rgba(255,255,255,0.1)"
    : "rgba(0,0,0,0.1)";

  // Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(6, 182, 212, 0.5)"); // Cyan 500
  gradient.addColorStop(1, "rgba(6, 182, 212, 0.0)");

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Minutes Studied",
          data: values,
          backgroundColor: gradient,
          borderColor: "#06b6d4", // Cyan 500
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipTitle,
          bodyColor: tooltipText,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor },
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor, maxRotation: 45, minRotation: 0 },
        },
      },
    },
  });
};

watch(
  [() => props.data, isDark],
  () => {
    nextTick(renderChart);
  },
  { deep: true }
);

onMounted(renderChart);
</script>
