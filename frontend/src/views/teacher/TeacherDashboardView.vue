<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Header -->
    <header
      class="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
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
              class="text-cyan-400"
            >
              <path
                d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
              />
              <path d="M8 7h6" />
              <path d="M8 11h8" />
            </svg>
            <h1 class="text-xl font-bold">Teacher Dashboard</h1>
          </div>
          <div class="flex items-center gap-4">
            <button
              @click="loadData"
              :disabled="loading"
              class="text-sm text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
              title="Refresh data"
            >
              <svg
                v-if="!loading"
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
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              <svg
                v-else
                class="animate-spin"
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
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {{ loading ? "Refreshing..." : "Refresh" }}
            </button>

            <!-- Divider -->
            <div class="h-6 w-px bg-slate-700 mx-2"></div>

            <!-- Profile Section -->
            <div class="flex items-center gap-3">
              <div
                class="flex items-center gap-3 bg-slate-800/80 pl-1 pr-3 py-1 rounded-full border border-slate-700"
              >
                <div class="bg-cyan-500/20 text-cyan-400 p-1.5 rounded-full">
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
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span class="text-sm font-medium text-white">{{
                  user?.name || "Teacher"
                }}</span>
              </div>

              <button
                @click="logout"
                class="text-sm text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
                title="Logout"
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
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-400">Total Questions</p>
              <p class="text-3xl font-bold text-white mt-1">
                {{ stats.total || 0 }}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-600"
            >
              <path
                d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
              />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-400">Drafts</p>
              <p class="text-3xl font-bold text-yellow-500 mt-1">
                {{ stats.drafts || 0 }}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-600"
            >
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path
                d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
              />
            </svg>
          </div>
        </div>
        <router-link
          to="/teacher/submitted?status=pending"
          class="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-400">Pending Review</p>
              <p class="text-3xl font-bold text-cyan-500 mt-1">
                {{ stats.pending || 0 }}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-600"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </router-link>
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-400">Approved</p>
              <p class="text-3xl font-bold text-green-500 mt-1">
                {{ stats.approved || 0 }}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-600"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
        <!-- Pending Content Approvals -->
        <router-link
          to="/teacher/approvals"
          class="bg-slate-800 rounded-xl p-6 border border-amber-600/50 hover:border-amber-500 transition-colors cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-400">Content Approvals</p>
              <p class="text-3xl font-bold text-amber-400 mt-1">
                {{ pendingApprovals }}
              </p>
              <p
                class="text-xs text-amber-400/70 mt-1"
                v-if="pendingApprovals > 0"
              >
                Review needed →
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500/60"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
        </router-link>
      </div>

      <!-- Quick Actions -->
      <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
        <h2 class="text-lg font-bold mb-4">Quick Actions</h2>
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          <router-link
            to="/teacher/create"
            class="flex items-center gap-3 p-4 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
          >
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
              class="text-white"
            >
              <path d="M12 2v20" />
              <path d="M2 12h20" />
            </svg>
            <div>
              <p class="font-semibold">Create Question</p>
              <p class="text-sm text-violet-200">AI assisted</p>
            </div>
          </router-link>
          <router-link
            to="/teacher/drafts"
            class="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
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
              class="text-slate-300"
            >
              <path
                d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
              />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div>
              <p class="font-semibold">View Drafts</p>
              <p class="text-sm text-slate-400">Continue working</p>
            </div>
          </router-link>
          <router-link
            to="/teacher/submitted"
            class="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
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
              class="text-slate-300"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <div>
              <p class="font-semibold">Submissions</p>
              <p class="text-sm text-slate-400">Track status</p>
            </div>
          </router-link>
          <router-link
            to="/teacher/approvals"
            class="flex items-center gap-3 p-4 bg-amber-600/20 border border-amber-500/50 hover:bg-amber-600/30 rounded-lg transition-colors relative"
          >
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
              class="text-amber-400"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <div>
              <p class="font-semibold text-amber-300">Approvals</p>
              <p class="text-sm text-amber-400/70">Review content</p>
            </div>
            <span
              v-if="pendingApprovals > 0"
              class="absolute -top-2 -right-2 bg-amber-500 text-slate-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
              >{{ pendingApprovals }}</span
            >
          </router-link>
          <!-- Exam Bank -->
          <router-link
            to="/teacher/exam-bank"
            class="flex items-center gap-3 p-4 bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-600/30 rounded-lg transition-colors"
          >
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
              class="text-cyan-400"
            >
              <path
                d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
              />
              <path d="M8 7h6" />
              <path d="M8 11h8" />
            </svg>
            <div>
              <p class="font-semibold text-cyan-300">Exam Bank</p>
              <p class="text-sm text-cyan-400/70">My questions</p>
            </div>
          </router-link>
          <!-- My Exams -->
          <router-link
            to="/teacher/exams"
            class="flex items-center gap-3 p-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
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
              class="text-white"
            >
              <path
                d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
              />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <div>
              <p class="font-semibold">My Exams</p>
              <p class="text-sm text-emerald-200">Create & print</p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Recent Questions -->
      <div
        class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        <div
          class="p-4 border-b border-slate-700 flex justify-between items-center"
        >
          <h2 class="text-lg font-bold">Recent Questions</h2>
          <router-link
            to="/teacher/submitted"
            class="text-sm text-cyan-400 hover:text-cyan-300"
          >
            View All →
          </router-link>
        </div>

        <div v-if="loading" class="p-8 text-center text-slate-400">
          Loading questions...
        </div>

        <div
          v-else-if="recentQuestions.length"
          class="divide-y divide-slate-700"
        >
          <div
            v-for="q in recentQuestions"
            :key="q.questionId"
            @click="$router.push(`/teacher/question/${q.questionId}`)"
            class="p-4 hover:bg-slate-750 transition-colors flex justify-between items-center cursor-pointer group"
          >
            <div class="flex-1 min-w-0">
              <p class="text-white font-medium truncate">{{ q.question }}</p>
              <div class="flex gap-2 mt-2">
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
                  >{{ q.difficulty }}</span
                >
              </div>
            </div>
            <router-link
              :to="`/teacher/edit/${q.questionId}`"
              v-if="
                q.submissionStatus === 'draft' ||
                q.submissionStatus === 'rejected'
              "
              class="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              Edit →
            </router-link>
          </div>
        </div>

        <div v-else class="p-8 text-center text-slate-400">
          No questions yet. Create your first question!
        </div>
      </div>

      <!-- Rejected Questions Alert -->
      <div
        v-if="stats.rejected > 0"
        class="mt-6 bg-red-900/20 border border-red-800/50 rounded-xl p-4"
      >
        <div class="flex items-center gap-3">
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
            class="text-red-400"
          >
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p class="text-red-400 font-semibold">
              {{ stats.rejected }} question(s) need revision
            </p>
            <p class="text-sm text-slate-400">
              Check admin feedback and update your questions
            </p>
          </div>
          <router-link
            to="/teacher/submitted?status=rejected"
            class="ml-auto text-red-400 hover:text-red-300 text-sm"
          >
            View Rejected →
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { teacherApi } from "../../services/teacher";
import axios from "axios";

