<template>
  <!-- Mode Selection: 3 Exam Types -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
    <!-- Real Exam Practice (replaces Subject Mastery & Unit Checkup) -->
    <button
      @click="$emit('select-mode', 'real-exam')"
      class="group relative flex flex-col items-center text-center p-12 rounded-3xl glass-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20 min-h-[300px]"
      :style="{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface-glass)',
      }"
    >
      <div
        class="w-28 h-28 mt-4 rounded-2xl bg-linear-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-cyan-500/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-12 h-12 text-cyan-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          ></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <h3
        class="text-2xl font-bold mb-3 group-hover:text-cyan-400 transition-colors"
        :style="{ color: 'var(--text-primary)' }"
      >
        Entrance Exams
      </h3>
      <p
        class="text-sm leading-relaxed"
        :style="{ color: 'var(--text-secondary)' }"
      >
        Practice with actual Ethiopian national entrance examination papers.
        Filter by grade, subject, and year.
      </p>
      <div
        class="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl"
      ></div>
    </button>

    <!-- Concept Check (Understanding Evaluation - kept) -->
    <button
      @click="$emit('select-mode', 'evaluation')"
      class="group relative flex flex-col items-center text-center p-12 rounded-3xl glass-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/20 min-h-[300px]"
      :style="{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface-glass)',
      }"
    >
      <div
        class="w-28 h-28 mt-4 rounded-2xl bg-linear-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-500/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-12 h-12 text-emerald-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M12 2a8 8 0 0 1 8 8c0 3.2-1.7 6-4.3 7.4-.5.3-1.1 1.2-1.1 1.8v.8h-5.2v-.8c0-.6-.6-1.5-1.1-1.8C5.7 16 4 13.2 4 10a8 8 0 0 1 8-8z"
          ></path>
          <path d="M9 22h6"></path>
        </svg>
      </div>
      <h3
        class="text-2xl font-bold mb-3 group-hover:text-emerald-400 transition-colors"
        :style="{ color: 'var(--text-primary)' }"
      >
        Concept Check
      </h3>
      <p
        class="text-sm leading-relaxed"
        :style="{ color: 'var(--text-secondary)' }"
      >
        Explain a concept in your own words and get instant AI feedback on your
        accuracy.
      </p>
      <div
        class="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl"
      ></div>
    </button>
    <!-- Model Exam Practice -->
    <button
      @click="$emit('select-mode', 'model-exam')"
      class="group relative flex flex-col items-center text-center p-12 rounded-3xl glass-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/20 min-h-[300px]"
      :style="{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface-glass)',
      }"
    >
      <div
        class="w-28 h-28 mt-4 rounded-2xl bg-linear-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-pink-500/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-12 h-12 text-pink-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h3
        class="text-2xl font-bold mb-3 group-hover:text-pink-400 transition-colors"
        :style="{ color: 'var(--text-primary)' }"
      >
        Model Exams
      </h3>
      <p
        class="text-sm leading-relaxed"
        :style="{ color: 'var(--text-secondary)' }"
      >
        AI-generated model exams based on authentic national exam blueprints.
        Choose real or practice mode.
      </p>
      <div
        class="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl"
      ></div>
    </button>
  </div>
</template>

<script setup>
// Emits
defineEmits(["select-mode"]);
</script>
