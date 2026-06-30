<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <header
      class="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Dashboard</router-link
            >
            <span class="text-slate-600">|</span>
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-green-500"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <h1 class="text-xl font-bold">Submitted Questions</h1>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              v-for="s in statusFilters"
              :key="s.value"
              @click="
                filterStatus = s.value;
                loadQuestions();
              "
              :class="[
                'px-3 py-1 rounded-lg text-sm',
                filterStatus === s.value
                  ? 'bg-violet-600'
                  : 'bg-slate-700 hover:bg-slate-600',
              ]"
            >
              {{ s.label }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12 text-slate-400">
        Loading...
      </div>

      <div v-else-if="questions.length" class="space-y-4">
        <div
          v-for="q in questions"
          :key="q.questionId"
          @click="$router.push(`/teacher/question/${q.questionId}`)"
          class="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
        >
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <p class="text-white font-medium">{{ q.question }}</p>
              <div class="flex gap-2 mt-3">
                <span
                  :class="statusClass(q.submissionStatus)"
                  class="px-2 py-0.5 rounded text-xs"
                >
                  {{ q.submissionStatus }}
                </span>
                <span
                  class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300"
                  >{{ q.type }}</span
                >
                <span
                  class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400"
                  >{{ q.gradeTitle }} - {{ q.subjectTitle }}</span
                >
              </div>

              <!-- Admin Comments for rejected -->
              <div
                v-if="q.submissionStatus === 'rejected' && q.adminComments"
                class="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg"
              >
                <p class="text-sm text-red-400 font-semibold">
                  Admin Feedback:
                </p>
                <p class="text-sm text-slate-300 mt-1">{{ q.adminComments }}</p>
              </div>
            </div>

            <div class="flex gap-2">
              <router-link
                v-if="q.submissionStatus === 'rejected'"
                :to="`/teacher/edit/${q.questionId}`"
                class="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm"
              >
                Edit & Resubmit
              </router-link>
              <span
                v-if="q.submissionStatus === 'pending'"
                class="px-4 py-2 text-cyan-400 text-sm flex items-center gap-1"
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
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Under Review
              </span>
              <span
                v-if="q.submissionStatus === 'approved'"
                class="px-4 py-2 text-green-400 text-sm flex items-center gap-1"
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Published
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-slate-400">
          No {{ filterStatus || "" }} questions found
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
        <button
          @click="
            page--;
            loadQuestions();
          "
          :disabled="page <= 1"
          class="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span class="px-4 py-2 text-slate-400"
          >Page {{ page }} of {{ totalPages }}</span
        >
        <button
          @click="
            page++;
            loadQuestions();
          "
          :disabled="page >= totalPages"
          class="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { teacherApi } from "../../services/teacher";

const route = useRoute();

const questions = ref([]);
const loading = ref(true);
const page = ref(1);
const totalPages = ref(1);
const filterStatus = ref("");

const statusFilters = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

onMounted(() => {
  if (route.query.status) {
    filterStatus.value = route.query.status;
  }
  loadQuestions();
});

async function loadQuestions() {
  loading.value = true;
  try {
    const params = { page: page.value, limit: 10 };
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    const data = await teacherApi.listQuestions(params);
    // Filter out drafts - this view shows only submitted questions
    questions.value = (data.questions || []).filter(
      (q) => q.submissionStatus !== "draft",
    );
    totalPages.value = data.totalPages || 1;
  } catch (e) {
    console.error("Failed to load questions", e);
  } finally {
    loading.value = false;
  }
}

function statusClass(status) {
  switch (status) {
    case "pending":
      return "bg-cyan-600/20 text-cyan-400";
    case "approved":
      return "bg-green-600/20 text-green-400";
    case "rejected":
      return "bg-red-600/20 text-red-400";
    default:
      return "bg-slate-700 text-slate-300";
  }
}
</script>
