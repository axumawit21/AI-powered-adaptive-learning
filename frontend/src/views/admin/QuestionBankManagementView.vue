<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Question Bank Generation</h1>
        <button
          @click="showModal = true"
          class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>⚡</span> Generate Questions
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-slate-400 text-sm font-bold uppercase mb-2">
            Total Questions
          </h3>
          <div class="text-3xl font-bold text-white">
            {{ stats.total || 0 }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-slate-400 text-sm font-bold uppercase mb-2">
            Filtered Count
          </h3>
          <div class="text-3xl font-bold text-cyan-400">
            {{ filterResult.total || 0 }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-slate-400 text-sm font-bold uppercase mb-2">
            By Difficulty
          </h3>
          <div class="flex flex-col gap-1 text-sm">
            <div class="flex justify-between">
              <span>Easy:</span>
              <span>{{
                filterResult.stats?.byDifficulty?.easy ||
                stats.byDifficulty?.easy ||
                0
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Medium:</span>
              <span>{{
                filterResult.stats?.byDifficulty?.medium ||
                stats.byDifficulty?.medium ||
                0
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Hard:</span>
              <span>{{
                filterResult.stats?.byDifficulty?.hard ||
                stats.byDifficulty?.hard ||
                0
              }}</span>
            </div>
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-slate-400 text-sm font-bold uppercase mb-2">
            By Type
          </h3>
          <div class="flex flex-col gap-1 text-sm">
            <div class="flex justify-between">
              <span>MCQ:</span>
              <span>{{ filterResult.stats?.byType?.mcq || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span>True/False:</span>
              <span>{{ filterResult.stats?.byType?.["true-false"] || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span>Fill Blank:</span>
              <span>{{ filterResult.stats?.byType?.["fill-blank"] || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8">
        <h3 class="text-lg font-bold text-white mb-4">🔍 Filter Questions</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Grade Filter -->
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Grade</label
            >
            <select
              v-model="filters.gradeId"
              @change="applyFilters"
              class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Grades</option>
              <option
                v-for="grade in grades"
                :key="grade._id"
                :value="grade._id"
              >
                {{ grade.title }}
              </option>
            </select>
          </div>

          <!-- Subject Filter -->
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Subject</label
            >
            <select
              v-model="filters.subjectId"
              @change="applyFilters"
              class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Subjects</option>
              <option
                v-for="subject in subjects"
                :key="subject._id"
                :value="subject._id"
              >
                {{ subject.title }}
              </option>
            </select>
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Question Type</label
            >
            <select
              v-model="filters.type"
              @change="applyFilters"
              class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="mcq">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="fill-blank">Fill in the Blank</option>
              <option value="short-answer">Short Answer</option>
              <option value="matching">Matching</option>
            </select>
          </div>

          <!-- Difficulty Filter -->
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Difficulty</label
            >
            <select
              v-model="filters.difficulty"
              @change="applyFilters"
              class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex justify-between items-center">
          <button
            @click="clearFilters"
            class="text-slate-400 hover:text-white text-sm"
          >
            Clear Filters
          </button>
          <span v-if="filterLoading" class="text-cyan-400 text-sm animate-pulse"
            >Loading...</span
          >
        </div>
      </div>

      <!-- Questions List -->
      <div
        class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8"
      >
        <div
          class="p-4 border-b border-slate-700 flex justify-between items-center"
        >
          <h3 class="text-lg font-bold text-white">
            Questions ({{ filterResult.total || 0 }})
          </h3>
          <div class="text-sm text-slate-400">
            Page {{ filterResult.page || 1 }} of
            {{ filterResult.totalPages || 1 }}
          </div>
        </div>

        <div
          v-if="filterResult.questions?.length"
          class="divide-y divide-slate-700"
        >
          <div
            v-for="q in filterResult.questions"
            :key="q.questionId"
            class="p-4 hover:bg-slate-750 transition-colors"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <p class="text-white font-medium truncate">{{ q.question }}</p>
                <div class="flex gap-2 mt-2">
                  <span
                    class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300"
                    >{{ q.type }}</span
                  >
                  <span
                    :class="difficultyClass(q.difficulty)"
                    class="px-2 py-0.5 rounded text-xs"
                    >{{ q.difficulty }}</span
                  >
                  <span
                    class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400"
                    >{{ q.gradeTitle }} - {{ q.subjectTitle }}</span
                  >
                </div>
              </div>
              <div class="text-xs text-slate-500">Unit {{ q.unitNumber }}</div>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-slate-400">
          No questions found. Adjust filters or generate new questions.
        </div>

        <!-- Pagination -->
        <div
          v-if="filterResult.totalPages > 1"
          class="p-4 border-t border-slate-700 flex justify-center gap-2"
        >
          <button
            @click="changePage(filterResult.page - 1)"
            :disabled="filterResult.page <= 1"
            class="px-3 py-1 bg-slate-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
          >
            Previous
          </button>
          <button
            @click="changePage(filterResult.page + 1)"
            :disabled="filterResult.page >= filterResult.totalPages"
            class="px-3 py-1 bg-slate-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Generation Modal -->
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <div
          class="bg-slate-800 p-8 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl"
        >
          <h2 class="text-2xl font-bold mb-6 text-cyan-400">
            Generate Questions
          </h2>

          <form @submit.prevent="handleGenerate" class="space-y-4">
            <!-- Book Selection (Implies Grade & Subject) -->
            <div>
              <label class="block text-sm font-bold text-slate-400 mb-1"
                >Select Book Context</label
              >
              <select
                v-model="selectedBookId"
                @change="onBookSelect"
                required
                class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option value="" disabled>-- Choose a Book --</option>
                <option v-for="book in books" :key="book._id" :value="book._id">
                  {{ getGradeTitle(book.grade) }} -
                  {{ getSubjectTitle(book.subject) }}
                </option>
              </select>
            </div>

            <!-- Unit Selection -->
            <div>
              <label class="block text-sm font-bold text-slate-400 mb-1"
                >Target Unit</label
              >
              <select
                v-model="form.unitNumber"
                required
                :disabled="!selectedBookId"
                @change="onUnitSelect"
                class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
              >
                <option value="" disabled>-- Choose Unit --</option>
                <option
                  v-for="unit in availableUnits"
                  :key="unit.unitNumber"
                  :value="unit.unitNumber"
                >
                  Unit {{ unit.unitNumber }}: {{ unit.title }}
                </option>
              </select>
            </div>

            <!-- Subunit Selection (Optional) -->
            <div v-if="availableSubunits.length > 0">
              <label class="block text-sm font-bold text-slate-400 mb-1"
                >Target Subunit
                <span class="text-slate-500 font-normal"
                  >(optional - leave empty for whole unit)</span
                ></label
              >
              <select
                v-model="form.subunitNumber"
                :disabled="!form.unitNumber"
                class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
              >
                <option value="">-- Entire Unit --</option>
                <option
                  v-for="sub in availableSubunits"
                  :key="sub.subunitNumber"
                  :value="sub.subunitNumber"
                >
                  {{ sub.subunitNumber }}: {{ sub.title }}
                </option>
              </select>
            </div>

            <!-- Configuration -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Questions per Difficulty</label
                >
                <input
                  v-model.number="form.questionsPerDifficulty"
                  type="number"
                  min="1"
                  max="20"
                  class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>

            <!-- Question Types -->
            <div>
              <label class="block text-sm font-bold text-slate-400 mb-1"
                >Question Types</label
              >
              <div class="flex flex-wrap gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.questionTypes"
                    value="mcq"
                    class="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span class="text-sm">MCQ</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.questionTypes"
                    value="true-false"
                    class="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span class="text-sm">True/False</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.questionTypes"
                    value="fill-blank"
                    class="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span class="text-sm">Fill Blank</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.questionTypes"
                    value="short-answer"
                    class="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span class="text-sm">Short Answer</span>
                </label>
              </div>
            </div>

            <!-- Difficulty Override (Optional) -->
            <div>
              <label class="block text-sm font-bold text-slate-400 mb-1"
                >Target Difficulties</label
              >
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.difficulties"
                    value="easy"
                    class="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span class="text-sm">Easy</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.difficulties"
                    value="medium"
                    class="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span class="text-sm">Medium</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.difficulties"
                    value="hard"
                    class="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span class="text-sm">Hard</span>
                </label>
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-3">
              <button
                type="button"
                @click="showModal = false"
                class="px-5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                :disabled="generating"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-white font-bold shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
                :disabled="generating"
              >
                <span v-if="generating" class="animate-spin">⏳</span>
                {{ generating ? "Generating..." : "Start Generation" }}
              </button>
            </div>

            <p
              v-if="generating"
              class="text-xs text-center text-cyan-400 animate-pulse mt-2"
            >
              This may take up to a minute. Please wait...
            </p>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios"; // Using axios directly for books fetching for consistency with other admin views
import { questionBankApi } from "../../services/questionBank";
import { useToast } from "../../composables/useToast";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const { success, error: toastError } = useToast();

const showModal = ref(false);
const generating = ref(false);
const stats = ref({});
const books = ref([]);
const grades = ref([]);
const subjects = ref([]);
const selectedBookId = ref("");

// Filter state
const filters = ref({
  gradeId: "",
  subjectId: "",
  type: "",
  difficulty: "",
  page: 1,
  limit: 20,
});
const filterResult = ref({
  total: 0,
  page: 1,
  totalPages: 1,
  questions: [],
  stats: { byType: {}, byDifficulty: {} },
});
const filterLoading = ref(false);

const form = ref({
  unitNumber: "",
  subunitNumber: "", // NEW: optional subunit
  questionsPerDifficulty: 5,
  difficulties: ["easy", "medium", "hard"],
  questionTypes: ["mcq", "true-false", "fill-blank", "short-answer"],
});

// Computed available units based on selected book
const availableUnits = computed(() => {
  const book = books.value.find((b) => b._id === selectedBookId.value);
  return book ? book.units : [];
});

// NEW: Computed available subunits based on selected unit
const availableSubunits = computed(() => {
  const unit = availableUnits.value.find(
    (u) => u.unitNumber === form.value.unitNumber,
  );
  return unit?.subChapters || [];
});

async function fetchData() {
  try {
    const [booksRes, statsRes, gradesRes, subjectsRes] = await Promise.all([
      axios.get("http://localhost:3000/books"),
      questionBankApi.getStats(),
      axios.get("http://localhost:3000/grades"),
      axios.get("http://localhost:3000/subjects"),
    ]);
    books.value = booksRes.data;
    stats.value = statsRes;
    grades.value = gradesRes.data;
    subjects.value = subjectsRes.data;

    // Initial filter load
    await applyFilters();
  } catch (e) {
    console.error("Failed to load data", e);
    toastError("Failed to load initial data");
  }
}

async function applyFilters() {
  filterLoading.value = true;
  try {
    const params = {};
    if (filters.value.gradeId) params.gradeId = filters.value.gradeId;
    if (filters.value.subjectId) params.subjectId = filters.value.subjectId;
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.difficulty) params.difficulty = filters.value.difficulty;
    params.page = filters.value.page;
    params.limit = filters.value.limit;

    const result = await questionBankApi.filterQuestions(params);
    filterResult.value = result;
  } catch (e) {
    console.error("Filter failed", e);
  } finally {
    filterLoading.value = false;
  }
}

function clearFilters() {
  filters.value = {
    gradeId: "",
    subjectId: "",
    type: "",
    difficulty: "",
    page: 1,
    limit: 20,
  };
  applyFilters();
}

function changePage(newPage) {
  if (newPage >= 1 && newPage <= filterResult.value.totalPages) {
    filters.value.page = newPage;
    applyFilters();
  }
}

function difficultyClass(diff) {
  if (diff === "easy") return "bg-green-600/20 text-green-400";
  if (diff === "medium") return "bg-yellow-600/20 text-yellow-400";
  if (diff === "hard") return "bg-red-600/20 text-red-400";
  return "bg-slate-700 text-slate-300";
}

function onBookSelect() {
  form.value.unitNumber = ""; // Reset unit when book changes
  form.value.subunitNumber = ""; // Reset subunit too
}

// NEW: Reset subunit when unit changes
function onUnitSelect() {
  form.value.subunitNumber = "";
}

function getGradeTitle(grade) {
  return (
    grade?.title ||
    grade?.name ||
    (typeof grade === "string" ? grade : "Unknown Grade")
  );
}

function getSubjectTitle(subj) {
  return (
    subj?.title ||
    subj?.name ||
    (typeof subj === "string" ? subj : "Unknown Subject")
  );
}

async function handleGenerate() {
  if (!selectedBookId.value || !form.value.unitNumber) {
    toastError("Please select a book and a unit");
    return;
  }

  const book = books.value.find((b) => b._id === selectedBookId.value);
  const unit = book.units.find((u) => u.unitNumber === form.value.unitNumber);

  if (!book || !unit) return;

  generating.value = true;

  try {
    // Get selected subunit info if any
    const selectedSubunit = availableSubunits.value.find(
      (s) => s.subunitNumber === form.value.subunitNumber,
    );

    // Construct DTO
    const payload = {
      subjectId:
        typeof book.subject === "object" ? book.subject._id : book.subject,
      gradeId: typeof book.grade === "object" ? book.grade._id : book.grade,
      unitNumber: unit.unitNumber,
      unitTitle: unit.title,
      // NEW: Include subunit if selected
      subunitNumber: form.value.subunitNumber || undefined,
      subunitTitle: selectedSubunit?.title || undefined,
      questionsPerDifficulty: form.value.questionsPerDifficulty,
      difficulties: form.value.difficulties,
      questionTypes: form.value.questionTypes,
      bookId: book._id,
    };

    const res = await questionBankApi.generateQuestions(payload);

    success(`Generated ${res.count || "batch of"} questions successfully!`);
    showModal.value = false;

    // Refresh stats
    const newStats = await questionBankApi.getStats();
    stats.value = newStats;
  } catch (e) {
    console.error("Generation failed", e);
    toastError(e.response?.data?.message || "Generation failed");
  } finally {
    generating.value = false;
  }
}

onMounted(fetchData);
</script>
