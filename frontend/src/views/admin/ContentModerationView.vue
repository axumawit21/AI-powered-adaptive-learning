<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <!-- Main Content -->
    <main class="ml-64 p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Content Moderation</h1>
        <div class="flex gap-3">
          <button
            v-if="selectedItems.length > 0"
            @click="bulkApprove"
            class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>✓</span> Approve Selected ({{ selectedItems.length }})
          </button>
          <button
            v-if="selectedItems.length > 0"
            @click="bulkSuspend"
            class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>✕</span> Suspend Selected
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-slate-400 text-sm font-bold uppercase mb-2">
            Pending Review
          </h3>
          <div class="text-3xl font-bold text-amber-400">
            {{ stats.totalPending }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-slate-400 text-sm font-bold uppercase mb-2">
            Approved
          </h3>
          <div class="text-3xl font-bold text-emerald-400">
            {{ stats.totalApproved }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-slate-400 text-sm font-bold uppercase mb-2">
            Suspended
          </h3>
          <div class="text-3xl font-bold text-red-400">
            {{ stats.totalSuspended }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-slate-400 text-sm font-bold uppercase mb-2">
            Total Content
          </h3>
          <div class="text-3xl font-bold text-cyan-400">
            {{
              stats.totalPending + stats.totalApproved + stats.totalSuspended
            }}
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">Filters</h3>
          <div class="text-sm text-slate-400">
            Filtered Results:
            <span class="text-cyan-400 font-bold">{{ pagination.total }}</span>
            items
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Status</label
            >
            <select
              v-model="filters.status"
              @change="fetchContent"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Content Type</label
            >
            <select
              v-model="filters.type"
              @change="fetchContent"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="question">Questions</option>
              <option value="summary">Summaries</option>
              <option value="presentation">Presentations</option>
              <option value="quiz">Quizzes</option>
            </select>
          </div>
          <div v-if="filters.type === 'question'">
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Question Type</label
            >
            <select
              v-model="filters.questionType"
              @change="fetchContent"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="true-false">True/False</option>
              <option value="fill-blank">Fill Blank</option>
              <option value="short-answer">Short Answer</option>
              <option value="matching">Matching</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Grade</label
            >
            <select
              v-model="filters.grade"
              @change="fetchContent"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Grades</option>
              <option v-for="g in grades" :key="g._id" :value="g.title">
                {{ g.title }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Subject</label
            >
            <select
              v-model="filters.subject"
              @change="fetchContent"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Subjects</option>
              <option v-for="s in subjects" :key="s._id" :value="s.title">
                {{ s.title }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Difficulty</label
            >
            <select
              v-model="filters.difficulty"
              @change="fetchContent"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Search</label
            >
            <input
              v-model="filters.search"
              @input="debouncedSearch"
              placeholder="Search content..."
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="resetFilters"
              class="w-full bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Content Table -->
      <div
        class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-750 border-b border-slate-700">
              <tr>
                <th class="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    @change="toggleSelectAll"
                    :checked="
                      selectedItems.length === content.length &&
                      content.length > 0
                    "
                    class="rounded bg-slate-700 border-slate-600"
                  />
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-bold text-slate-400"
                >
                  Content
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-bold text-slate-400"
                >
                  Type
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-bold text-slate-400"
                >
                  Subject / Unit
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-bold text-slate-400"
                >
                  Difficulty
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-bold text-slate-400"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-bold text-slate-400"
                >
                  Updated
                </th>
                <th
                  class="px-4 py-3 text-left text-sm font-bold text-slate-400"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in content"
                :key="item._id"
                class="border-b border-slate-700 hover:bg-slate-750 transition-colors"
              >
                <td class="px-4 py-4">
                  <input
                    type="checkbox"
                    :checked="selectedItems.includes(item._id)"
                    @change="toggleSelect(item._id)"
                    class="rounded bg-slate-700 border-slate-600"
                  />
                </td>
                <td class="px-4 py-4">
                  <div class="max-w-xs truncate font-medium">
                    {{ item.title }}
                  </div>
                  <div class="text-sm text-slate-500">{{ item.source }}</div>
                </td>
                <td class="px-4 py-4">
                  <span :class="getTypeBadgeClass(item.type)">
                    {{ getTypeLabel(item.type) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm">{{ item.subject }}</div>
                  <div class="text-sm text-slate-500">{{ item.unit }}</div>
                </td>
                <td class="px-4 py-4">
                  <span
                    v-if="item.difficulty"
                    :class="getDifficultyBadgeClass(item.difficulty)"
                  >
                    {{ item.difficulty }}
                  </span>
                  <span v-else class="text-slate-500">-</span>
                </td>
                <td class="px-4 py-4">
                  <span :class="getStatusBadgeClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm text-slate-400">
                  {{ formatDate(item.updatedAt) }}
                </td>
                <td class="px-4 py-4">
                  <div class="flex gap-2">
                    <button
                      @click="reviewContent(item)"
                      class="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Review
                    </button>
                    <button
                      v-if="item.status !== 'approved'"
                      @click="quickApprove(item)"
                      class="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      v-if="item.status !== 'suspended'"
                      @click="quickSuspend(item)"
                      class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="content.length === 0 && !loading">
                <td colspan="8" class="px-4 py-8 text-center text-slate-400">
                  No content found matching your filters.
                </td>
              </tr>
              <tr v-if="loading">
                <td colspan="8" class="px-4 py-8 text-center text-slate-400">
                  <div class="flex items-center justify-center gap-2">
                    <div
                      class="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"
                    ></div>
                    Loading content...
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="px-6 py-4 border-t border-slate-700 flex justify-between items-center"
        >
          <div class="text-sm text-slate-400">
            Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
            of {{ pagination.total }} items
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span class="px-3 py-1 text-slate-400">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <div
          class="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl"
        >
          <h2
            class="text-2xl font-bold mb-4"
            :class="
              confirmAction === 'approve' ? 'text-emerald-400' : 'text-red-400'
            "
          >
            {{
              confirmAction === "approve"
                ? "Approve Content"
                : "Suspend Content"
            }}
          </h2>
          <p class="text-slate-300 mb-6">
            Are you sure you want to {{ confirmAction }}
            <span v-if="confirmTarget === 'bulk'"
              >{{ selectedItems.length }} items</span
            >
            <span v-else>this content</span>?
          </p>
          <div class="mb-6">
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Comment (optional)</label
            >
            <textarea
              v-model="confirmComment"
              rows="3"
              placeholder="Add a reviewer comment..."
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            ></textarea>
          </div>
          <div class="flex gap-4">
            <button
              @click="cancelConfirm"
              class="flex-1 bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="executeConfirmAction"
              :class="
                confirmAction === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              "
              class="flex-1 px-4 py-2 rounded-lg transition-colors"
            >
              Confirm
              {{ confirmAction === "approve" ? "Approval" : "Suspension" }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import contentModerationService from "../../services/contentModeration";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const router = useRouter();

// State
const loading = ref(false);
const content = ref([]);
const grades = ref([]);
const subjects = ref([]);
const stats = ref({
  totalPending: 0,
  totalApproved: 0,
  totalSuspended: 0,
  byType: {},
});
const selectedItems = ref([]);
const filters = reactive({
  status: "",
  type: "",
  grade: "",
  subject: "",
  difficulty: "",
  search: "",
  questionType: "",
});
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
});

// Confirmation modal
const showConfirmModal = ref(false);
const confirmAction = ref("");
const confirmTarget = ref("");
const confirmItem = ref(null);
const confirmComment = ref("");

// Debounce search
let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchContent();
  }, 300);
};

// Fetch functions
async function fetchContent() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.grade && { grade: filters.grade }),
      ...(filters.subject && { subject: filters.subject }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.search && { search: filters.search }),
      ...(filters.questionType && { questionType: filters.questionType }),
    };

    const res = await contentModerationService.getContent(params);
    content.value = res.data.items || [];
    pagination.total = res.data.total || 0;
    pagination.totalPages = res.data.totalPages || 1;
  } catch (err) {
    console.error("Failed to fetch content:", err);
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res = await contentModerationService.getStats();
    stats.value = res.data;
  } catch (err) {
    console.error("Failed to fetch stats:", err);
  }
}

