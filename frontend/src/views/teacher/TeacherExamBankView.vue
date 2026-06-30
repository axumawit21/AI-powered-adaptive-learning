<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Header -->
    <header
      class="sticky top-0 bg-slate-900/95 border-b border-slate-700 z-10 px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link
            to="/teacher"
            class="text-slate-400 hover:text-white transition"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </router-link>
          <h1 class="text-xl font-bold">📚 My Exam Bank</h1>
        </div>
        <div class="flex items-center gap-3">
          <router-link
            to="/teacher/exams/new"
            class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Exam
          </router-link>
          <button
            @click="fetchExamBank"
            class="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </header>

    <main class="p-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Total Questions</div>
          <div class="text-3xl font-bold text-white">{{ stats.total }}</div>
        </div>
        <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Easy</div>
          <div class="text-3xl font-bold text-green-400">
            {{ stats.byDifficulty.easy }}
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Medium</div>
          <div class="text-3xl font-bold text-yellow-400">
            {{ stats.byDifficulty.medium }}
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Hard</div>
          <div class="text-3xl font-bold text-red-400">
            {{ stats.byDifficulty.hard }}
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Search -->
          <div class="md:col-span-2">
            <input
              v-model="filters.search"
              @input="debouncedSearch"
              type="text"
              placeholder="Search questions..."
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <!-- Unit Filter -->
          <select
            v-model="filters.unitNumber"
            @change="fetchExamBank"
            class="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Units</option>
            <option v-for="unit in availableUnits" :key="unit" :value="unit">
              Unit {{ unit }}
            </option>
          </select>
          <!-- Difficulty Filter -->
          <select
            v-model="filters.difficulty"
            @change="fetchExamBank"
            class="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <!-- Type Filter -->
          <select
            v-model="filters.type"
            @change="fetchExamBank"
            class="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="true-false">True/False</option>
            <option value="fill-blank">Fill Blank</option>
            <option value="short-answer">Short Answer</option>
          </select>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div
        v-if="selectedQuestions.length > 0"
        class="bg-amber-600/20 border border-amber-500/50 rounded-xl p-4 mb-6 flex items-center justify-between"
      >
        <span class="text-amber-400 font-medium">
          {{ selectedQuestions.length }} question(s) selected
        </span>
        <div class="flex gap-3">
          <button
            @click="addSelectedToExam"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition"
          >
            Add to New Exam
          </button>
          <button
            @click="clearSelection"
            class="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition"
          >
            Clear Selection
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"
        ></div>
        <p class="text-slate-400">Loading exam bank...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="questions.length === 0"
        class="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <svg
          class="w-16 h-16 mx-auto text-slate-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 class="text-xl font-semibold text-slate-400 mb-2">
          Your Exam Bank is Empty
        </h3>
        <p class="text-slate-500 mb-4">
          Store questions from the Approvals page to build your exam bank.
        </p>
        <router-link
          to="/teacher/approvals"
          class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition"
        >
          Go to Approvals
        </router-link>
      </div>

      <!-- Questions Grid -->
      <div v-else class="grid gap-4">
        <div
          v-for="q in questions"
          :key="q.questionId"
          :class="[
            'bg-slate-800 rounded-xl border overflow-hidden transition cursor-pointer',
            selectedQuestions.includes(q.questionId)
              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
              : 'border-slate-700 hover:border-slate-600',
          ]"
          @click="toggleSelection(q.questionId)"
        >
          <div class="p-5">
            <!-- Header Row -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400"
                >
                  Unit {{ q.unitNumber }}
                </span>
                <span
                  class="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400 uppercase"
                >
                  {{ q.type }}
                </span>
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    q.difficulty === 'easy'
                      ? 'bg-green-500/20 text-green-400'
                      : q.difficulty === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400',
                  ]"
                >
                  {{ q.difficulty }}
                </span>
                <span
                  v-if="q.usageCount > 0"
                  class="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400"
                >
                  Used {{ q.usageCount }}x
                </span>
              </div>
              <div class="flex items-center gap-2">
                <!-- Checkbox -->
                <div
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition',
                    selectedQuestions.includes(q.questionId)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500',
                  ]"
                >
                  <svg
                    v-if="selectedQuestions.includes(q.questionId)"
                    class="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Question Text -->
            <p class="text-white mb-3 line-clamp-2">{{ q.question }}</p>

            <!-- Options Preview (MCQ) -->
            <div
              v-if="q.options && q.options.length"
              class="flex flex-wrap gap-2 mb-3"
            >
              <span
                v-for="(opt, idx) in q.options.slice(0, 4)"
                :key="idx"
                class="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300 truncate max-w-[150px]"
              >
                {{ opt }}
              </span>
            </div>

            <!-- Actions -->
            <div
              class="flex justify-between items-center pt-3 border-t border-slate-700"
            >
              <span class="text-xs text-slate-500">{{
                formatDate(q.createdAt)
              }}</span>
              <button
                @click.stop="confirmDelete(q.questionId)"
                class="text-red-400 hover:text-red-300 text-sm transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
        <button
          v-for="p in totalPages"
          :key="p"
          @click="
            page = p;
            fetchExamBank();
          "
          :class="[
            'px-4 py-2 rounded-lg transition',
            p === page
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
          ]"
        >
          {{ p }}
        </button>
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteConfirmId"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="deleteConfirmId = null"
    >
      <div
        class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"
      >
        <h3 class="text-xl font-bold mb-4">Remove from Exam Bank?</h3>
        <p class="text-slate-400 mb-6">
          This will remove the question from your exam bank. It won't delete the
          original question.
        </p>
        <div class="flex gap-3">
          <button
            @click="deleteConfirmId = null"
            class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
          >
            Cancel
          </button>
          <button
            @click="removeQuestion"
            :disabled="deleteLoading"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition disabled:opacity-50"
          >
            {{ deleteLoading ? "Removing..." : "Remove" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { teacherApi } from "../../services/teacher";
import { useToast } from "../../composables/useToast";

const router = useRouter();
const toast = useToast();

// Data
const questions = ref([]);
const total = ref(0);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const selectedQuestions = ref([]);
const deleteConfirmId = ref(null);
const deleteLoading = ref(false);

// Stats
const stats = reactive({
  total: 0,
  byDifficulty: { easy: 0, medium: 0, hard: 0 },
  byType: {},
});

// Filters
const filters = reactive({
  search: "",
  unitNumber: "",
  difficulty: "",
  type: "",
});

// Available units (derived from questions or fetched)
const availableUnits = computed(() => {
  const units = new Set();
  questions.value.forEach((q) => units.add(q.unitNumber));
  // Add more units if we know them
  for (let i = 1; i <= 10; i++) units.add(i);
  return [...units].sort((a, b) => a - b);
});

// Debounce search
let searchTimeout = null;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    fetchExamBank();
  }, 300);
}

