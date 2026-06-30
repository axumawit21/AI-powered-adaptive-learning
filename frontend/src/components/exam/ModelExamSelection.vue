<template>
  <div class="model-exam-selection h-full flex flex-col">
    <!-- View 1: Type Selection (Real vs Practice) -->
    <div
      v-if="viewMode === 'type-selection'"
      class="flex-1 flex flex-col animate-fade-in"
    >
      <!-- Header -->
      <div class="mb-8">
        <button
          class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          @click="$emit('back')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Exam Center
        </button>
        <h2 class="text-3xl font-bold text-white mb-2">Model Exams</h2>
        <p class="text-slate-400">
          Choose a mode to start your AI-generated exam
        </p>
      </div>

      <!-- Selection Cards -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mt-4"
      >
        <!-- Practice Card -->
        <button
          @click="selectType('practice')"
          class="group relative flex flex-col items-center text-center p-8 rounded-3xl glass-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20 border border-slate-700 bg-slate-800/50"
        >
          <div
            class="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-10 h-10 text-purple-400"
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
            class="text-2xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors"
          >
            Practice Model Exam
          </h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            Take exams with hints and immediate explanations. Learn as you go
            without strict time pressure.
          </p>
          <div
            class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl"
          ></div>
        </button>

        <!-- Real Card -->
        <button
          @click="selectType('real')"
          class="group relative flex flex-col items-center text-center p-8 rounded-3xl glass-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/20 border border-slate-700 bg-slate-800/50"
        >
          <div
            class="w-20 h-20 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-pink-500/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-10 h-10 text-pink-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h3
            class="text-2xl font-bold mb-3 text-white group-hover:text-pink-400 transition-colors"
          >
            Real Model Exam
          </h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            Simulate the actual entrance exam experience. Strict timing, no
            hints, results at the end.
          </p>
          <div
            class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl"
          ></div>
        </button>
      </div>
    </div>

    <!-- View 2: Exam List -->
    <div v-else class="flex-1 flex flex-col animate-fade-in min-h-0">
      <!-- Header -->
      <div class="flex-none mb-6">
        <button
          class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          @click="viewMode = 'type-selection'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Mode Selection
        </button>
        <h2 class="text-2xl font-bold text-white mb-2">
          {{ selectedExamType === "real" ? "Real" : "Practice" }} Model Exams
        </h2>
        <p class="text-slate-400">Select a subject exam to start</p>
      </div>

      <!-- Filters -->
      <div class="flex-none flex gap-4 mb-6">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-slate-400">Subject</label>
          <select
            v-model="selectedSubject"
            class="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 min-w-[200px] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Subjects</option>
            <option v-for="s in availableSubjects" :key="s" :value="s">
              {{ s }}
            </option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex-1 flex flex-col items-center justify-center text-slate-400"
      >
        <div
          class="w-10 h-10 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin mb-4"
        ></div>
        <p>Loading available model exams...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredExams.length === 0"
        class="flex-1 flex flex-col items-center justify-center text-slate-400 p-12"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-12 h-12 text-slate-600 mb-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <p class="text-lg font-medium text-slate-300 mb-1">
          No model exams available
        </p>
        <span class="text-sm"
          >Try checking back later or adjusting filters</span
        >
      </div>

      <!-- Exams List -->
      <div v-else class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="exam in filteredExams"
            :key="exam.id"
            class="group flex items-center gap-4 p-5 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-750 hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-200"
            @click="$emit('select-exam', exam)"
          >
            <div
              :class="[
                'p-3.5 rounded-lg transition-colors',
                selectedExamType === 'real'
                  ? 'bg-pink-500/10 text-pink-500'
                  : 'bg-purple-500/10 text-purple-500',
              ]"
            >
              <svg
                v-if="selectedExamType === 'real'"
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <h3
                class="text-base font-semibold text-slate-200 mb-1.5 truncate"
              >
                {{ exam.title }}
              </h3>
              <div class="flex items-center gap-2 mb-1.5">
                <span
                  class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400"
                >
                  {{ exam.subjectTitle }}
                </span>
                <span
                  class="px-2 py-0.5 rounded text-xs font-semibold"
                  :class="
                    selectedExamType === 'real'
                      ? 'bg-pink-500/10 text-pink-400'
                      : 'bg-purple-500/10 text-purple-400'
                  "
                >
                  {{ exam.duration }} mins
                </span>
              </div>
              <span class="text-xs text-slate-400"
                >{{ exam.totalQuestions }} Questions</span
              >
            </div>

            <div
              class="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getPublishedExams } from "../../services/modelExamService";

import { useGlobalState } from "../../composables/useGlobalState";

const emit = defineEmits(["back", "select-exam"]);
const { grade } = useGlobalState();

// View State
const viewMode = ref("type-selection"); // 'type-selection' | 'list'
const selectedExamType = ref("practice"); // 'real' | 'practice'

// Data State
const exams = ref([]);
const loading = ref(true);
const selectedSubject = ref("");

// Watch for grade changes
watch(grade, () => {
  // If we were filtering by subject, we might want to reset it or keep it?
  console.log("[ModelExamSelection] Grade changed:", grade.value?.title);
});

// Computed
const availableSubjects = computed(() => {
  // Only show subjects for the current grade and filtered exams
  const currentGradeTitle = (grade.value?.title || "").toLowerCase().trim();

  // Filter exams first by grade and type
  const relevantExams = exams.value.filter((e) => {
    const examGradeTitle = (e.gradeTitle || "").toLowerCase().trim();
    // Default to practice if examType is missing
    const examType = e.examType || "practice";

    return (
      (!currentGradeTitle || examGradeTitle === currentGradeTitle) &&
      examType === selectedExamType.value
    );
  });

  const subjects = [...new Set(relevantExams.map((e) => e.subjectTitle))];
  return subjects.sort();
});

const filteredExams = computed(() => {
  return exams.value.filter((exam) => {
    // 1. Filter by Grade (Global)
    const currentGradeTitle = (grade.value?.title || "").toLowerCase().trim();
    const examGradeTitle = (exam.gradeTitle || "").toLowerCase().trim();

    // Match grade title (case-insensitive)
    if (currentGradeTitle && examGradeTitle !== currentGradeTitle) {
      return false;
    }

    // 2. Filter by Exam Type
    // Default to practice if examType is missing (backward compatibility)
    const examType = exam.examType || "practice";
    if (examType !== selectedExamType.value) {
      return false;
    }

    // 3. Filter by Subject (Local)
    if (selectedSubject.value && exam.subjectTitle !== selectedSubject.value)
      return false;

    return true;
  });
});

// Methods
function selectType(type) {
  selectedExamType.value = type;
  viewMode.value = "list";
  selectedSubject.value = ""; // Reset subject filter when changing type
}

async function fetchExams() {
  loading.value = true;
  try {
    exams.value = await getPublishedExams();
  } catch (err) {
    console.error("Failed to fetch model exams:", err);
    exams.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchExams);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
</style>
