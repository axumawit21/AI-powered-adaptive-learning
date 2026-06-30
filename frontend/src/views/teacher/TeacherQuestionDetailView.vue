<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Header -->
    <header
      class="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
            <button
              @click="$router.back()"
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
              Back
            </button>
            <span class="text-slate-600">|</span>
            <h1 class="text-xl font-bold">Question Details</h1>
          </div>
          <div class="flex gap-3">
            <router-link
              v-if="
                question &&
                (question.submissionStatus === 'draft' ||
                  question.submissionStatus === 'rejected')
              "
              :to="`/teacher/edit/${question.questionId}`"
              class="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm flex items-center gap-2 transition-colors"
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
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                />
              </svg>
              Edit
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <main
      v-if="question"
      class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <!-- Status Card -->
      <div
        class="bg-slate-800 rounded-xl p-6 border border-slate-700 flex justify-between items-center"
      >
        <div>
          <h2 class="text-lg font-bold">Status</h2>
          <p class="text-slate-400 text-sm">Current state of this question</p>
        </div>
        <span
          class="px-3 py-1.5 rounded-full text-sm font-bold capitalize"
          :class="statusClass(question.submissionStatus)"
        >
          {{ question.submissionStatus }}
        </span>
      </div>

      <!-- Admin Comments (if Rejected) -->
      <div
        v-if="
          question.submissionStatus === 'rejected' && question.adminComments
        "
        class="bg-red-900/20 border border-red-800/50 rounded-xl p-6"
      >
        <h3 class="text-red-400 font-bold mb-2 flex items-center gap-2">
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
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Admin Feedback
        </h3>
        <p class="text-slate-300">{{ question.adminComments }}</p>
      </div>

      <!-- Metadata -->
      <div
        class="bg-slate-800 rounded-xl p-6 border border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        <div>
          <labal class="block text-xs font-bold text-slate-500 uppercase mb-1"
            >Grade</labal
          >
          <p>{{ question.gradeTitle }}</p>
        </div>
        <div>
          <labal class="block text-xs font-bold text-slate-500 uppercase mb-1"
            >Subject</labal
          >
          <p>{{ question.subjectTitle }}</p>
        </div>
        <div>
          <labal class="block text-xs font-bold text-slate-500 uppercase mb-1"
            >Unit</labal
          >
          <p>Unit {{ question.unitNumber }}</p>
        </div>
        <div v-if="question.subunitNumber">
          <labal class="block text-xs font-bold text-slate-500 uppercase mb-1"
            >Subunit</labal
          >
          <p>{{ question.subunitNumber }}</p>
        </div>
        <div>
          <labal class="block text-xs font-bold text-slate-500 uppercase mb-1"
            >Type</labal
          >
          <p class="capitalize">{{ getTypeLabel(question.type) }}</p>
        </div>
        <div>
          <labal class="block text-xs font-bold text-slate-500 uppercase mb-1"
            >Difficulty</labal
          >
          <p class="capitalize flex items-center gap-2">
            <span :class="getDifficultyColor(question.difficulty)">●</span>
            {{ question.difficulty }}
          </p>
        </div>
      </div>

      <!-- Question Content -->
      <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 class="text-sm font-bold text-slate-500 uppercase mb-4">
          Question Text
        </h3>
        <div
          class="text-lg bg-slate-900/50 p-4 rounded-lg border border-slate-700/50"
        >
          {{ question.question }}
        </div>

        <!-- Options for MCQ -->
        <div v-if="question.type === 'mcq'" class="mt-6 space-y-3">
          <h3 class="text-sm font-bold text-slate-500 uppercase mb-2">
            Options
          </h3>
          <div
            v-for="(opt, idx) in question.options"
            :key="idx"
            class="flex items-center gap-4 p-3 rounded-lg border transition-colors"
            :class="getOptionClass(opt, idx, question.answer)"
          >
            <span
              class="w-8 h-8 flex items-center justify-center rounded-full font-bold bg-slate-700 text-slate-300"
            >
              {{ String.fromCharCode(65 + idx) }}
            </span>
            <span class="flex-1">{{ opt }}</span>
            <span
              v-if="question.answer === String.fromCharCode(65 + idx)"
              class="text-green-400 font-bold text-sm flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Correct Answer
            </span>
          </div>
        </div>

        <!-- True/False Answer -->
        <div v-else-if="question.type === 'true-false'" class="mt-6">
          <h3 class="text-sm font-bold text-slate-500 uppercase mb-2">
            Answer
          </h3>
          <div class="flex gap-4">
            <div
              class="px-4 py-2 rounded-lg border border-slate-600 bg-slate-700/50"
              :class="{
                'border-green-500 bg-green-500/10 text-green-400':
                  question.answer === 'true',
              }"
            >
              True
            </div>
            <div
              class="px-4 py-2 rounded-lg border border-slate-600 bg-slate-700/50"
              :class="{
                'border-green-500 bg-green-500/10 text-green-400':
                  question.answer === 'false',
              }"
            >
              False
            </div>
          </div>
        </div>

        <!-- Other Answers -->
        <div v-else class="mt-6">
          <h3 class="text-sm font-bold text-slate-500 uppercase mb-2">
            Answer
          </h3>
          <div
            class="text-lg bg-green-900/10 border border-green-800/50 text-green-400 p-4 rounded-lg"
          >
            {{ question.answer }}
          </div>
        </div>
      </div>

      <!-- Explanations -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3
            class="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"
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
              class="text-yellow-400"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Hint
          </h3>
          <p class="text-slate-300 italic">{{ question.hint }}</p>
        </div>
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3
            class="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"
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
              class="text-cyan-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Explanation
          </h3>
          <p class="text-slate-300">{{ question.explanation }}</p>
        </div>
      </div>
    </main>

    <div
      v-else-if="loading"
      class="min-h-[50vh] flex items-center justify-center text-slate-400"
    >
      <svg
        class="animate-spin h-8 w-8 text-violet-500 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { teacherApi } from "../../services/teacher";
import { useToast } from "../../composables/useToast";

const route = useRoute();
const router = useRouter();
const { error: toastError } = useToast();

const question = ref(null);
const loading = ref(true);

onMounted(async () => {
  if (route.params.questionId) {
    await loadQuestion(route.params.questionId);
  }
});

async function loadQuestion(id) {
  loading.value = true;
  try {
    question.value = await teacherApi.getQuestion(id);
  } catch (e) {
    console.error(e);
    toastError("Failed to load question");
    router.push("/teacher");
  } finally {
    loading.value = false;
  }
}

function statusClass(status) {
  switch (status) {
    case "draft":
      return "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30";
    case "pending":
      return "bg-cyan-600/20 text-cyan-400 border border-cyan-600/30";
    case "approved":
      return "bg-green-600/20 text-green-400 border border-green-600/30";
    case "rejected":
      return "bg-red-600/20 text-red-400 border border-red-600/30";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

function getDifficultyColor(diff) {
  switch (diff) {
    case "easy":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "hard":
      return "text-red-500";
    default:
      return "text-slate-500";
  }
}

function getTypeLabel(type) {
  const types = {
    mcq: "Multiple Choice",
    "true-false": "True/False",
    "fill-blank": "Fill in the Blank",
    "short-answer": "Short Answer",
  };
  return types[type] || type;
}

function getOptionClass(opt, idx, answer) {
  if (answer === String.fromCharCode(65 + idx)) {
    return "bg-green-900/20 border-green-500/50 ring-1 ring-green-500/50";
  }
  return "bg-slate-750 border-slate-600 opacity-70";
}
</script>