// Fetch exam bank
async function fetchExamBank() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: 20,
      ...(filters.unitNumber && { unitNumber: filters.unitNumber }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.type && { type: filters.type }),
      ...(filters.search && { search: filters.search }),
    };

    const res = await teacherApi.listExamBank(params);
    questions.value = res.questions || [];
    total.value = res.total || 0;
    totalPages.value = res.totalPages || 1;
  } catch (err) {
    console.error("Error fetching exam bank:", err);
    toast.error(err.response?.data?.message || "Failed to load exam bank");
  } finally {
    loading.value = false;
  }
}

// Fetch stats
async function fetchStats() {
  try {
    const res = await teacherApi.getExamBankStats();
    stats.total = res.total || 0;
    stats.byDifficulty = res.byDifficulty || { easy: 0, medium: 0, hard: 0 };
    stats.byType = res.byType || {};
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
}

// Selection
function toggleSelection(questionId) {
  const idx = selectedQuestions.value.indexOf(questionId);
  if (idx === -1) {
    selectedQuestions.value.push(questionId);
  } else {
    selectedQuestions.value.splice(idx, 1);
  }
}

function clearSelection() {
  selectedQuestions.value = [];
}

// Add selected to new exam
function addSelectedToExam() {
  // Store selected in session storage and navigate to exam builder
  sessionStorage.setItem(
    "selectedExamQuestions",
    JSON.stringify(selectedQuestions.value),
  );
  router.push("/teacher/exams/new");
}

// Delete
function confirmDelete(questionId) {
  deleteConfirmId.value = questionId;
}

async function removeQuestion() {
  if (!deleteConfirmId.value) return;

  deleteLoading.value = true;
  try {
    await teacherApi.removeFromExamBank(deleteConfirmId.value);
    toast.success("Question removed from exam bank");
    questions.value = questions.value.filter(
      (q) => q.questionId !== deleteConfirmId.value,
    );
    stats.total--;
    deleteConfirmId.value = null;
  } catch (err) {
    console.error("Error removing question:", err);
    toast.error(err.response?.data?.message || "Failed to remove question");
  } finally {
    deleteLoading.value = false;
  }
}

// Helpers
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString();
}

onMounted(() => {
  fetchExamBank();
  fetchStats();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
