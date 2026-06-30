<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Header -->
    <header
      class="sticky top-0 bg-slate-900/95 border-b border-slate-700 z-10 px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link
            to="/teacher/exams"
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
          <h1 class="text-xl font-bold">
            {{ isEditMode ? "Edit Exam" : "Create New Exam" }}
          </h1>
        </div>
      </div>
    </header>

    <!-- Progress Steps -->
    <div class="px-6 py-4 border-b border-slate-800">
      <div class="flex justify-center gap-4">
        <div
          v-for="(step, idx) in steps"
          :key="idx"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer',
            currentStep === idx + 1
              ? 'bg-emerald-600 text-white'
              : currentStep > idx + 1
                ? 'bg-emerald-600/30 text-emerald-400'
                : 'bg-slate-800 text-slate-400',
          ]"
          @click="
            exam.status === 'draft' &&
            idx + 1 <= currentStep &&
            (currentStep = idx + 1)
          "
        >
          <span
            class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
            :class="currentStep > idx + 1 ? 'bg-emerald-600' : 'bg-slate-700'"
          >
            {{ currentStep > idx + 1 ? "✓" : idx + 1 }}
          </span>
          <span class="hidden sm:inline">{{ step }}</span>
        </div>
      </div>
    </div>

    <main class="p-6 max-w-5xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"
        ></div>
        <p class="text-slate-400">Loading...</p>
      </div>

      <!-- Step 1: Exam Details -->
      <div v-else-if="currentStep === 1" class="space-y-6">
        <h2 class="text-2xl font-bold mb-6">Exam Details</h2>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Title -->
          <div class="md:col-span-2">
            <label class="block text-sm text-slate-400 mb-2"
              >Exam Title *</label
            >
            <input
              v-model="exam.title"
              type="text"
              placeholder="e.g., Unit 1 Quiz, Midterm Examination"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Exam Type -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">Exam Type *</label>
            <select
              v-model="exam.examType"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="quiz">Quiz</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>

          <!-- Duration -->
          <div>
            <label class="block text-sm text-slate-400 mb-2"
              >Duration (minutes)</label
            >
            <input
              v-model.number="exam.duration"
              type="number"
              min="1"
              placeholder="e.g., 60"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Grade -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">Grade *</label>
            <select
              v-model="exam.gradeId"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select Grade</option>
              <option v-for="g in grades" :key="g._id" :value="g._id">
                {{ g.title }}
              </option>
            </select>
          </div>

          <!-- Subject -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">Subject *</label>
            <select
              v-model="exam.subjectId"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select Subject</option>
              <option v-for="s in subjects" :key="s._id" :value="s._id">
                {{ s.title }}
              </option>
            </select>
          </div>

          <!-- Instructions -->
          <div class="md:col-span-2">
            <label class="block text-sm text-slate-400 mb-2"
              >Instructions</label
            >
            <textarea
              v-model="exam.instructions"
              rows="3"
              placeholder="Instructions for students..."
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-700">
          <button
            @click="nextStep"
            :disabled="!canProceed"
            class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Step 2: Add Questions -->
      <div v-else-if="currentStep === 2" class="space-y-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">Add Questions</h2>
          <div class="flex gap-3">
            <button
              @click="showAutoBuildModal = true"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition"
            >
              🤖 Auto-Build
            </button>
            <button
              @click="showBankModal = true"
              class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition"
            >
              📚 From Exam Bank
            </button>
          </div>
        </div>

        <!-- Current Questions -->
        <div
          v-if="exam.questions.length === 0"
          class="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed"
        >
          <svg
            class="w-12 h-12 mx-auto text-slate-600 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p class="text-slate-400">
            No questions added yet. Use the buttons above to add questions.
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(q, idx) in exam.questions"
            :key="q.questionId"
            class="bg-slate-800 rounded-xl border border-slate-700 p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-slate-500 font-mono">Q{{ idx + 1 }}</span>
                  <span
                    class="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 uppercase"
                    >{{ q.type }}</span
                  >
                  <span
                    :class="getDifficultyClass(q.difficulty)"
                    class="px-2 py-0.5 text-xs rounded"
                    >{{ q.difficulty }}</span
                  >
                </div>
                <p class="text-white">{{ q.question }}</p>
              </div>
              <button
                @click="removeQuestion(idx)"
                class="text-red-400 hover:text-red-300 ml-3"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div
          class="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-700"
        >
          <button
            @click="prevStep"
            class="px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
          >
            ← Back
          </button>
          <button
            @click="nextStep"
            :disabled="exam.questions.length === 0"
            class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Step 3: Review & Marks -->
      <div v-else-if="currentStep === 3" class="space-y-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">Review & Set Marks</h2>
          <div
            class="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700"
          >
            <span class="text-slate-400">Total: </span>
            <span class="text-2xl font-bold text-emerald-400">{{
              totalMarks
            }}</span>
            <span class="text-slate-400"> marks</span>
          </div>
        </div>

        <div
          v-if="exam.questions.length === 0"
          class="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700"
        >
          <p class="text-slate-400">
            No questions to review. Go back to Step 2 to add questions.
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(q, idx) in exam.questions"
            :key="q.questionId"
            class="bg-slate-800 rounded-xl border border-slate-700 p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span
                  class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold"
                  >{{ idx + 1 }}</span
                >
                <div>
                  <p class="text-white line-clamp-1">{{ q.question }}</p>
                  <div class="flex gap-2 mt-1">
                    <span class="text-xs text-slate-500 uppercase">{{
                      q.type
                    }}</span>
                    <span
                      class="text-xs"
                      :class="getDifficultyClass(q.difficulty)"
                      >{{ q.difficulty }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="decrementMarks(idx)"
                  class="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600"
                >
                  -
                </button>
                <input
                  v-model.number="q.marks"
                  type="number"
                  min="1"
                  class="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-center text-white"
                />
                <button
                  @click="incrementMarks(idx)"
                  class="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div
          class="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-700"
        >
          <button
            @click="prevStep"
            class="px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
          >
            ← Back
          </button>
          <button
            @click="nextStep"
            class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Step 4: Finalize -->
      <div v-else-if="currentStep === 4" class="space-y-6">
        <h2 class="text-2xl font-bold mb-6">Preview & Finalize</h2>

        <!-- Summary Card -->
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 class="text-xl font-bold text-white mb-4">{{ exam.title }}</h3>

          <div class="grid md:grid-cols-4 gap-4 mb-6">
            <div class="bg-slate-900/50 rounded-lg p-4 text-center">
              <div class="text-slate-400 text-sm mb-1">Type</div>
              <div class="text-lg font-semibold text-cyan-400 uppercase">
                {{ exam.examType }}
              </div>
            </div>
            <div class="bg-slate-900/50 rounded-lg p-4 text-center">
              <div class="text-slate-400 text-sm mb-1">Questions</div>
              <div class="text-lg font-semibold text-white">
                {{ exam.questions.length }}
              </div>
            </div>
            <div class="bg-slate-900/50 rounded-lg p-4 text-center">
              <div class="text-slate-400 text-sm mb-1">Total Marks</div>
              <div class="text-lg font-semibold text-emerald-400">
                {{ totalMarks }}
              </div>
            </div>
            <div class="bg-slate-900/50 rounded-lg p-4 text-center">
              <div class="text-slate-400 text-sm mb-1">Duration</div>
              <div class="text-lg font-semibold text-white">
                {{ exam.duration || "-" }} min
              </div>
            </div>
          </div>

          <!-- Difficulty Distribution -->
          <div class="mb-4">
            <div class="text-slate-400 text-sm mb-2">
              Difficulty Distribution
            </div>
            <div class="flex gap-4">
              <span class="text-green-400"
                >Easy: {{ difficultyCount.easy }}</span
              >
              <span class="text-yellow-400"
                >Medium: {{ difficultyCount.medium }}</span
              >
              <span class="text-red-400">Hard: {{ difficultyCount.hard }}</span>
            </div>
          </div>

          <div v-if="exam.instructions" class="bg-slate-900/50 rounded-lg p-4">
            <div class="text-slate-400 text-sm mb-1">Instructions</div>
            <p class="text-white">{{ exam.instructions }}</p>
          </div>
        </div>

        <div
          v-if="exam.status === 'finalized'"
          class="bg-emerald-600/20 border border-emerald-500/50 rounded-xl p-6 text-center"
        >
          <svg
            class="w-12 h-12 mx-auto text-emerald-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 class="text-xl font-bold text-emerald-400 mb-2">
            Exam Finalized!
          </h3>
          <p class="text-slate-400 mb-4">This exam is ready for printing.</p>
          <router-link
            to="/teacher/exams"
            class="inline-flex px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition"
          >
            View All Exams
          </router-link>
        </div>

        <!-- Navigation Buttons (Draft only) -->
        <div
          v-if="exam.status === 'draft'"
          class="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-700"
        >
          <button
            @click="prevStep"
            class="px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
          >
            ← Back
          </button>
          <button
            @click="finalizeExam"
            :disabled="exam.questions.length === 0"
            class="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition disabled:opacity-50"
          >
            ✓ Finalize Exam
          </button>
        </div>
      </div>
    </main>

    <!-- Exam Bank Modal -->
    <div
      v-if="showBankModal"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="showBankModal = false"
    >
      <div
        class="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700"
      >
        <div
          class="p-4 border-b border-slate-700 flex items-center justify-between"
        >
          <h3 class="text-lg font-bold">Select Questions from Exam Bank</h3>
          <button
            @click="showBankModal = false"
            class="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div class="p-4 overflow-y-auto max-h-[60vh]">
          <div v-if="bankLoading" class="text-center py-8">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"
            ></div>
          </div>
          <div
            v-else-if="bankQuestions.length === 0"
            class="text-center py-8 text-slate-400"
          >
            No questions in your exam bank. Store questions from the Approvals
            page first.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="q in bankQuestions"
              :key="q.questionId"
              :class="[
                'p-3 rounded-lg border cursor-pointer transition',
                selectedBankQuestions.includes(q.questionId)
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 hover:border-slate-600',
              ]"
              @click="toggleBankQuestion(q.questionId)"
            >
              <div class="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  :checked="selectedBankQuestions.includes(q.questionId)"
                  class="w-4 h-4"
                />
                <span class="text-xs text-slate-500"
                  >Unit {{ q.unitNumber }}</span
                >
                <span
                  class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase"
                  >{{ q.type }}</span
                >
              </div>
              <p class="text-white text-sm">{{ q.question }}</p>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-700 flex justify-between">
          <span class="text-slate-400"
            >{{ selectedBankQuestions.length }} selected</span
          >
          <div class="flex gap-3">
            <button
              @click="showBankModal = false"
              class="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              @click="addSelectedQuestions"
              :disabled="selectedBankQuestions.length === 0"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium disabled:opacity-50"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Auto-Build Modal -->
    <div
      v-if="showAutoBuildModal"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="showAutoBuildModal = false"
    >
      <div
        class="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700 p-6"
      >
        <h3 class="text-lg font-bold mb-4">Auto-Build Exam</h3>

        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm text-slate-400 mb-2"
              >Total Questions</label
            >
            <input
              v-model.number="autoBuild.totalQuestions"
              type="number"
              min="1"
              max="50"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-2"
              >Default Marks per Question</label
            >
            <input
              v-model.number="autoBuild.defaultMarks"
              type="number"
              min="1"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-2"
              >Difficulty Distribution</label
            >
            <div class="grid grid-cols-3 gap-2">
              <div>
                <span class="text-xs text-green-400">Easy %</span>
                <input
                  v-model.number="autoBuild.difficultyDistribution.easy"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <span class="text-xs text-yellow-400">Medium %</span>
                <input
                  v-model.number="autoBuild.difficultyDistribution.medium"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <span class="text-xs text-red-400">Hard %</span>
                <input
                  v-model.number="autoBuild.difficultyDistribution.hard"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="showAutoBuildModal = false"
            class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            @click="runAutoBuild"
            :disabled="autoBuildLoading"
            class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium disabled:opacity-50"
          >
            {{ autoBuildLoading ? "Building..." : "Build" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { teacherApi } from "../../services/teacher";
import { useToast } from "../../composables/useToast";
import axios from "axios";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// State
const loading = ref(false);
const currentStep = ref(1);
const steps = ["Details", "Questions", "Review", "Finalize"];
const isEditMode = computed(() => !!route.params.examId);

// Exam data
const exam = reactive({
  examId: "",
  title: "",
  examType: "quiz",
  gradeId: "",
  subjectId: "",
  duration: null,
  instructions: "",
  questions: [],
  status: "draft",
});

// Reference data
const grades = ref([]);
const subjects = ref([]);

// Bank modal
const showBankModal = ref(false);
const bankQuestions = ref([]);
const bankLoading = ref(false);
const selectedBankQuestions = ref([]);

// Auto-build modal
const showAutoBuildModal = ref(false);
const autoBuildLoading = ref(false);
const autoBuild = reactive({
  totalQuestions: 10,
  defaultMarks: 1,
  difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
});

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return exam.title && exam.examType && exam.gradeId && exam.subjectId;
  }
  return true;
});

