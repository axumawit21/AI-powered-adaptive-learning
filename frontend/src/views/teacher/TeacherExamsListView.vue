<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Header -->
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
          <h1 class="text-xl font-bold">📄 My Exams</h1>
        </div>
        <router-link
          to="/teacher/exams/new"
          class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Exam
        </router-link>
      </div>
    </header>

    <main class="p-6">
      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6">
        <select
          v-model="filters.examType"
          @change="fetchExams"
          class="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Types</option>
          <option value="quiz">Quiz</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
          <option value="assignment">Assignment</option>
        </select>
        <select
          v-model="filters.status"
          @change="fetchExams"
          class="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="finalized">Finalized</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"
        ></div>
        <p class="text-slate-400">Loading exams...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="exams.length === 0"
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 class="text-xl font-semibold text-slate-400 mb-2">No Exams Yet</h3>
        <p class="text-slate-500 mb-4">
          Create your first exam to get started.
        </p>
        <router-link
          to="/teacher/exams/new"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Exam
        </router-link>
      </div>

      <!-- Exams Grid -->
      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="exam in exams"
          :key="exam.examId"
          class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition"
        >
          <div class="p-5">
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-semibold text-lg text-white mb-1">
                  {{ exam.title }}
                </h3>
                <p class="text-sm text-slate-400">
                  {{ exam.gradeTitle }} • {{ exam.subjectTitle }}
                </p>
              </div>
              <span
                :class="getStatusClass(exam.status)"
                class="px-2 py-1 rounded text-xs font-medium"
              >
                {{ exam.status }}
              </span>
            </div>

            <!-- Exam Type Badge -->
            <div class="flex items-center gap-2 mb-4">
              <span
                :class="getTypeClass(exam.examType)"
                class="px-3 py-1 rounded-full text-xs font-medium uppercase"
              >
                {{ exam.examType }}
              </span>
              <span class="text-slate-500 text-sm"
                >{{ exam.questions?.length || 0 }} questions</span
              >
            </div>

            <!-- Stats -->
            <div
              class="grid grid-cols-3 gap-2 mb-4 py-3 bg-slate-900/50 rounded-lg"
            >
              <div class="text-center">
                <div class="text-lg font-bold text-white">
                  {{ exam.totalMarks }}
                </div>
                <div class="text-xs text-slate-500">Total Marks</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-white">
                  {{ exam.duration || "-" }}
                </div>
                <div class="text-xs text-slate-500">Minutes</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-white">
                  {{ exam.printCount || 0 }}
                </div>
                <div class="text-xs text-slate-500">Prints</div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-3 border-t border-slate-700">
              <router-link
                v-if="exam.status === 'draft'"
                :to="`/teacher/exams/${exam.examId}/edit`"
                class="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-center text-sm font-medium transition"
              >
                Edit
              </router-link>
              <button
                v-else
                @click="viewExam(exam.examId)"
                class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition"
              >
                View
              </button>
              <button
                @click="printExam(exam)"
                class="px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition"
                title="Print Exam"
              >
                🖨️
              </button>
              <button
                @click="confirmDuplicate(exam.examId)"
                class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                title="Duplicate"
              >
                📋
              </button>
              <button
                @click="confirmDelete(exam.examId)"
                class="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition"
                title="Delete"
              >
                🗑️
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
            fetchExams();
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

    <!-- Delete Modal -->
    <div
      v-if="deleteConfirmId"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="deleteConfirmId = null"
    >
      <div
        class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"
      >
        <h3 class="text-xl font-bold mb-4">Delete Exam?</h3>
        <p class="text-slate-400 mb-6">
          This action cannot be undone. The exam and all its data will be
          permanently deleted.
        </p>
        <div class="flex gap-3">
          <button
            @click="deleteConfirmId = null"
            class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
          >
            Cancel
          </button>
          <button
            @click="deleteExam"
            :disabled="actionLoading"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition disabled:opacity-50"
          >
            {{ actionLoading ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Print Modal -->
    <div
      v-if="printModalExam"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="printModalExam = null"
    >
      <div
        class="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-xl font-bold mb-4">Print Options</h3>

        <!-- School Info -->
        <div class="mb-4">
          <label class="block text-sm text-slate-400 mb-2">School Name</label>
          <input
            v-model="printOptions.schoolName"
            type="text"
            placeholder="Enter school name"
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm text-slate-400 mb-2">Date</label>
            <input
              v-model="printOptions.examDate"
              type="date"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-2"
              >Section/Class</label
            >
            <input
              v-model="printOptions.section"
              type="text"
              placeholder="e.g., Section A"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="printModalExam = null"
            class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
          >
            Cancel
          </button>
          <button
            @click="generatePrint"
            class="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition"
          >
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { teacherApi } from "../../services/teacher";
import { useToast } from "../../composables/useToast";

const router = useRouter();
const toast = useToast();

// Data
const exams = ref([]);
const total = ref(0);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const actionLoading = ref(false);

// Modals
const deleteConfirmId = ref(null);
const duplicateConfirmId = ref(null);
const printModalExam = ref(null);

// Print Options
const printOptions = reactive({
  schoolName: "",
  examDate: new Date().toISOString().split("T")[0],
  section: "",
});

// Filters
const filters = reactive({
  examType: "",
  status: "",
});

// Fetch exams
async function fetchExams() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: 12,
      ...(filters.examType && { examType: filters.examType }),
      ...(filters.status && { status: filters.status }),
    };

    const res = await teacherApi.listExams(params);
    exams.value = res.exams || [];
    total.value = res.total || 0;
    totalPages.value = res.totalPages || 1;
  } catch (err) {
    console.error("Error fetching exams:", err);
    toast.error(err.response?.data?.message || "Failed to load exams");
  } finally {
    loading.value = false;
  }
}

