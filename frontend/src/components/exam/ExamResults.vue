<template>
  <div
    class="h-full flex flex-col items-center justify-center p-4 animate-fade-in"
  >
    <div
      class="glass-panel p-10 rounded-3xl max-w-2xl w-full text-center relative border border-white/10"
    >
      <!-- Confetti/Glow FX -->
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-linear-to-r from-cyan-500/20 to-violet-500/20 rounded-full blur-[100px] pointer-events-none"
      ></div>

      <div class="relative z-10">
        <div
          class="text-8xl mb-6 transform hover:scale-110 transition-transform duration-300 cursor-default"
        >
          {{ badge.icon }}
        </div>

        <h2 class="text-4xl font-extrabold text-white mb-2">
          {{ badge.title }}
        </h2>
        <p class="text-slate-400 text-lg mb-8">
          {{ badge.message }}
        </p>

        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <div
              class="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1"
            >
              Score
            </div>
            <div class="text-3xl font-bold text-cyan-400">
              {{ Math.round((results.score / results.totalQuestions) * 100) }}%
            </div>
          </div>
          <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <div
              class="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1"
            >
              Correct
            </div>
            <div class="text-3xl font-bold text-emerald-400">
              {{ results.score }}
              <span class="text-lg text-slate-500"
                >/ {{ results.totalQuestions }}</span
              >
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button
            @click="$emit('reset')"
            class="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Back to Menu
          </button>
          <button
            @click="$emit('reset')"
            class="px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  results: {
    type: Object,
    required: true,
  },
});

defineEmits(["reset"]);

const badge = computed(() =>
  getBadge(props.results.score, props.results.totalQuestions)
);

function getBadge(score, total) {
  const p = score / total;
  if (p >= 0.9)
    return {
      icon: "🏆",
      title: "Subject Master",
      message: "Outstanding! You have mastered this.",
    };
  if (p >= 0.8)
    return {
      icon: "⭐",
      title: "Quick Learner",
      message: "Great job! You're doing very well.",
    };
  if (p >= 0.7)
    return {
      icon: "📚",
      title: "Steady Progress",
      message: "Good work. Keep practicing to improve.",
    };
  if (p >= 0.6)
    return {
      icon: "📖",
      title: "Keep Practicing",
      message: "You passed, but there's room for growth.",
    };
  return {
    icon: "💪",
    title: "Don't Give Up",
    message: "Keep trying! Every mistake is a lesson.",
  };
}
</script>
