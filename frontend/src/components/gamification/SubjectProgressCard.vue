<template>
  <div
    class="glass-panel rounded-xl p-6 hover:translate-y-[-2px] hover:shadow-cyan-500/10 transition-all duration-300 group"
  >
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3
          class="font-bold text-lg tracking-tight group-hover:text-cyan-500 transition-colors"
          :style="{ color: 'var(--text-primary)' }"
        >
          {{ subject.subjectTitle || "Unknown Subject" }}
        </h3>
        <p
          class="text-xs font-medium tracking-wide uppercase"
          :style="{ color: 'var(--text-muted)' }"
        >
          {{ subject.gradeTitle }}
        </p>
      </div>
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg"
        :class="getMasteryColor(subject.learningProgress || 0)"
        :title="`Learning Progress: ${subject.learningProgress || 0}%`"
      >
        {{ subject.learningProgress || 0 }}%
      </div>
    </div>

    <!-- 2x2 Stats Grid -->
    <div class="grid grid-cols-2 gap-3 text-sm mb-4">
      <div
        class="rounded-lg p-3"
        :style="{ background: 'var(--surface-secondary)' }"
      >
        <div
          class="text-xs mb-1 flex items-center gap-1"
          :style="{ color: 'var(--text-secondary)' }"
        >
          <span>⏱️</span> Study Time
        </div>
        <div class="font-medium" :style="{ color: 'var(--text-primary)' }">
          {{ formatMinutes(subject.totalStudyTime) }}
        </div>
      </div>
      <div
        class="rounded-lg p-3"
        :style="{ background: 'var(--surface-secondary)' }"
      >
        <div
          class="text-xs mb-1 flex items-center gap-1"
          :style="{ color: 'var(--text-secondary)' }"
        >
          <span>📝</span> Quizzes
        </div>
        <div class="font-medium" :style="{ color: 'var(--text-primary)' }">
          {{ subject.quizzesDone || 0 }}
          <span
            v-if="subject.avgQuizScore"
            class="text-xs"
            :style="{ color: 'var(--text-muted)' }"
            >({{ subject.avgQuizScore }}% avg)</span
          >
        </div>
      </div>
      <div
        class="rounded-lg p-3"
        :style="{ background: 'var(--surface-secondary)' }"
      >
        <div
          class="text-xs mb-1 flex items-center gap-1"
          :style="{ color: 'var(--text-secondary)' }"
        >
          <span>📋</span> Exams
        </div>
        <div class="font-medium" :style="{ color: 'var(--text-primary)' }">
          {{ subject.examsDone || subject.examsCompleted || 0 }}
          <span
            v-if="subject.avgExamScore"
            class="text-xs"
            :style="{ color: 'var(--text-muted)' }"
            >({{ subject.avgExamScore }}% avg)</span
          >
        </div>
      </div>
      <div
        class="rounded-lg p-3"
        :style="{ background: 'var(--surface-secondary)' }"
      >
        <div
          class="text-xs mb-1 flex items-center gap-1"
          :style="{ color: 'var(--text-secondary)' }"
        >
          <span>📚</span> Units
        </div>
        <div class="font-medium" :style="{ color: 'var(--text-primary)' }">
          {{ subject.unitsAttempted || 0 }} / {{ subject.totalUnits || "?" }}
          <span class="text-xs" :style="{ color: 'var(--text-muted)' }"
            >attempted</span
          >
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div
      class="flex justify-between text-xs mb-1"
      :style="{ color: 'var(--text-secondary)' }"
    >
      <span
        class="flex items-center gap-1"
        title="Based on unit completion (40%), quiz scores (30%), and exam scores (30%)"
      >
        📊 Learning Progress
      </span>
      <span>{{ subject.learningProgress || 0 }}%</span>
    </div>
    <div
      class="w-full rounded-full h-1.5 overflow-hidden mb-4"
      :style="{ background: 'var(--surface-secondary)' }"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="getProgressBarColor(subject.learningProgress || 0)"
        :style="{ width: `${subject.learningProgress || 0}%` }"
      ></div>
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-2">
      <button
        @click.stop="$emit('start-quiz', subject)"
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        :style="{
          background: 'var(--surface-secondary)',
          color: 'var(--text-primary)',
        }"
        title="Start a quiz for this subject"
      >
        <span>📝</span>
        <span>Quick Quiz</span>
      </button>
      <button
        @click.stop="$emit('take-exam', subject)"
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        :style="{
          background: 'var(--surface-secondary)',
          color: 'var(--text-primary)',
        }"
        title="Take an exam for this subject"
      >
        <span>📋</span>
        <span>Take Exam</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  subject: {
    type: Object,
    required: true,
  },
});

defineEmits(["start-quiz", "take-exam"]);

const formatMinutes = (minutes) => {
  if (!minutes || minutes < 1) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getMasteryColor = (score) => {
  if (score >= 80) return "bg-green-500/20 text-green-400";
  if (score >= 60) return "bg-yellow-500/20 text-yellow-400";
  if (score >= 30) return "bg-orange-500/20 text-orange-400";
  return "bg-red-500/20 text-red-400";
};

const getProgressBarColor = (score) => {
  if (score >= 80) return "bg-linear-to-r from-green-500 to-emerald-400";
  if (score >= 60) return "bg-linear-to-r from-yellow-500 to-amber-400";
  if (score >= 30) return "bg-linear-to-r from-orange-500 to-amber-500";
  return "bg-linear-to-r from-red-500 to-orange-500";
};
</script>
