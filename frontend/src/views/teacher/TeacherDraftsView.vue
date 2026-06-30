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
                class="text-yellow-500"
              >
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path
                  d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                />
              </svg>
              <h1 class="text-xl font-bold">My Drafts</h1>
            </div>
          </div>
          <router-link
            to="/teacher/create"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm flex items-center gap-2"
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
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            New Question
          </router-link>
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
          class="bg-slate-800 rounded-xl p-6 border border-slate-700"
        >
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <p class="text-white font-medium">{{ q.question }}</p>
              <div class="flex gap-2 mt-3">
                <span
                  class="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded text-xs"
                  >Draft</span
                >
                <span
                  class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300"
                  >{{ q.type }}</span
                >
                <span
                  class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400"
                  >{{ q.difficulty }}</span
                >
                <span
                  class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400"
                  >{{ q.gradeTitle }} - {{ q.subjectTitle }}</span
                >
              </div>
            </div>
            <div class="flex gap-2">
              <router-link
                :to="`/teacher/edit/${q.questionId}`"
                class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
              >
                Edit
              </router-link>
              <button
                @click="submitQuestion(q.questionId)"
                class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm"
              >
                Submit
              </button>
              <button
                @click="deleteQuestion(q.questionId)"
                class="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-slate-400 mb-4">No drafts yet</p>
        <router-link
          to="/teacher/create"
          class="text-violet-400 hover:text-violet-300"
        >
          Create your first question →
        </router-link>
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
import { teacherApi } from "../../services/teacher";
import { useToast } from "../../composables/useToast";

const { success, error: toastError } = useToast();

const questions = ref([]);
const loading = ref(true);
const page = ref(1);
const totalPages = ref(1);

onMounted(() => loadQuestions());

async function loadQuestions() {
  loading.value = true;
  try {
    const data = await teacherApi.listQuestions({
      status: "draft",
      page: page.value,
      limit: 10,
    });
    questions.value = data.questions || [];
    totalPages.value = data.totalPages || 1;
  } catch (e) {
    console.error("Failed to load drafts", e);
  } finally {
    loading.value = false;
  }
}

async function submitQuestion(questionId) {
  try {
    await teacherApi.submitQuestion(questionId);
    success("Question submitted for review!");
    loadQuestions();
  } catch (e) {
    console.error("Failed to submit", e);
    toastError("Failed to submit question");
  }
}

async function deleteQuestion(questionId) {
  if (!confirm("Delete this draft?")) return;
  try {
    await teacherApi.deleteQuestion(questionId);
    success("Draft deleted");
    loadQuestions();
  } catch (e) {
    console.error("Failed to delete", e);
    toastError("Failed to delete draft");
  }
}
</script>