const router = useRouter();

// Get teacher from localStorage (like admin pattern)
const teacher = ref(JSON.parse(localStorage.getItem("teacher")) || null);
const user = teacher; // Alias for template compatibility

const stats = ref({});
const recentQuestions = ref([]);
const loading = ref(true);
const pendingApprovals = ref(0);

onMounted(async () => {
  // Set axios auth header from teacherToken
  const teacherToken = localStorage.getItem("teacherToken");
  if (teacherToken) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${teacherToken}`;
  }
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const token = localStorage.getItem("teacherToken");
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const [dashboardData, questionsData, approvalsRes] = await Promise.all([
      teacherApi.getDashboard(),
      teacherApi.listQuestions({ limit: 5 }),
      axios
        .get(`${API_BASE_URL}/teacher/approvals/count`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => ({ data: { total: 0 } })),
    ]);
    stats.value = dashboardData;
    recentQuestions.value = questionsData.questions || [];
    pendingApprovals.value = approvalsRes.data?.total || 0;
  } catch (e) {
    console.error("Failed to load dashboard data", e);
  } finally {
    loading.value = false;
  }
}

function logout() {
  // Clear teacher session (like admin)
  localStorage.removeItem("teacherToken");
  localStorage.removeItem("teacher");
  delete axios.defaults.headers.common["Authorization"];
  router.push("/teacher/login");
}

function statusClass(status) {
  switch (status) {
    case "draft":
      return "bg-yellow-600/20 text-yellow-400";
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
