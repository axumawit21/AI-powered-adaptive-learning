<template>
  <div class="min-h-screen bg-slate-900 text-white">
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
          <h1 class="text-xl font-bold">Content Approvals</h1>
        </div>
        <button
          @click="fetchApprovals"
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
    </header>

    <main class="p-6">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Total Pending</div>
          <div class="text-2xl font-bold text-amber-400">{{ total }}</div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Questions</div>
          <div class="text-2xl font-bold text-cyan-400">
            {{ counts.questions }}
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Summaries</div>
          <div class="text-2xl font-bold text-purple-400">
            {{ counts.summaries }}
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Model Exams</div>
          <div class="text-2xl font-bold text-emerald-400">
            {{ counts.modelExams }}
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">{{ teacherGrade }}</div>
          <div class="text-lg font-medium text-sky-400">
            {{ teacherSubject }}
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 mb-6 border-b border-slate-700 pb-4">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="
            selectedTab = tab.value;
            page = 1;
            fetchApprovals();
          "
          :class="[
            'px-4 py-2 rounded-lg font-medium transition',
            selectedTab === tab.value
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
          ]"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="ml-1 text-xs opacity-70"
            >({{ tab.count }})</span
          >
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"
        ></div>
        <p class="text-slate-400">Loading pending approvals...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="items.length === 0"
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="text-xl font-semibold text-slate-400 mb-2">
          All Caught Up!
        </h3>
        <p class="text-slate-500">No content pending your approval</p>
      </div>

      <!-- Content List -->
      <div v-else class="space-y-4">
        <div
          v-for="item in items"
          :key="item._id || item.questionId"
          class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
        >
          <div class="p-6">
            <!-- Header with Content Type Badge -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-2">
                <span
                  :class="getContentTypeBadgeClass(item.contentType)"
                  class="px-2 py-1 text-xs rounded uppercase font-medium"
                >
                  {{ getContentTypeLabel(item.contentType) }}
                </span>
                <!-- Type/Difficulty badges for questions -->
                <template v-if="item.contentType === 'question'">
                  <span
                    class="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400"
                  >
                    {{ item.type?.toUpperCase() }}
                  </span>
                  <span
                    :class="getDifficultyClass(item.difficulty)"
                    class="px-2 py-1 text-xs rounded"
                  >
                    {{ item.difficulty }}
                  </span>
                </template>
              </div>
              <span class="text-xs text-slate-500">{{
                formatDate(item.createdAt)
              }}</span>
            </div>

            <!-- Title/Preview -->
            <h3 class="text-lg font-medium text-white mb-2">
              {{ item.title }}
            </h3>

            <!-- Content-specific details -->
            <template v-if="item.contentType === 'question'">
              <div class="text-sm text-slate-400 mb-2">
                Unit {{ item.unitNumber }}: {{ item.unitTitle }}
                <span v-if="item.subunitTitle"> → {{ item.subunitTitle }}</span>
              </div>
              <!-- Options for MCQ -->
              <div
                v-if="item.options && item.options.length"
                class="mb-4 space-y-2"
              >
                <div
                  v-for="(opt, idx) in item.options"
                  :key="idx"
                  class="px-4 py-2 bg-slate-700/50 rounded-lg text-sm"
                >
                  {{ opt }}
                </div>
              </div>
            </template>

            <template v-else-if="item.contentType === 'summary'">
              <div class="text-sm text-slate-400 mb-3">
                {{ item.grade }} • {{ item.subject }}
              </div>
              <p class="text-slate-300 text-sm mb-3">{{ item.preview }}</p>
              <div
                v-if="item.keyConcepts?.length"
                class="flex flex-wrap gap-2 mb-3"
              >
                <span
                  v-for="(concept, i) in item.keyConcepts.slice(0, 5)"
                  :key="i"
                  class="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded"
                >
                  {{ concept }}
                </span>
              </div>
            </template>

            <template v-else-if="item.contentType === 'model_exam'">
              <div class="text-sm text-slate-400 mb-3">
                {{ item.subjectTitle }} • {{ item.gradeTitle }}
              </div>
              <p class="text-slate-300 text-sm">{{ item.preview }}</p>
            </template>

            <!-- Expand/Details Toggle -->
            <div v-if="item.contentType === 'question'" class="mb-4">
              <button
                @click="toggleDetails(item._id || item.questionId)"
                class="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {{
                  expandedIds.includes(item._id || item.questionId)
                    ? "Hide Details"
                    : "Show Answer & Explanation"
                }}
                <svg
                  class="w-4 h-4 transition-transform"
                  :class="{
                    'rotate-180': expandedIds.includes(
                      item._id || item.questionId,
                    ),
                  }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                v-if="expandedIds.includes(item._id || item.questionId)"
                class="mt-3 space-y-3"
              >
                <div
                  class="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
                >
                  <div class="text-xs text-green-400 mb-1">ANSWER</div>
                  <div class="text-white">{{ item.answer }}</div>
                </div>
                <div
                  v-if="item.hint"
                  class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
                >
                  <div class="text-xs text-blue-400 mb-1">HINT</div>
                  <div class="text-slate-300">{{ item.hint }}</div>
                </div>
                <div
                  v-if="item.explanation"
                  class="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
                >
                  <div class="text-xs text-purple-400 mb-1">EXPLANATION</div>
                  <div class="text-slate-300">{{ item.explanation }}</div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-4 border-t border-slate-700">
              <div class="flex-1 flex gap-2">
                <button
                  @click="approveContent(item)"
                  :disabled="actionLoading === (item._id || item.questionId)"
                  class="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition disabled:opacity-50"
                >
                  <span v-if="actionLoading === (item._id || item.questionId)"
                    >...</span
                  >
                  <span v-else>✓ Approve</span>
                </button>
                <!-- Store to Exam Bank (questions only) -->
                <button
                  v-if="item.contentType === 'question'"
                  @click="storeToExamBank(item.questionId)"
                  :disabled="actionLoading === item.questionId"
                  class="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition disabled:opacity-50"
                  title="Save to your private exam bank"
                >
                  📝 Exam Bank
                </button>
              </div>
              <button
                @click="showRejectModal(item)"
                :disabled="actionLoading === (item._id || item.questionId)"
                class="px-4 py-2 bg-red-600/20 border border-red-500/50 hover:bg-red-600/40 text-red-400 rounded-lg font-medium transition disabled:opacity-50"
              >
                ✗ Reject
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
            fetchApprovals();
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

    <!-- Reject Modal -->
    <div
      v-if="rejectModalItem"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="rejectModalItem = null"
    >
      <div
        class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"
      >
        <h3 class="text-xl font-bold mb-4">
          Reject {{ getContentTypeLabel(rejectModalItem.contentType) }}
        </h3>
        <p class="text-slate-400 mb-4">
          Please provide a reason for rejection. This feedback will be sent to
          the admin.
        </p>
        <textarea
          v-model="rejectReason"
          class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 resize-none focus:outline-none focus:border-red-500"
          rows="4"
          placeholder="e.g., Content is inaccurate, needs revision..."
        ></textarea>
        <div class="flex gap-3 mt-4">
          <button
            @click="
              rejectModalItem = null;
              rejectReason = '';
            "
            class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
          >
            Cancel
          </button>
          <button
            @click="rejectContent()"
            :disabled="!rejectReason.trim() || actionLoading"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition disabled:opacity-50"
          >
            {{ actionLoading ? "Rejecting..." : "Submit Rejection" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useToast } from "../../composables/useToast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const toast = useToast();

// State
const items = ref([]);
const total = ref(0);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const actionLoading = ref(null);
const expandedIds = ref([]);
const selectedTab = ref("all");

// Counts by type
const counts = ref({ questions: 0, summaries: 0, modelExams: 0 });

// Teacher info
const teacherGrade = ref("Not set");
const teacherSubject = ref("Not set");

// Reject modal
const rejectModalItem = ref(null);
const rejectReason = ref("");

// Tabs
const tabs = computed(() => [
  { label: "All", value: "all", count: total.value },
  { label: "Questions", value: "question", count: counts.value.questions },
  { label: "Summaries", value: "summary", count: counts.value.summaries },
  { label: "Model Exams", value: "model_exam", count: counts.value.modelExams },
]);

// Helper functions
function getContentTypeBadgeClass(type) {
  switch (type) {
    case "question":
      return "bg-cyan-500/20 text-cyan-400";
    case "summary":
      return "bg-purple-500/20 text-purple-400";
    case "model_exam":
      return "bg-emerald-500/20 text-emerald-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
}

function getContentTypeLabel(type) {
  switch (type) {
    case "question":
      return "Question";
    case "summary":
      return "Summary";
    case "model_exam":
      return "Model Exam";
    default:
      return type;
  }
}

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

function toggleDetails(id) {
  if (expandedIds.value.includes(id)) {
    expandedIds.value = expandedIds.value.filter((x) => x !== id);
  } else {
    expandedIds.value.push(id);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString();
}

// API Functions
async function fetchApprovals() {
  loading.value = true;
  try {
    const token = localStorage.getItem("teacherToken");
    if (!token) {
      toast.error("Please login to view approvals");
      return;
    }

    const contentType =
      selectedTab.value !== "all" ? selectedTab.value : undefined;
    const url = `${API_BASE_URL}/teacher/approvals?page=${page.value}&limit=10${contentType ? `&contentType=${contentType}` : ""}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    items.value = res.data.items || [];
    total.value = res.data.total || 0;
    totalPages.value = res.data.totalPages || 1;

    if (res.data.counts) {
      counts.value = {
        questions: res.data.counts.questions || 0,
        summaries: res.data.counts.summaries || 0,
        modelExams: res.data.counts.modelExams || 0,
      };
    }

    // Update teacher grade/subject from API response
    if (res.data.teacherInfo) {
      teacherGrade.value = res.data.teacherInfo.gradeTitle || "Not set";
      teacherSubject.value = res.data.teacherInfo.subjectTitle || "Not set";
    }
  } catch (err) {
    console.error("Error fetching approvals:", err);
    toast.error(
      err.response?.data?.message || "Failed to load pending approvals",
    );
  } finally {
    loading.value = false;
  }
}

async function approveContent(item) {
  const itemId = item._id || item.questionId;
  actionLoading.value = itemId;
  try {
    const token = localStorage.getItem("teacherToken");
    await axios.post(
      `${API_BASE_URL}/teacher/approve/${itemId}`,
      { contentType: item.contentType },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    toast.success(`${getContentTypeLabel(item.contentType)} approved!`);
    items.value = items.value.filter((i) => (i._id || i.questionId) !== itemId);
    total.value--;
    if (
      counts.value[
        item.contentType === "model_exam"
          ? "modelExams"
          : item.contentType + "s"
      ]
    ) {
      counts.value[
        item.contentType === "model_exam"
          ? "modelExams"
          : item.contentType + "s"
      ]--;
    }
  } catch (err) {
    console.error("Error approving:", err);
    toast.error(err.response?.data?.message || "Failed to approve");
  } finally {
    actionLoading.value = null;
  }
}

async function storeToExamBank(questionId) {
  actionLoading.value = questionId;
  try {
    const token = localStorage.getItem("teacherToken");
    await axios.post(
      `${API_BASE_URL}/teacher/exam-bank/${questionId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    toast.success("Question stored in your Exam Bank!");
    items.value = items.value.filter((q) => q.questionId !== questionId);
    total.value--;
    counts.value.questions--;
  } catch (err) {
    console.error("Error storing to exam bank:", err);
    toast.error(err.response?.data?.message || "Failed to store question");
  } finally {
    actionLoading.value = null;
  }
}

function showRejectModal(item) {
  rejectModalItem.value = item;
  rejectReason.value = "";
}

async function rejectContent() {
  if (!rejectReason.value.trim()) {
    toast.error("Please provide a rejection reason");
    return;
  }

  const item = rejectModalItem.value;
  const itemId = item._id || item.questionId;
  actionLoading.value = itemId;

  try {
    const token = localStorage.getItem("teacherToken");
    await axios.post(
      `${API_BASE_URL}/teacher/reject/${itemId}`,
      { contentType: item.contentType, reason: rejectReason.value },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    toast.success("Content rejected with feedback");
    items.value = items.value.filter((i) => (i._id || i.questionId) !== itemId);
    total.value--;
    rejectModalItem.value = null;
    rejectReason.value = "";
  } catch (err) {
    console.error("Error rejecting:", err);
    toast.error(err.response?.data?.message || "Failed to reject");
  } finally {
    actionLoading.value = null;
  }
}

onMounted(fetchApprovals);
</script>
