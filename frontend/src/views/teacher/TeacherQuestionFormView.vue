<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Header -->
    <header
      class="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
            <router-link
              to="/teacher"
              class="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back</router-link
            >
            <span class="text-slate-600">|</span>
            <h1 class="text-xl font-bold">
              {{ isEditing ? "Edit Question" : "Create Questions" }}
            </h1>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Step Indicator -->
      <div class="flex items-center justify-center mb-8">
        <div v-for="(label, idx) in steps" :key="idx" class="flex items-center">
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              idx < step
                ? 'bg-green-600 text-white'
                : idx === step
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-400',
            ]"
          >
            {{ idx + 1 }}
          </div>
          <span
            v-if="idx < steps.length - 1"
            class="w-12 h-0.5 mx-2"
            :class="idx < step ? 'bg-green-600' : 'bg-slate-700'"
          ></span>
        </div>
      </div>
      <p class="text-center text-slate-400 mb-8">{{ steps[step] }}</p>

      <!-- Step 1: Select Grade & Subject -->
      <div
        v-if="step === 0"
        class="bg-slate-800 rounded-xl p-6 border border-slate-700"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-2"
              >Grade</label
            >
            <select
              v-model="form.gradeId"
              @change="onGradeChange"
              class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
            >
              <option value="">Select Grade</option>
              <option v-for="g in grades" :key="g._id" :value="g._id">
                {{ g.title }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-2"
              >Subject</label
            >
            <select
              v-model="form.subjectId"
              @change="onSubjectChange"
              class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
            >
              <option value="">Select Subject</option>
              <option v-for="s in subjects" :key="s._id" :value="s._id">
                {{ s.title }}
              </option>
            </select>
          </div>
        </div>
        <div class="mt-6">
          <label class="block text-sm font-bold text-slate-400 mb-2"
            >Unit</label
          >
          <select
            v-model="form.unitNumber"
            @change="onUnitChange"
            class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
          >
            <option value="">Select Unit</option>
            <option
              v-for="u in availableUnits"
              :key="u.unitNumber"
              :value="u.unitNumber"
            >
              Unit {{ u.unitNumber }}: {{ u.title }}
            </option>
          </select>
        </div>
        <!-- Subunit Selection (Optional) -->
        <div class="mt-6" v-if="availableSubunits.length > 0">
          <label class="block text-sm font-bold text-slate-400 mb-2"
            >Subunit
            <span class="text-slate-500 font-normal">(Optional)</span></label
          >
          <select
            v-model="form.subunitNumber"
            class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
          >
            <option value="">All Subunits (General)</option>
            <option
              v-for="su in availableSubunits"
              :key="su.subunitNumber"
              :value="su.subunitNumber"
            >
              {{ su.subunitNumber }}: {{ su.title }}
            </option>
          </select>
        </div>
      </div>

      <!-- Step 2: Question Type & Difficulty -->
      <div
        v-if="step === 1"
        class="bg-slate-800 rounded-xl p-6 border border-slate-700"
      >
        <!-- Number of Questions -->
        <div class="mb-6">
          <label class="block text-sm font-bold text-slate-400 mb-2"
            >Number of Questions</label
          >
          <input
            type="number"
            v-model.number="form.numberOfQuestions"
            min="1"
            max="20"
            class="w-32 bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-2"
              >Question Types
              <span class="text-slate-500 font-normal"
                >(select one or more)</span
              ></label
            >
            <div class="grid grid-cols-1 gap-2">
              <label
                v-for="t in questionTypes"
                :key="t.value"
                :class="[
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  form.types.includes(t.value)
                    ? 'border-violet-500 bg-violet-600/20'
                    : 'border-slate-600 hover:border-slate-500',
                ]"
              >
                <input
                  type="checkbox"
                  :value="t.value"
                  v-model="form.types"
                  class="w-5 h-5 text-violet-600 rounded"
                />
                <span class="text-xl" v-html="t.icon"></span>
                <span>{{ t.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-2"
              >Difficulty
              <span class="text-slate-500 font-normal"
                >(select one or more)</span
              ></label
            >
            <div class="flex flex-col gap-2">
              <label
                v-for="d in difficulties"
                :key="d.value"
                :class="[
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  form.difficulties.includes(d.value)
                    ? 'border-violet-500 bg-violet-600/20'
                    : 'border-slate-600 hover:border-slate-500',
                ]"
              >
                <input
                  type="checkbox"
                  :value="d.value"
                  v-model="form.difficulties"
                  class="w-5 h-5 text-violet-600 rounded"
                />
                <span :class="d.color">{{ d.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Question Content -->
      <div v-if="step === 2" class="space-y-6">
        <!-- AI Generate All Button -->
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold text-white">
            {{ questions.length }} Question{{ questions.length > 1 ? "s" : "" }}
            to Create
          </h2>
          <button
            @click="aiGenerateAll"
            :disabled="aiLoading"
            class="px-6 py-3 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
          >
            <svg
              v-if="!aiLoading"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3l2 5h5l-4 4 1.5 5-4.5-3.5-4.5 3.5 1.5-5-4-4h5z" />
            </svg>
            <span v-if="aiLoading" class="animate-spin">⏳</span>
            {{ aiLoading ? "Generating..." : "AI Generate All" }}
          </button>
        </div>

        <!-- Question Forms -->
        <div
          v-for="(q, idx) in questions"
          :key="idx"
          class="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <!-- Question Header -->
          <div
            class="flex justify-between items-center mb-4 pb-4 border-b border-slate-700"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg font-bold text-white"
                >Question {{ idx + 1 }} of {{ questions.length }}</span
              >
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="getTypeBadgeClass(q.type)"
              >
                {{ getTypeLabel(q.type) }}
              </span>
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="getDifficultyBadgeClass(q.difficulty)"
              >
                {{ q.difficulty }}
              </span>
            </div>
            <button
              @click="aiGenerateSingle(idx)"
              :disabled="aiLoading"
              class="px-4 py-2 bg-violet-700 hover:bg-violet-600 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 3l2 5h5l-4 4 1.5 5-4.5-3.5-4.5 3.5 1.5-5-4-4h5z" />
              </svg>
              AI Generate
            </button>
          </div>

          <!-- Question Text -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-slate-400 mb-2"
              >Question Text</label
            >
            <textarea
              v-model="q.question"
              rows="3"
              placeholder="Enter your question here..."
              class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
            ></textarea>
          </div>

          <!-- MCQ Options -->
          <div v-if="q.type === 'mcq'" class="space-y-3 mb-6">
            <label class="block text-sm font-bold text-slate-400 mb-2"
              >Options (mark correct answer)</label
            >
            <div
              v-for="(opt, optIdx) in q.options"
              :key="optIdx"
              class="flex items-center gap-3"
            >
              <input
                type="radio"
                :name="'correct-' + idx"
                :checked="q.answer === String.fromCharCode(65 + optIdx)"
                @change="q.answer = String.fromCharCode(65 + optIdx)"
                class="w-5 h-5 text-violet-600"
              />
              <input
                v-model="q.options[optIdx]"
                :placeholder="`Option ${String.fromCharCode(65 + optIdx)}`"
                class="flex-1 bg-slate-750 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          <!-- True/False -->
          <div v-if="q.type === 'true-false'" class="space-y-3 mb-6">
            <label class="block text-sm font-bold text-slate-400 mb-2"
              >Correct Answer</label
            >
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="q.answer"
                  value="true"
                  class="w-5 h-5 text-violet-600"
                />
                <span>True</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="q.answer"
                  value="false"
                  class="w-5 h-5 text-violet-600"
                />
                <span>False</span>
              </label>
            </div>
          </div>

          <!-- Fill Blank / Short Answer -->
          <div
            v-if="q.type === 'fill-blank' || q.type === 'short-answer'"
            class="space-y-3 mb-6"
          >
            <label class="block text-sm font-bold text-slate-400 mb-2"
              >Correct Answer</label
            >
            <input
              v-model="q.answer"
              placeholder="Enter the correct answer"
              class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <!-- Hint & Explanation -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-slate-400 mb-2"
                >Hint (shown on first wrong attempt)</label
              >
              <textarea
                v-model="q.hint"
                rows="2"
                placeholder="Provide a helpful hint..."
                class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-400 mb-2"
                >Explanation (shown after second wrong)</label
              >
              <textarea
                v-model="q.explanation"
                rows="2"
                placeholder="Explain the correct answer..."
                class="w-full bg-slate-750 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- AI Message -->
        <p v-if="aiMessage" class="text-sm text-cyan-400 text-center">
          {{ aiMessage }}
        </p>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between mt-8">
        <button
          v-if="step > 0"
          @click="step--"
          class="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Previous
        </button>
        <div class="flex-1"></div>
        <button
          v-if="step < steps.length - 1"
          @click="goToNextStep"
          :disabled="!canProceed"
          class="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Next
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        <div v-if="step === steps.length - 1" class="flex gap-3">
          <button
            @click="saveAsDraft"
            :disabled="saving"
            class="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg"
          >
            Save Drafts
          </button>
          <button
            @click="submitForReview"
            :disabled="saving || !isComplete"
            class="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg disabled:opacity-50"
          >
            {{ saving ? "Saving..." : "Submit All for Review" }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { teacherApi } from "../../services/teacher";
import { useToast } from "../../composables/useToast";

const route = useRoute();
const router = useRouter();
const { success, error: toastError } = useToast();

const isEditing = computed(() => !!route.params.questionId);
const step = ref(0);
const steps = [
  "Select Grade & Subject",
  "Choose Type & Difficulty",
  "Write Questions",
];

const grades = ref([]);
const subjects = ref([]);
const books = ref([]);
const saving = ref(false);
const aiLoading = ref(false);
const aiMessage = ref("");

// Form state for steps 1 & 2
const form = ref({
  gradeId: "",
  subjectId: "",
  unitNumber: "",
  unitTitle: "",
  subunitNumber: "",
  subunitTitle: "",
  numberOfQuestions: 5,
  types: ["mcq"], // Multi-select array
  difficulties: ["medium"], // Multi-select array
});

// Array of question forms for step 3
const questions = ref([]);

const questionTypes = [
  { value: "mcq", label: "Multiple Choice", icon: "🔘" },
  { value: "true-false", label: "True/False", icon: "✓✗" },
  { value: "fill-blank", label: "Fill in the Blank", icon: "___" },
  { value: "short-answer", label: "Short Answer", icon: "📝" },
];

const difficulties = [
  { value: "easy", label: "Easy", color: "text-green-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "hard", label: "Hard", color: "text-red-400" },
];

const availableUnits = computed(() => {
  const book = books.value.find(
    (b) =>
      b.grade?._id === form.value.gradeId &&
      b.subject?._id === form.value.subjectId,
  );
  return book?.units || [];
});

const availableSubunits = computed(() => {
  if (!form.value.unitNumber) return [];
  const unit = availableUnits.value.find(
    (u) => u.unitNumber === form.value.unitNumber,
  );
  return unit?.subChapters || [];
});

const canProceed = computed(() => {
  if (step.value === 0) {
    return form.value.gradeId && form.value.subjectId && form.value.unitNumber;
  }
  if (step.value === 1) {
    return (
      form.value.numberOfQuestions >= 1 &&
      form.value.types.length > 0 &&
      form.value.difficulties.length > 0
    );
  }
  return true;
});

const isComplete = computed(() => {
  return questions.value.every(
    (q) => q.question && q.answer && q.hint && q.explanation,
  );
});

onMounted(async () => {
  await loadData();
  if (route.params.questionId) {
    await loadQuestion(route.params.questionId);
  }
});

async function loadData() {
  try {
    const [gradesRes, subjectsRes, booksRes] = await Promise.all([
      axios.get("http://localhost:3000/grades"),
      axios.get("http://localhost:3000/subjects"),
      axios.get("http://localhost:3000/books"),
    ]);
    grades.value = gradesRes.data;
    subjects.value = subjectsRes.data;
    books.value = booksRes.data;
  } catch (e) {
    console.error("Failed to load data", e);
  }
}

async function loadQuestion(questionId) {
  try {
    const data = await teacherApi.getQuestion(questionId);
    form.value = {
      gradeId: data.gradeId,
      subjectId: data.subjectId,
      unitNumber: data.unitNumber,
      unitTitle: data.unitTitle,
      subunitNumber: data.subunitNumber || "",
      subunitTitle: data.subunitTitle || "",
      numberOfQuestions: 1,
      types: [data.type],
      difficulties: [data.difficulty],
    };
    questions.value = [
      {
        type: data.type,
        difficulty: data.difficulty,
        question: data.question,
        options: data.options || ["", "", "", ""],
        answer: data.answer,
        hint: data.hint,
        explanation: data.explanation,
      },
    ];
  } catch (e) {
    console.error("Failed to load question", e);
    toastError("Question not found");
    router.push("/teacher");
  }
}

function onGradeChange() {
  form.value.unitNumber = "";
  form.value.subunitNumber = "";
}

function onSubjectChange() {
  form.value.unitNumber = "";
  form.value.subunitNumber = "";
}

function onUnitChange() {
  form.value.subunitNumber = "";
  // Update unit title
  const selectedUnit = availableUnits.value.find(
    (u) => u.unitNumber === form.value.unitNumber,
  );
  form.value.unitTitle = selectedUnit?.title || "";
}

function goToNextStep() {
  if (step.value === 1) {
    // Generate question forms when moving from step 2 to step 3
    generateQuestionForms();
  }
  step.value++;
}

function generateQuestionForms() {
  const count = form.value.numberOfQuestions;
  const types = form.value.types;
  const diffs = form.value.difficulties;

  // Create combinations of type + difficulty
  const combinations = [];
  for (const t of types) {
    for (const d of diffs) {
      combinations.push({ type: t, difficulty: d });
    }
  }

  // Distribute questions across combinations
  questions.value = [];
  for (let i = 0; i < count; i++) {
    const combo = combinations[i % combinations.length];
    questions.value.push({
      type: combo.type,
      difficulty: combo.difficulty,
      question: "",
      options: combo.type === "mcq" ? ["", "", "", ""] : [],
      answer: "",
      hint: "",
      explanation: "",
    });
  }
}

function getTypeLabel(type) {
  const found = questionTypes.find((t) => t.value === type);
  return found ? found.label : type;
}

function getTypeBadgeClass(type) {
  const classes = {
    mcq: "bg-blue-600/30 text-blue-300",
    "true-false": "bg-green-600/30 text-green-300",
    "fill-blank": "bg-yellow-600/30 text-yellow-300",
    "short-answer": "bg-purple-600/30 text-purple-300",
  };
  return classes[type] || "bg-slate-600/30 text-slate-300";
}

function getDifficultyBadgeClass(difficulty) {
  const classes = {
    easy: "bg-green-600/30 text-green-300",
    medium: "bg-yellow-600/30 text-yellow-300",
    hard: "bg-red-600/30 text-red-300",
  };
  return classes[difficulty] || "bg-slate-600/30 text-slate-300";
}

async function saveAsDraft() {
  saving.value = true;
  try {
    const selectedUnit = availableUnits.value.find(
      (u) => u.unitNumber === form.value.unitNumber,
    );
    const selectedSubunit = availableSubunits.value.find(
      (su) => su.subunitNumber === form.value.subunitNumber,
    );

    for (const q of questions.value) {
      const payload = {
        gradeId: form.value.gradeId,
        subjectId: form.value.subjectId,
        unitNumber: form.value.unitNumber,
        unitTitle: selectedUnit?.title || `Unit ${form.value.unitNumber}`,
        subunitNumber: form.value.subunitNumber || undefined,
        subunitTitle: selectedSubunit?.title || undefined,
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        answer: q.answer,
        hint: q.hint,
        explanation: q.explanation,
        saveAsDraft: true,
      };

      if (isEditing.value && questions.value.length === 1) {
        await teacherApi.updateQuestion(route.params.questionId, payload);
      } else {
        await teacherApi.createQuestion(payload);
      }
    }

    success(`${questions.value.length} draft(s) saved!`);
    router.push("/teacher/drafts");
  } catch (e) {
    console.error("Failed to save", e);
    toastError("Failed to save drafts");
  } finally {
    saving.value = false;
  }
}

async function submitForReview() {
  saving.value = true;
  try {
    const selectedUnit = availableUnits.value.find(
      (u) => u.unitNumber === form.value.unitNumber,
    );
    const selectedSubunit = availableSubunits.value.find(
      (su) => su.subunitNumber === form.value.subunitNumber,
    );

    for (const q of questions.value) {
      const payload = {
        gradeId: form.value.gradeId,
        subjectId: form.value.subjectId,
        unitNumber: form.value.unitNumber,
        unitTitle: selectedUnit?.title || `Unit ${form.value.unitNumber}`,
        subunitNumber: form.value.subunitNumber || undefined,
        subunitTitle: selectedSubunit?.title || undefined,
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        answer: q.answer,
        hint: q.hint,
        explanation: q.explanation,
        saveAsDraft: true,
      };

      const created = await teacherApi.createQuestion(payload);
      await teacherApi.submitQuestion(created.questionId);
    }

    success(`${questions.value.length} question(s) submitted for review!`);
    router.push("/teacher/submitted");
  } catch (e) {
    console.error("Failed to submit", e);
    toastError("Failed to submit questions");
  } finally {
    saving.value = false;
  }
}

async function aiGenerateSingle(index) {
  const q = questions.value[index];
  aiLoading.value = true;
  aiMessage.value = "";

  try {
    const selectedUnit = availableUnits.value.find(
      (u) => u.unitNumber === form.value.unitNumber,
    );
    const selectedSubunit = availableSubunits.value.find(
      (su) => su.subunitNumber === form.value.subunitNumber,
    );

    const requestData = {
      gradeId: form.value.gradeId,
      subjectId: form.value.subjectId,
      unitNumber: form.value.unitNumber,
      unitTitle: selectedUnit?.title || "",
      subunitNumber: form.value.subunitNumber || undefined,
      subunitTitle: selectedSubunit?.title || undefined,
      type: q.type,
      difficulty: q.difficulty,
    };

    console.log("AI Generate Request:", requestData);

    const result = await teacherApi.generateFullQuestion(requestData);

    console.log("AI Generate Response:", result);

    if (result.question && result.question.trim()) {
      questions.value[index].question = result.question;
      questions.value[index].answer = result.answer || "";
      questions.value[index].hint = result.hint || "";
      questions.value[index].explanation = result.explanation || "";
      if (result.options && q.type === "mcq") {
        questions.value[index].options = result.options;
      }
      aiMessage.value = `Question ${index + 1} generated successfully!`;
    } else {
      console.warn("AI returned empty result:", result);
      toastError(`Failed to generate question ${index + 1}. Please try again.`);
      aiMessage.value = "AI returned empty content. Please try again.";
    }
  } catch (e) {
    console.error("AI generation failed:", e);
    console.error("Error details:", e.response?.data || e.message);
    toastError(
      "AI generation failed: " + (e.response?.data?.message || e.message),
    );
  } finally {
    aiLoading.value = false;
  }
}

async function aiGenerateAll() {
  aiLoading.value = true;
  aiMessage.value = "Generating all questions in one batch...";

  try {
    const selectedUnit = availableUnits.value.find(
      (u) => u.unitNumber === form.value.unitNumber,
    );
    const selectedSubunit = availableSubunits.value.find(
      (su) => su.subunitNumber === form.value.subunitNumber,
    );

    // Build batch request — all questions in 1 API call
    const batchData = {
      gradeId: form.value.gradeId,
      subjectId: form.value.subjectId,
      unitNumber: form.value.unitNumber,
      unitTitle: selectedUnit?.title || "",
      subunitNumber: form.value.subunitNumber || undefined,
      subunitTitle: selectedSubunit?.title || undefined,
      questions: questions.value.map((q) => ({
        type: q.type,
        difficulty: q.difficulty,
      })),
    };

    try {
      // Try batch endpoint first (1 API call for all questions)
      const results = await teacherApi.generateBatchQuestions(batchData);

      if (Array.isArray(results) && results.length > 0) {
        results.forEach((result, i) => {
          if (i < questions.value.length && result.question?.trim()) {
            questions.value[i].question = result.question;
            questions.value[i].answer = result.answer || "";
            questions.value[i].hint = result.hint || "";
            questions.value[i].explanation = result.explanation || "";
            if (result.options && questions.value[i].type === "mcq") {
              questions.value[i].options = result.options;
            }
          }
        });

        const generatedCount = questions.value.filter(
          (q) => q.question && q.question.trim(),
        ).length;

        if (generatedCount === questions.value.length) {
          aiMessage.value = `All ${questions.value.length} questions generated in 1 API call!`;
          success(`Generated ${questions.value.length} questions with AI!`);
        } else {
          aiMessage.value = `Generated ${generatedCount} of ${questions.value.length} questions.`;
        }
        return;
      }
    } catch (batchErr) {
      console.warn(
        "Batch generation failed, falling back to individual calls:",
        batchErr.message,
      );
      aiMessage.value = "Batch failed, generating individually...";
    }

    // Fallback: individual calls (if batch endpoint fails)
    for (let i = 0; i < questions.value.length; i++) {
      const q = questions.value[i];
      aiMessage.value = `Generating question ${i + 1} of ${questions.value.length}...`;

      try {
        const result = await teacherApi.generateFullQuestion({
          gradeId: form.value.gradeId,
          subjectId: form.value.subjectId,
          unitNumber: form.value.unitNumber,
          unitTitle: selectedUnit?.title || "",
          subunitNumber: form.value.subunitNumber || undefined,
          subunitTitle: selectedSubunit?.title || undefined,
          type: q.type,
          difficulty: q.difficulty,
        });

        if (result.question && result.question.trim()) {
          questions.value[i].question = result.question;
          questions.value[i].answer = result.answer || "";
          questions.value[i].hint = result.hint || "";
          questions.value[i].explanation = result.explanation || "";
          if (result.options && q.type === "mcq") {
            questions.value[i].options = result.options;
          }
        }
      } catch (e) {
        console.error(`Failed to generate question ${i + 1}:`, e.message);
      }
    }

    const generatedCount = questions.value.filter(
      (q) => q.question && q.question.trim(),
    ).length;
    if (generatedCount === questions.value.length) {
      aiMessage.value = `All ${questions.value.length} questions generated successfully!`;
      success(`Generated ${questions.value.length} questions with AI!`);
    } else if (generatedCount > 0) {
      aiMessage.value = `Generated ${generatedCount} of ${questions.value.length} questions. Some failed - try again for empty ones.`;
    } else {
      aiMessage.value = "AI generation failed. Please try again.";
      toastError("No questions were generated. Please try again.");
    }
  } catch (e) {
    console.error("AI generation failed", e);
    toastError("AI generation failed");
  } finally {
    aiLoading.value = false;
  }
}
</script>
