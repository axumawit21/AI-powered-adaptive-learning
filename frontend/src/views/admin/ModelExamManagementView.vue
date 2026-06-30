<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar (same as AdminDashboardView) -->
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <!-- Main Content -->
    <main class="ml-64 p-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold">Model Entrance Exams</h1>
        <button
          @click="showCreateModal = true"
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
        >
          + New Model Exam
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"
        ></div>
      </div>

      <!-- Exams List -->
      <div v-else-if="filteredExams.length > 0" class="grid gap-4">
        <div
          v-for="exam in filteredExams"
          :key="exam.id"
          class="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-xl font-semibold mb-2">{{ exam.title }}</h3>
              <div class="flex items-center gap-4 text-slate-400 text-sm">
                <span>{{ exam.subjectTitle }}</span>
                <span>•</span>
                <span>{{ exam.totalQuestions }} questions</span>
                <span>•</span>
                <span>{{ exam.duration }} min</span>
                <span>•</span>
                <span>Based on: {{ exam.basedOnYears.join(", ") }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium',
                  exam.examType === 'real'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400',
                ]"
              >
                {{ exam.examType === "real" ? "Real" : "Practice" }}
              </span>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium',
                  exam.status === 'published'
                    ? 'bg-green-500/20 text-green-400'
                    : exam.status === 'archived'
                      ? 'bg-gray-500/20 text-gray-400'
                      : 'bg-yellow-500/20 text-yellow-400',
                ]"
              >
                {{ exam.status }}
              </span>
            </div>
          </div>

          <div
            class="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700"
          >
            <button
              @click="viewExam(exam)"
              class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              View Details
            </button>
            <button
              v-if="
                exam.status === 'draft' && exam.generatedQuestionsCount === 0
              "
              @click="generateQuestionsForExam(exam)"
              :disabled="generatingId === exam.id"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {{
                generatingId === exam.id
                  ? "Generating..."
                  : "Generate Questions"
              }}
            </button>
            <button
              v-if="exam.status === 'draft' && exam.generatedQuestionsCount > 0"
              @click="publishExam(exam)"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
            >
              Publish
            </button>
            <button
              v-if="exam.status === 'published'"
              @click="unpublishExam(exam)"
              class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm transition-colors"
            >
              Unpublish
            </button>
            <button
              v-if="exam.status !== 'published'"
              @click="deleteExam(exam)"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-16 h-16 mx-auto mb-4 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="text-lg">No {{ activeTab }} model exams found</p>
        <p class="text-sm mt-2">Create a new model exam to get started</p>
      </div>
    </main>

    <!-- Create Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div
        class="bg-slate-800 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 class="text-2xl font-bold mb-6">Create New Model Exam</h2>

        <div class="space-y-6">
          <!-- Subject Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"
              >Subject</label
            >
            <select
              v-model="newExam.subjectId"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-500"
            >
              <option value="">Select a subject</option>
              <option
                v-for="subject in subjects"
                :key="subject._id"
                :value="subject._id"
              >
                {{ subject.title }}
              </option>
            </select>
          </div>

          <!-- Exam Type Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-3"
              >Exam Type</label
            >
            <div class="flex gap-6">
              <label class="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  v-model="newExam.examType"
                  value="real"
                  class="w-5 h-5 text-purple-600 bg-slate-700 border-slate-600 focus:ring-purple-500"
                />
                <div>
                  <span
                    class="text-white font-medium group-hover:text-purple-400 transition-colors"
                    >Real Model Exam</span
                  >
                  <p class="text-xs text-slate-400">
                    Timed exam, results shown at end only
                  </p>
                </div>
              </label>
              <label class="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  v-model="newExam.examType"
                  value="practice"
                  class="w-5 h-5 text-purple-600 bg-slate-700 border-slate-600 focus:ring-purple-500"
                />
                <div>
                  <span
                    class="text-white font-medium group-hover:text-purple-400 transition-colors"
                    >Practice Model Exam</span
                  >
                  <p class="text-xs text-slate-400">
                    With hints and explanations
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Title (Auto-generated) -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"
              >Exam Title</label
            >
            <input
              v-model="newExam.title"
              type="text"
              placeholder="Model Entrance Exam – Chemistry 2024"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          <!-- Exam Years Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"
              >Based on Exam Years (from uploaded exam papers)</label
            >
            <div v-if="loadingYears" class="text-slate-400 text-sm">
              Loading available years...
            </div>
            <div v-else-if="!newExam.subjectId" class="text-slate-400 text-sm">
              Select a subject first to see available exam years
            </div>
            <div
              v-else-if="availableYears.length === 0"
              class="text-yellow-400 text-sm"
            >
              No approved exam papers found for this subject. Upload and approve
              exam papers first.
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <button
                v-for="year in availableYears"
                :key="year"
                @click="toggleYear(year)"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  newExam.basedOnYears.includes(year)
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
                ]"
              >
                {{ year }}
              </button>
            </div>
          </div>

          <!-- Analyze Patterns Button -->
          <div v-if="newExam.basedOnYears.length > 0" class="mt-4">
            <button
              v-if="!patternAnalyzed"
              @click="analyzePatterns"
              :disabled="analyzingPattern"
              class="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {{
                analyzingPattern
                  ? "Analyzing Patterns..."
                  : "Step 1: Analyze Exam Patterns"
              }}
            </button>
            <div
              v-else
              class="p-3 bg-green-900/30 border border-green-600 rounded-lg text-green-400"
            >
              ✓ Pattern analysis complete! Now fill in the remaining details.
            </div>
          </div>

          <!-- Questions and Duration -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2"
                >Total Questions</label
              >
              <input
                v-model.number="newExam.totalQuestions"
                type="number"
                min="10"
                max="200"
                class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2"
                >Duration (minutes)</label
              >
              <input
                v-model.number="newExam.duration"
                type="number"
                min="30"
                max="300"
                class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"
              >Description (optional)</label
            >
            <textarea
              v-model="newExam.description"
              rows="3"
              placeholder="Brief description of the model exam..."
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-500"
            ></textarea>
          </div>
        </div>

        <div class="flex gap-4 mt-8">
          <button
            @click="showCreateModal = false"
            class="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            @click="createExam"
            :disabled="!canCreate || creating"
            class="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {{ creating ? "Creating..." : "Create Exam" }}
          </button>
        </div>
      </div>
    </div>

    <!-- View Exam Modal -->
    <div
      v-if="selectedExam"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="selectedExam = null"
    >
      <div
        class="bg-slate-800 rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">{{ selectedExam.title }}</h2>
          <button
            @click="selectedExam = null"
            class="text-slate-400 hover:text-white"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Exam Info -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-700/50 rounded-lg p-4">
            <div class="text-slate-400 text-sm">Subject</div>
            <div class="text-lg font-semibold">
              {{ selectedExam.subjectTitle }}
            </div>
          </div>
          <div class="bg-slate-700/50 rounded-lg p-4">
            <div class="text-slate-400 text-sm">Questions</div>
            <div class="text-lg font-semibold">
              {{ selectedExam.generatedQuestionsCount }}/{{
                selectedExam.totalQuestions
              }}
            </div>
          </div>
          <div class="bg-slate-700/50 rounded-lg p-4">
            <div class="text-slate-400 text-sm">Duration</div>
            <div class="text-lg font-semibold">
              {{ selectedExam.duration }} min
            </div>
          </div>
          <div class="bg-slate-700/50 rounded-lg p-4">
            <div class="text-slate-400 text-sm">Status</div>
            <div class="text-lg font-semibold capitalize">
              {{ selectedExam.status }}
            </div>
          </div>
        </div>

        <!-- Questions Preview -->
        <div v-if="selectedExam.questions && selectedExam.questions.length > 0">
          <h3 class="text-lg font-semibold mb-4">Generated Questions</h3>
          <div class="space-y-4 max-h-96 overflow-y-auto">
            <div
              v-for="(q, index) in selectedExam.questions"
              :key="q.id"
              class="bg-slate-700/50 rounded-lg p-4"
            >
              <div class="flex items-start gap-3">
                <span class="text-purple-400 font-bold">{{ index + 1 }}.</span>
                <div class="flex-1">
                  <p class="mb-3">{{ q.question }}</p>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div
                      v-for="(opt, key) in q.options"
                      :key="key"
                      :class="[
                        'px-3 py-2 rounded',
                        key === q.correctAnswer
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-slate-600/50',
                      ]"
                    >
                      {{ key }}. {{ opt }}
                    </div>
                  </div>
                  <div class="mt-2 text-sm text-slate-400 flex gap-4">
                    <span>Grade {{ q.grade }}</span>
                    <span>{{ q.unitTitle }}</span>
                    <span class="capitalize">{{ q.difficulty }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-slate-400">
          <p>No questions generated yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import * as modelExamService from "@/services/modelExamService";
import axios from "axios";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const { success, error: toastError } = useToast();

// State
const exams = ref([]);
const subjects = ref([]);
const loading = ref(true);
const creating = ref(false);
const generatingId = ref(null);
const showCreateModal = ref(false);
const selectedExam = ref(null);
const activeTab = ref("draft");

const tabs = [
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "archived", label: "Archived" },
];

