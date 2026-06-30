<template>
  <div class="h-full max-w-4xl mx-auto flex flex-col">
    <!-- Session Header -->
    <div class="flex justify-between items-center mb-6 px-2">
      <button
        @click="$emit('quit')"
        class="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
      >
        <span>✕</span> Quit Exam
      </button>
      <div
        class="glass-panel px-4 py-2 rounded-full text-cyan-400 font-mono font-bold"
      >
        {{ formattedTime }}
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="w-full h-1.5 bg-slate-800 rounded-full mb-8 overflow-hidden">
      <div
        class="h-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
        :style="{
          width: `${
            ((currentQuestionIndex + 1) / session.questions.length) * 100
          }%`,
        }"
      ></div>
    </div>

    <!-- Question Card -->
    <div
      class="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 flex-1 flex flex-col overflow-y-auto mb-4 relative"
    >
      <span
        class="absolute top-4 right-6 text-slate-500 text-xs font-bold tracking-wider"
      >
        Q{{ currentQuestionIndex + 1 }} / {{ session.questions.length }}
      </span>

      <div class="flex items-center gap-2 mb-3">
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors"
          :class="{
            'bg-cyan-500/10 border-cyan-500/50 text-cyan-400': [
              'mcq',
              'multiple_choice',
            ].includes(currentQuestion.type),
            'bg-emerald-500/10 border-emerald-500/50 text-emerald-400': [
              'true-false',
              'true_false',
            ].includes(currentQuestion.type),
            'bg-amber-500/10 border-amber-500/50 text-amber-400': [
              'fill_blank',
              'fill-blank',
              'short-answer',
            ].includes(currentQuestion.type),
            'bg-purple-500/10 border-purple-500/50 text-purple-400':
              currentQuestion.type === 'matching',
          }"
        >
          {{ currentQuestion.type?.replace(/[-_]/g, " ") || "Question" }}
        </span>
        <span class="text-slate-500 text-xs font-medium">
          {{
            ["true-false", "true_false"].includes(currentQuestion.type)
              ? "Determine if the statement is True or False"
              : ["mcq", "multiple_choice"].includes(currentQuestion.type)
              ? "Select the best option"
              : ["fill_blank", "fill-blank", "short-answer"].includes(
                  currentQuestion.type
                )
              ? "Enter your response"
              : "Complete the task"
          }}
        </span>
      </div>

      <h2 class="text-lg md:text-xl font-bold text-white mb-6 leading-snug">
        {{ currentQuestion.questionText }}
      </h2>

      <div class="space-y-4 max-w-2xl">
        <!-- True/False Specialized UI -->
        <template
          v-if="['true-false', 'true_false'].includes(currentQuestion.type)"
        >
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="opt in effectiveOptions"
              :key="opt"
              @click="selectAnswer(opt)"
              class="flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 font-bold text-base active:scale-95"
              :class="
                answers[currentQuestionIndex] === opt
                  ? opt.toLowerCase() === 'true'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
              "
            >
              <span class="text-lg">{{
                opt.toLowerCase() === "true" ? "✓" : "✗"
              }}</span>
              {{ opt }}
            </button>
          </div>
        </template>

        <!-- Multiple Choice / Matching -->
        <template
          v-else-if="
            ['multiple_choice', 'mcq', 'matching'].includes(
              currentQuestion.type
            )
          "
        >
          <div class="space-y-2">
            <button
              v-for="(opt, idx) in effectiveOptions"
              :key="opt"
              @click="selectAnswer(opt)"
              class="w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden"
              :class="
                answers[currentQuestionIndex] === opt
                  ? 'bg-cyan-500/20 border-cyan-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
              "
            >
              <div class="flex flex-col gap-3 relative z-10">
                <div class="flex items-center gap-3">
                  <div
                    class="w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0"
                    :class="
                      answers[currentQuestionIndex] === opt
                        ? 'border-cyan-400 bg-cyan-400'
                        : 'border-slate-500 group-hover:border-slate-300'
                    "
                  >
                    <div
                      v-if="answers[currentQuestionIndex] === opt"
                      class="w-1.5 h-1.5 bg-white rounded-full"
                    ></div>
                  </div>
                  <span class="text-sm leading-tight">{{ opt }}</span>
                </div>

                <!-- Option Image -->
                <div
                  v-if="
                    currentQuestion.optionImageUrls &&
                    currentQuestion.optionImageUrls[idx]
                  "
                  class="ml-8 mt-1 rounded-lg overflow-hidden border border-slate-600/50 bg-slate-900/50"
                >
                  <img
                    :src="getFullImageUrl(currentQuestion.optionImageUrls[idx])"
                    :alt="
                      currentQuestion.optionImageDescriptions?.[idx] ||
                      'Option image'
                    "
                    class="max-w-full max-h-48 object-contain"
                  />
                </div>
              </div>
            </button>
          </div>
        </template>

        <!-- Fill Blank / Short Answer -->
        <template
          v-else-if="
            ['fill_blank', 'fill-blank', 'short-answer'].includes(
              currentQuestion.type
            )
          "
        >
          <div class="space-y-3">
            <p class="text-slate-400 text-sm font-medium">
              Type your answer below:
            </p>
            <div class="relative">
              <input
                v-model="answers[currentQuestionIndex]"
                type="text"
                placeholder="Answer goes here..."
                class="w-full bg-slate-800/80 text-white p-4 rounded-xl border-2 border-slate-700 focus:border-cyan-500 outline-none text-base transition-all shadow-inner"
              />
              <div class="mt-2 flex items-center gap-2 text-slate-500 text-xs">
                <span>ℹ️</span> Case insensitive check for validation.
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="flex justify-between items-center py-4">
      <button
        v-if="currentQuestionIndex > 0"
        @click="currentQuestionIndex--"
        class="px-6 py-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors font-medium"
      >
        ← Previous
      </button>
      <div class="flex-1"></div>
      <button
        v-if="currentQuestionIndex < session.questions.length - 1"
        @click="nextQuestion"
        class="px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
      >
        Next Question →
      </button>
      <button
        v-else
        @click="submit"
        :disabled="submitting"
        class="px-8 py-3 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2"
      >
        <span v-if="submitting" class="animate-spin">⏳</span>
        {{ submitting ? "Submitting..." : "Submit Exam ✨" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useToast } from "../../composables/useToast";

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["quit", "submit"]);