async function fetchGradesSubjects() {
  try {
    const [gradesRes, subjectsRes] = await Promise.all([
      axios.get("http://localhost:3000/grades"),
      axios.get("http://localhost:3000/subjects"),
    ]);
    grades.value = gradesRes.data;
    subjects.value = subjectsRes.data;
  } catch (err) {
    console.error("Failed to fetch grades/subjects:", err);
  }
}

// Selection
function toggleSelectAll(e) {
  if (e.target.checked) {
    selectedItems.value = content.value.map((item) => item._id);
  } else {
    selectedItems.value = [];
  }
}

function toggleSelect(id) {
  const index = selectedItems.value.indexOf(id);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(id);
  }
}

// Actions
function reviewContent(item) {
  router.push(`/admin/content-moderation/${item.type}/${item._id}`);
}

function quickApprove(item) {
  confirmAction.value = "approve";
  confirmTarget.value = "single";
  confirmItem.value = item;
  showConfirmModal.value = true;
}

function quickSuspend(item) {
  confirmAction.value = "suspend";
  confirmTarget.value = "single";
  confirmItem.value = item;
  showConfirmModal.value = true;
}

function bulkApprove() {
  confirmAction.value = "approve";
  confirmTarget.value = "bulk";
  showConfirmModal.value = true;
}