const availableYears = ref([]);
const loadingYears = ref(false);
const patternId = ref(null);
const analyzingPattern = ref(false);
const patternAnalyzed = ref(false);

const newExam = ref({
  subjectId: "",
  title: "",
  basedOnYears: [],
  totalQuestions: 60,
  duration: 180,
  description: "",
  examType: "practice", // 'real' or 'practice'
});

// Computed
const filteredExams = computed(() => {
  if (!exams.value) return [];
  return exams.value.filter((e) => e.status === activeTab.value);
});

const canCreate = computed(() => {
  return (
    newExam.value.subjectId &&
    newExam.value.title &&
    newExam.value.basedOnYears.length > 0 &&
    newExam.value.totalQuestions >= 10 &&
    newExam.value.duration >= 30 &&
    patternId.value // Pattern must be analyzed first
  );
});

// Methods
const fetchExams = async () => {
  console.log("[fetchExams] Starting fetch...");
  loading.value = true;
  try {
    const result = await modelExamService.listModelExams();
    console.log("[fetchExams] API returned:", result);
    exams.value = result;
    console.log("[fetchExams] exams.value set to:", exams.value);
  } catch (error) {
    console.error("[fetchExams] Error fetching exams:", error);
    console.error("[fetchExams] Error response:", error.response?.data);

    // Handle authentication errors
    if (error.response?.status === 401) {
      toastError("Session expired. Please login again.");
      router.push("/admin/login");
      return;
    }

    toastError("Failed to load model exams. Please try refreshing the page.");
  } finally {
    loading.value = false;
    console.log("[fetchExams] Fetch complete. loading:", loading.value);
  }
};