// View exam
function viewExam(examId) {
  router.push(`/teacher/exams/${examId}/edit`);
}

// Delete exam
function confirmDelete(examId) {
  deleteConfirmId.value = examId;
}

async function deleteExam() {
  if (!deleteConfirmId.value) return;

  actionLoading.value = true;
  try {
    await teacherApi.deleteExam(deleteConfirmId.value);
    toast.success("Exam deleted successfully");
    exams.value = exams.value.filter((e) => e.examId !== deleteConfirmId.value);
    deleteConfirmId.value = null;
  } catch (err) {
    console.error("Error deleting exam:", err);
    toast.error(err.response?.data?.message || "Failed to delete exam");
  } finally {
    actionLoading.value = false;
  }
}

// Duplicate exam
function confirmDuplicate(examId) {
  duplicateConfirmId.value = examId;
  duplicateExam();
}

async function duplicateExam() {
  if (!duplicateConfirmId.value) return;

  try {
    const newExam = await teacherApi.duplicateExam(duplicateConfirmId.value);
    toast.success("Exam duplicated successfully");
    exams.value.unshift(newExam);
    duplicateConfirmId.value = null;
  } catch (err) {
    console.error("Error duplicating exam:", err);
    toast.error(err.response?.data?.message || "Failed to duplicate exam");
  }
}

// Print
function printExam(exam) {
  printModalExam.value = exam;
  // Pre-fill school info if available
  if (exam.schoolInfo?.name) {
    printOptions.schoolName = exam.schoolInfo.name;
  }
}

function generatePrint() {
  const exam = printModalExam.value;
  if (!exam) return;

  // Create printable HTML
  const printContent = generatePrintableHTML(exam);

  // Open print window
  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);

  printModalExam.value = null;
  toast.success("Print preview opened");
}

function generatePrintableHTML(exam) {
  const questionsHTML =
    exam.questions
      ?.map(
        (q, idx) => `
    <div class="question" style="margin-bottom: 20px; page-break-inside: avoid;">
      <p style="margin: 0 0 8px 0;"><strong>${idx + 1}.</strong> ${q.question} <span style="float: right; color: #666;">(${q.marks} marks)</span></p>
      ${
        q.options?.length
          ? `
        <div style="margin-left: 20px;">
          ${q.options.map((opt) => `<p style="margin: 4px 0;">${opt}</p>`).join("")}
        </div>
      `
          : '<div style="margin-top: 40px; border-bottom: 1px solid #ccc;"></div>'
      }
    </div>
  `,
      )
      .join("") || "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${exam.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .exam-title { font-size: 20px; margin-bottom: 10px; }
        .exam-info { display: flex; justify-content: space-between; font-size: 14px; color: #666; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        ${printOptions.schoolName ? `<div class="school-name">${printOptions.schoolName}</div>` : ""}
        <div class="exam-title">${exam.title}</div>
        <div class="exam-info">
          <span>${exam.gradeTitle} - ${exam.subjectTitle}</span>
          <span>${printOptions.section ? `Section: ${printOptions.section} | ` : ""}Date: ${printOptions.examDate}</span>
          <span>Total Marks: ${exam.totalMarks}${exam.duration ? ` | Time: ${exam.duration} min` : ""}</span>
        </div>
      </div>
      ${exam.instructions ? `<p style="margin-bottom: 20px; padding: 10px; background: #f9f9f9; border-radius: 4px;"><strong>Instructions:</strong> ${exam.instructions}</p>` : ""}
      <div class="questions">${questionsHTML}</div>
    </body>
    </html>
  `;
}

// Helpers
function getStatusClass(status) {
  switch (status) {
    case "draft":
      return "bg-yellow-500/20 text-yellow-400";
    case "finalized":
      return "bg-green-500/20 text-green-400";
    case "archived":
      return "bg-slate-500/20 text-slate-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
}

function getTypeClass(type) {
  switch (type) {
    case "quiz":
      return "bg-cyan-500/20 text-cyan-400";
    case "midterm":
      return "bg-amber-500/20 text-amber-400";
    case "final":
      return "bg-red-500/20 text-red-400";
    case "assignment":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
}

onMounted(fetchExams);
</script>