const { info } = useToast();

const currentQuestionIndex = ref(0);
const answers = ref({});
const timer = ref(0);
let timerInterval = null;

const currentQuestion = computed(
  () => props.session?.questions[currentQuestionIndex.value]
);

const effectiveOptions = computed(() => {
  const q = currentQuestion.value;
  if (!q) return [];

  // If it's a true-false question and options are empty, provide defaults
  if (
    ["true-false", "true_false"].includes(q.type) &&
    (!q.options || q.options.length === 0)
  ) {
    return ["True", "False"];
  }

  return q.options || [];
});

const formattedTime = computed(() => {
  const m = Math.floor(timer.value / 60);
  const s = timer.value % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
});

function startTimer() {
  timer.value = 0;
  timerInterval = setInterval(() => timer.value++, 1000);
}

function selectAnswer(opt) {
  answers.value[currentQuestionIndex.value] = opt;
}

function nextQuestion() {
  if (
    answers.value[currentQuestionIndex.value] ||
    ["fill_blank", "fill-blank", "short-answer"].includes(
      currentQuestion.value.type
    )
  ) {
    currentQuestionIndex.value++;
  } else {
    info("Please select an answer");
  }
}

function getFullImageUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${baseUrl}${relativePath}`;
}

function submit() {
  clearInterval(timerInterval);
  emit("submit", answers.value);
}

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