const fetchSubjects = async () => {
  try {
    subjects.value = await modelExamService.getSubjectsWithPapers();
  } catch (error) {
    console.error("Error fetching subjects:", error);
  }
};

const fetchAvailableYears = async (subjectId) => {
  if (!subjectId) {
    availableYears.value = [];
    return;
  }
  loadingYears.value = true;
  try {
    const result = await modelExamService.getAvailableYears(subjectId);
    availableYears.value = result.years || [];
    // Clear selected years when subject changes
    newExam.value.basedOnYears = [];
  } catch (error) {
    console.error("Error fetching available years:", error);
    availableYears.value = [];
  } finally {
    loadingYears.value = false;
  }
};

// Watch for subject changes to fetch available years and reset pattern
watch(
  () => newExam.value.subjectId,
  (newSubjectId) => {
    fetchAvailableYears(newSubjectId);
    // Reset pattern when subject changes
    patternId.value = null;
    patternAnalyzed.value = false;
  },
);

// Reset pattern when years change
watch(
  () => newExam.value.basedOnYears,
  () => {
    patternId.value = null;
    patternAnalyzed.value = false;
    // Auto-generate title when years change
    updateAutoTitle();
  },
  { deep: true },
);

// Auto-generate title function
const updateAutoTitle = () => {
  if (!newExam.value.subjectId) return;

  const subject = subjects.value.find((s) => s._id === newExam.value.subjectId);
  if (!subject) return;

  const years = newExam.value.basedOnYears.sort((a, b) => a - b);
  const yearsStr =
    years.length > 0 ? years.join(", ") : new Date().getFullYear();
  const typeLabel = newExam.value.examType === "real" ? "Real" : "Practice";

  newExam.value.title = `${subject.title} ${typeLabel} Model Exam - ${yearsStr}`;
};