function bulkSuspend() {
  confirmAction.value = "suspend";
  confirmTarget.value = "bulk";
  showConfirmModal.value = true;
}

function cancelConfirm() {
  showConfirmModal.value = false;
  confirmAction.value = "";
  confirmTarget.value = "";
  confirmItem.value = null;
  confirmComment.value = "";
}

async function executeConfirmAction() {
  try {
    if (confirmTarget.value === "single" && confirmItem.value) {
      if (confirmAction.value === "approve") {
        await contentModerationService.approveContent(
          confirmItem.value.type,
          confirmItem.value._id,
          confirmComment.value,
        );
      } else {
        await contentModerationService.suspendContent(
          confirmItem.value.type,
          confirmItem.value._id,
          confirmComment.value,
        );
      }
    } else if (confirmTarget.value === "bulk") {
      // Group selected items by type
      const itemsByType = {};
      for (const id of selectedItems.value) {
        const item = content.value.find((c) => c._id === id);
        if (item) {
          if (!itemsByType[item.type]) {
            itemsByType[item.type] = [];
          }
          itemsByType[item.type].push(id);
        }
      }

      // Execute bulk action for each type
      for (const [type, ids] of Object.entries(itemsByType)) {
        if (confirmAction.value === "approve") {
          await contentModerationService.bulkApprove(type, ids);
        } else {
          await contentModerationService.bulkSuspend(type, ids);
        }
      }
      selectedItems.value = [];
    }

    cancelConfirm();
    fetchContent();
    fetchStats();
  } catch (err) {
    console.error("Failed to execute action:", err);
  }
}

// Pagination
function changePage(newPage) {
  if (newPage >= 1 && newPage <= pagination.totalPages) {
    pagination.page = newPage;
    fetchContent();
  }
}

// Reset filters
function resetFilters() {
  filters.status = "";
  filters.type = "";
  filters.grade = "";
  filters.subject = "";
  filters.difficulty = "";
  filters.search = "";
  filters.questionType = "";
  pagination.page = 1;
  fetchContent();
}

// Helper functions
function getTypeBadgeClass(type) {
  const classes = {
    question:
      "px-2 py-1 rounded text-xs font-bold bg-violet-600/20 text-violet-400",
    summary: "px-2 py-1 rounded text-xs font-bold bg-blue-600/20 text-blue-400",
    presentation:
      "px-2 py-1 rounded text-xs font-bold bg-orange-600/20 text-orange-400",
    quiz: "px-2 py-1 rounded text-xs font-bold bg-cyan-600/20 text-cyan-400",
  };
  return (
    classes[type] ||
    "px-2 py-1 rounded text-xs font-bold bg-slate-600/20 text-slate-400"
  );
}

function getTypeLabel(type) {
  const labels = {
    question: "Question",
    summary: "Summary",
    presentation: "PPT",
    quiz: "Quiz",
  };
  return labels[type] || type;
}

function getStatusBadgeClass(status) {
  const classes = {
    pending:
      "px-2 py-1 rounded text-xs font-bold bg-amber-600/20 text-amber-400",
    approved:
      "px-2 py-1 rounded text-xs font-bold bg-emerald-600/20 text-emerald-400",
    suspended: "px-2 py-1 rounded text-xs font-bold bg-red-600/20 text-red-400",
  };
  return (
    classes[status] ||
    "px-2 py-1 rounded text-xs font-bold bg-slate-600/20 text-slate-400"
  );
}

function getDifficultyBadgeClass(difficulty) {
  const classes = {
    easy: "px-2 py-1 rounded text-xs font-bold bg-emerald-600/20 text-emerald-400",
    medium:
      "px-2 py-1 rounded text-xs font-bold bg-amber-600/20 text-amber-400",
    hard: "px-2 py-1 rounded text-xs font-bold bg-red-600/20 text-red-400",
  };
  return (
    classes[difficulty] ||
    "px-2 py-1 rounded text-xs font-bold bg-slate-600/20 text-slate-400"
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
  delete axios.defaults.headers.common["Authorization"];
  router.push("/admin/login");
}

// Lifecycle
onMounted(() => {
  fetchContent();
  fetchStats();
  fetchGradesSubjects();
});
</script>

<style scoped>
.bg-slate-750 {
  background-color: rgb(41, 48, 66);
}
</style>