const totalMarks = computed(() => {
  return exam.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
});

const difficultyCount = computed(() => {
  const counts = { easy: 0, medium: 0, hard: 0 };
  exam.questions.forEach((q) => {
    if (counts[q.difficulty] !== undefined) counts[q.difficulty]++;
  });
  return counts;
});

// Methods
async function fetchGradesAndSubjects() {
  try {
    const token = localStorage.getItem("teacherToken");
    const headers = { Authorization: `Bearer ${token}` };

    const [gradesRes, subjectsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/grades`, { headers }),
      axios.get(`${API_BASE_URL}/subjects`, { headers }),
    ]);

    grades.value = gradesRes.data || [];
    subjects.value = subjectsRes.data || [];
  } catch (err) {
    console.error("Error fetching grades/subjects:", err);
  }
}

async function loadExam() {
  if (!route.params.examId) return;

  loading.value = true;
  try {
    const data = await teacherApi.getExam(route.params.examId);
    Object.assign(exam, data);
    if (exam.status === "finalized") {
      currentStep.value = 4;
    }
  } catch (err) {
    console.error("Error loading exam:", err);
    toast.error("Failed to load exam");
    router.push("/teacher/exams");
  } finally {
    loading.value = false;
  }
}

async function saveExam() {
  try {
    if (exam.examId) {
      // Update existing
      await teacherApi.updateExam(exam.examId, {
        title: exam.title,
        examType: exam.examType,
        duration: exam.duration,
        instructions: exam.instructions,
      });
    } else {
      // Create new
      const created = await teacherApi.createExam({
        title: exam.title,
        examType: exam.examType,
        gradeId: exam.gradeId,
        subjectId: exam.subjectId,
        duration: exam.duration,
        instructions: exam.instructions,
      });
      exam.examId = created.examId;
    }
  } catch (err) {
    console.error("Error saving exam:", err);
    toast.error("Failed to save exam");
    throw err;
  }
}

async function nextStep() {
  if (currentStep.value === 1 && !exam.examId) {
    await saveExam();
  }
  currentStep.value++;
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--;
}

// Exam Bank
async function fetchBankQuestions() {
  bankLoading.value = true;
  try {
    const res = await teacherApi.listExamBank({ limit: 100 });
    // Filter out already added questions
    const addedIds = exam.questions.map((q) => q.questionId);
    bankQuestions.value = (res.questions || []).filter(
      (q) => !addedIds.includes(q.questionId),
    );
  } catch (err) {
    console.error("Error fetching bank:", err);
  } finally {
    bankLoading.value = false;
  }
}

function toggleBankQuestion(questionId) {
  const idx = selectedBankQuestions.value.indexOf(questionId);
  if (idx === -1) {
    selectedBankQuestions.value.push(questionId);
  } else {
    selectedBankQuestions.value.splice(idx, 1);
  }
}

async function addSelectedQuestions() {
  if (!exam.examId) {
    await saveExam();
  }

  try {
    const updated = await teacherApi.addQuestionsToExam(
      exam.examId,
      selectedBankQuestions.value,
      1,
    );
    exam.questions = updated.questions || [];
    toast.success(`Added ${selectedBankQuestions.value.length} questions`);
    selectedBankQuestions.value = [];
    showBankModal.value = false;
  } catch (err) {
    console.error("Error adding questions:", err);
    toast.error("Failed to add questions");
  }
}

// Auto-build
async function runAutoBuild() {
  if (!exam.examId) {
    await saveExam();
  }

  autoBuildLoading.value = true;
  try {
    const updated = await teacherApi.autoBuildExam(exam.examId, autoBuild);
    exam.questions = updated.questions || [];
    toast.success(`Auto-built with ${exam.questions.length} questions`);
    showAutoBuildModal.value = false;
  } catch (err) {
    console.error("Error auto-building:", err);
    toast.error(err.response?.data?.message || "Failed to auto-build");
  } finally {
    autoBuildLoading.value = false;
  }
}

// Questions management
function removeQuestion(idx) {
  exam.questions.splice(idx, 1);
}

function incrementMarks(idx) {
  exam.questions[idx].marks = (exam.questions[idx].marks || 1) + 1;
}

function decrementMarks(idx) {
  if (exam.questions[idx].marks > 1) {
    exam.questions[idx].marks--;
  }
}

// Finalize
async function finalizeExam() {
  try {
    await teacherApi.finalizeExam(exam.examId);
    exam.status = "finalized";
    toast.success("Exam finalized successfully!");
  } catch (err) {
    console.error("Error finalizing:", err);
    toast.error("Failed to finalize exam");
  }
}

// Helpers
function getDifficultyClass(difficulty) {
  switch (difficulty) {
    case "easy":
      return "bg-green-500/20 text-green-400";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400";
    case "hard":
      return "bg-red-500/20 text-red-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
}

// Watchers
watch(showBankModal, (val) => {
  if (val) fetchBankQuestions();
});

// Check for pre-selected questions from exam bank
onMounted(async () => {
  await fetchGradesAndSubjects();

  if (isEditMode.value) {
    await loadExam();
  } else {
    // Check for pre-selected questions
    const preSelected = sessionStorage.getItem("selectedExamQuestions");
    if (preSelected) {
      selectedBankQuestions.value = JSON.parse(preSelected);
      sessionStorage.removeItem("selectedExamQuestions");
    }
  }
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