// Also update title when subject changes
watch(
  () => newExam.value.subjectId,
  () => {
    updateAutoTitle();
  },
);

// Also update title when exam type changes
watch(
  () => newExam.value.examType,
  () => {
    updateAutoTitle();
  },
);

const analyzePatterns = async () => {
  if (!newExam.value.subjectId || newExam.value.basedOnYears.length === 0)
    return;

  analyzingPattern.value = true;
  try {
    const result = await modelExamService.analyzePatterns(
      newExam.value.subjectId,
      newExam.value.basedOnYears,
    );
    patternId.value = result.id;
    patternAnalyzed.value = true;
  } catch (error) {
    console.error("Error analyzing patterns:", error);
    toastError("Failed to analyze patterns. Please try again.");
  } finally {
    analyzingPattern.value = false;
  }
};

const toggleYear = (year) => {
  const index = newExam.value.basedOnYears.indexOf(year);
  if (index > -1) {
    newExam.value.basedOnYears.splice(index, 1);
  } else {
    newExam.value.basedOnYears.push(year);
  }
};

const createExam = async () => {
  if (!canCreate.value) return;
  creating.value = true;
  try {
    const subject = subjects.value.find(
      (s) => s._id === newExam.value.subjectId,
    );
    await modelExamService.createModelExam({
      ...newExam.value,
      subjectTitle: subject?.title,
      patternId: patternId.value, // Pass the analyzed pattern
    });
    showCreateModal.value = false;
    // Reset all state
    newExam.value = {
      subjectId: "",
      title: "",
      basedOnYears: [],
      totalQuestions: 60,
      duration: 180,
      description: "",
      examType: "practice",
    };
    patternId.value = null;
    patternAnalyzed.value = false;
    await fetchExams();
    success("Model exam created successfully");
  } catch (error) {
    console.error("Error creating exam:", error);
    toastError("Failed to create exam. Please try again.");
  } finally {
    creating.value = false;
  }
};

const viewExam = async (exam) => {
  try {
    const detail = await modelExamService.getModelExamById(exam.id);
    selectedExam.value = detail;
  } catch (error) {
    console.error("Error fetching exam details:", error);
  }
};

const generateQuestionsForExam = async (exam) => {
  generatingId.value = exam.id;
  try {
    await modelExamService.generateQuestions(exam.id, false);
    await fetchExams();
    success("Questions generated successfully!");
  } catch (error) {
    console.error("Error generating questions:", error);
    toastError("Failed to generate questions. Please try again.");
  } finally {
    generatingId.value = null;
  }
};

const publishExam = async (exam) => {
  try {
    await modelExamService.publishModelExam(exam.id);
    await fetchExams();
    success("Exam published successfully");
  } catch (error) {
    console.error("Error publishing exam:", error);
    toastError("Failed to publish exam.");
  }
};

const unpublishExam = async (exam) => {
  try {
    await modelExamService.unpublishModelExam(exam.id);
    await fetchExams();
    success("Exam unpublished successfully");
  } catch (error) {
    console.error("Error unpublishing exam:", error);
    toastError("Failed to unpublish exam");
  }
};

const deleteExam = async (exam) => {
  if (!confirm("Are you sure you want to delete this exam?")) return;
  try {
    await modelExamService.deleteModelExam(exam.id);
    await fetchExams();
    success("Exam deleted successfully");
  } catch (error) {
    console.error("Error deleting exam:", error);
    toastError("Failed to delete exam.");
  }
};

onMounted(async () => {
  console.log("[ModelExamManagement] Component mounted, fetching data...");
  console.log(
    "[ModelExamManagement] Admin token:",
    localStorage.getItem("adminToken") ? "present" : "missing",
  );
  await fetchExams();
  await fetchSubjects();
  console.log(
    "[ModelExamManagement] Data fetch complete. Exams count:",
    exams.value.length,
  );
});
</script>
