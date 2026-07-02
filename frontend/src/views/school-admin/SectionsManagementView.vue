<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <button
          @click="goToGrades"
          class="hover:text-white transition-colors"
          :class="{ 'text-white font-medium': viewMode === 'grades' }"
        >
          All Grades
        </button>
        <template v-if="viewMode === 'sections'">
          <span class="text-slate-600">›</span>
          <span class="text-white font-medium"
            >Grade {{ selectedGradeNumber }}</span
          >
        </template>
      </nav>

      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center gap-4">
          <button
            v-if="viewMode !== 'grades'"
            @click="goBack"
            class="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-3xl font-bold">
            <span v-if="viewMode === 'grades'">Sections Management</span>
            <span v-else>Grade {{ selectedGradeNumber }} - Sections</span>
          </h1>
        </div>
        <button
          v-if="viewMode === 'sections'"
          @click="showCreateModal = true"
          class="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
        >
          + Create Section
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"
        ></div>
      </div>

      <!-- Grade Cards View -->
      <div
        v-else-if="viewMode === 'grades'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="grade in displayGrades"
          :key="grade._id"
          @click="selectGrade(grade)"
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-violet-500 cursor-pointer transition-all hover:scale-105"
        >
          <div class="flex items-center justify-center mb-4">
            <div
              class="w-16 h-16 rounded-full bg-linear-to-br from-violet-400 to-purple-500 flex items-center justify-center"
            >
              <span class="text-2xl font-bold">{{ grade.gradeNumber }}</span>
            </div>
          </div>
          <h3 class="text-xl font-bold text-center mb-2">
            Grade {{ grade.gradeNumber }}
          </h3>
          <p class="text-slate-400 text-center text-sm">
            {{ getSectionsForGrade(grade._id).length }} sections
          </p>
        </div>
      </div>

      <!-- Sections Grid -->
      <div
        v-else-if="
          viewMode === 'sections' && sectionsForSelectedGrade.length > 0
        "
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="section in sectionsForSelectedGrade"
          :key="section._id"
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-teal-500 transition-colors"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-teal-400">{{ section.name }}</h3>
            <button
              @click="deleteSection(section._id)"
              class="text-red-400 hover:text-red-300 text-sm px-2 py-1 border border-red-400/30 rounded"
            >
              Delete
            </button>
          </div>
          <div class="text-slate-400 text-sm space-y-1 mb-4">
            <p>Grade: {{ section.gradeId?.title || "N/A" }}</p>
            <p>
              Homeroom: {{ section.homeroomTeacherId?.name || "Not assigned" }}
            </p>
          </div>
          <div class="flex gap-2">
            <router-link
              :to="`/school-admin/students?section=${section._id}`"
              class="flex-1 text-center px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
            >
              View Students
            </router-link>
            <button
              @click="openBulkImport(section)"
              class="flex-1 text-center px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm"
            >
              Import Students
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="viewMode === 'sections'"
        class="bg-slate-800 p-12 rounded-xl border border-slate-700 text-center"
      >
        <p class="text-slate-400 mb-4">
          No sections created for Grade {{ selectedGradeNumber }} yet.
        </p>
        <button
          @click="showCreateModal = true"
          class="px-6 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
        >
          Create Your First Section
        </button>
      </div>

      <!-- Create Section Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showCreateModal = false"
      >
        <div
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md"
        >
          <h2 class="text-xl font-bold mb-4">Create Section</h2>
          <form @submit.prevent="createSection" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >Section Name</label
              >
              <input
                v-model="newSection.name"
                type="text"
                required
                placeholder="e.g., 10-A"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >Grade</label
              >
              <select
                v-model="newSection.gradeId"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Select Grade</option>
                <option
                  v-for="grade in displayGrades"
                  :key="grade._id"
                  :value="grade._id"
                  :selected="grade._id === selectedGradeId"
                >
                  Grade {{ grade.gradeNumber }}
                </option>
              </select>
            </div>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="showCreateModal = false"
                class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
              >
                {{ creating ? "Creating..." : "Create" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Bulk Import Modal -->
      <div
        v-if="showBulkImportModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="closeBulkImport"
      >
        <div
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold">
              Import Students to {{ importTargetSection?.name }}
            </h2>
            <button
              @click="closeBulkImport"
              class="text-slate-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <!-- Upload Section -->
            <div>
              <p class="text-slate-400 text-sm mb-4">
                Upload a CSV file with the following columns:
              </p>
              <div class="bg-slate-900 p-4 rounded-lg font-mono text-sm mb-4">
                <span class="text-teal-400">email</span>,
                <span class="text-emerald-400">name</span>,
                <span class="text-amber-400">password</span> (optional)
              </div>
              <p class="text-slate-500 text-xs mb-4">
                Students will be automatically assigned to section:
                <span class="text-teal-400 font-medium">{{
                  importTargetSection?.name
                }}</span>
              </p>

              <div
                @drop.prevent="handleDrop"
                @dragover.prevent
                @dragenter.prevent="dragActive = true"
                @dragleave="dragActive = false"
                :class="[
                  'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                  dragActive
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-600 hover:border-slate-500',
                ]"
                @click="$refs.fileInput.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept=".csv"
                  class="hidden"
                  @change="handleFileSelect"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-12 h-12 mx-auto mb-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p class="text-slate-400">
                  {{
                    selectedFile
                      ? selectedFile.name
                      : "Click or drag CSV file here"
                  }}
                </p>
              </div>

              <button
                @click="uploadFile"
                :disabled="!selectedFile || uploading"
                class="mt-4 w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ uploading ? "Uploading..." : "Upload & Import" }}
              </button>
            </div>

            <!-- Results Section -->
            <div v-if="importResult" class="border-t border-slate-700 pt-6">
              <h3 class="text-lg font-semibold mb-4">Import Results</h3>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                  <div class="text-2xl font-bold text-slate-300">
                    {{ importResult.total }}
                  </div>
                  <div class="text-xs text-slate-400">Total</div>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                  <div class="text-2xl font-bold text-emerald-400">
                    {{ importResult.successful }}
                  </div>
                  <div class="text-xs text-slate-400">Successful</div>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg text-center">
                  <div class="text-2xl font-bold text-red-400">
                    {{ importResult.failed }}
                  </div>
                  <div class="text-xs text-slate-400">Failed</div>
                </div>
              </div>

              <div v-if="importResult.errors?.length > 0">
                <h4 class="text-sm font-medium text-slate-400 mb-2">Errors</h4>
                <div class="max-h-32 overflow-y-auto space-y-2">
                  <div
                    v-for="error in importResult.errors"
                    :key="error.row"
                    class="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm"
                  >
                    <span class="text-red-400">Row {{ error.row }}:</span>
                    <span class="text-slate-300 ml-2">{{ error.email }}</span>
                    <span class="text-slate-400 ml-2">- {{ error.error }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sample CSV -->
            <div class="border-t border-slate-700 pt-6">
              <h3 class="text-sm font-medium text-slate-400 mb-2">
                Sample CSV Format
              </h3>
              <pre
                class="bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto text-slate-400"
              >
email,name,password
student1@school.com,John Doe,password123
student2@school.com,Jane Smith,</pre
              >
              <button
                @click="downloadSampleCsv"
                class="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
              >
                Download Sample CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useToast } from "../../composables/useToast";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const toast = useToast();
const loading = ref(true);
const sections = ref([]);
const grades = ref([]);
const showCreateModal = ref(false);
const creating = ref(false);
const newSection = ref({ name: "", gradeId: "" });

// View state
const viewMode = ref("grades"); // 'grades' | 'sections'
const selectedGradeId = ref(null);

// Bulk import state
const showBulkImportModal = ref(false);
const importTargetSection = ref(null);
const selectedFile = ref(null);
const dragActive = ref(false);
const uploading = ref(false);
const importResult = ref(null);

const schoolId = computed(() => {
  const admin = JSON.parse(localStorage.getItem("schoolAdmin") || "{}");
  return admin.schoolId;
});

const token = computed(() => localStorage.getItem("schoolAdminToken"));

// Filter grades to show only 9, 10, 11, 12
const displayGrades = computed(() => {
  return grades.value
    .filter((g) => {
      const num = parseInt(g.title?.replace(/\D/g, "") || g.gradeNumber || "0");
      return num >= 9 && num <= 12;
    })
    .map((g) => ({
      ...g,
      gradeNumber: parseInt(
        g.title?.replace(/\D/g, "") || g.gradeNumber || "0",
      ),
    }))
    .sort((a, b) => a.gradeNumber - b.gradeNumber);
});

const selectedGradeNumber = computed(() => {
  if (!selectedGradeId.value) return "";
  const grade = displayGrades.value.find(
    (g) => g._id === selectedGradeId.value,
  );
  return grade?.gradeNumber || "";
});

const sectionsForSelectedGrade = computed(() => {
  if (!selectedGradeId.value) return [];
  return sections.value.filter(
    (s) =>
      s.gradeId?._id === selectedGradeId.value ||
      s.gradeId === selectedGradeId.value,
  );
});

function getSectionsForGrade(gradeId) {
  return sections.value.filter(
    (s) => s.gradeId?._id === gradeId || s.gradeId === gradeId,
  );
}

function selectGrade(grade) {
  selectedGradeId.value = grade._id;
  newSection.value.gradeId = grade._id; // Pre-fill for create modal
  viewMode.value = "sections";
}

function goBack() {
  if (viewMode.value === "sections") {
    viewMode.value = "grades";
    selectedGradeId.value = null;
  }
}

function goToGrades() {
  viewMode.value = "grades";
  selectedGradeId.value = null;
}

// Bulk Import Functions
function openBulkImport(section) {
  importTargetSection.value = section;
  showBulkImportModal.value = true;
  selectedFile.value = null;
  importResult.value = null;
}

function closeBulkImport() {
  showBulkImportModal.value = false;
  importTargetSection.value = null;
  selectedFile.value = null;
  importResult.value = null;
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
    selectedFile.value = file;
  } else {
    toast.error("Please select a CSV file");
  }
}

function handleDrop(event) {
  dragActive.value = false;
  const file = event.dataTransfer.files[0];
  if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
    selectedFile.value = file;
  } else {
    toast.error("Please drop a CSV file");
  }
}

async function uploadFile() {
  if (!selectedFile.value || !schoolId.value || !importTargetSection.value)
    return;

  uploading.value = true;
  const formData = new FormData();
  formData.append("file", selectedFile.value);
  formData.append("sectionId", importTargetSection.value._id);

  try {
    const res = await axios.post(
      `/schools/${schoolId.value}/students/bulk-import-csv`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    importResult.value = res.data;
    if (res.data.successful > 0) {
      toast.success(`Successfully imported ${res.data.successful} students`);
    }
    if (res.data.failed > 0) {
      toast.warning(`${res.data.failed} students failed to import`);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || "Import failed");
    importResult.value = null;
  } finally {
    uploading.value = false;
    selectedFile.value = null;
  }
}

function downloadSampleCsv() {
  const csv = `email,name,password
student1@school.com,John Doe,password123
student2@school.com,Jane Smith,`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_students.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchSections() {
  if (!schoolId.value) return;
  try {
    const res = await axios.get(
      `/schools/${schoolId.value}/sections`,
      { headers: { Authorization: `Bearer ${token.value}` } },
    );
    sections.value = res.data;
  } catch (err) {
    console.error("Failed to fetch sections:", err);
    toast.error("Failed to load sections");
  } finally {
    loading.value = false;
  }
}

async function fetchGrades() {
  try {
    const res = await axios.get("/grades");
    grades.value = res.data;
  } catch (err) {
    console.error("Failed to fetch grades:", err);
  }
}

async function createSection() {
  if (!schoolId.value) return;
  creating.value = true;
  try {
    await axios.post(
      `/schools/${schoolId.value}/sections`,
      { name: newSection.value.name, gradeId: newSection.value.gradeId },
      { headers: { Authorization: `Bearer ${token.value}` } },
    );
    toast.success("Section created successfully");
    showCreateModal.value = false;
    newSection.value = { name: "", gradeId: selectedGradeId.value || "" };
    fetchSections();
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to create section");
  } finally {
    creating.value = false;
  }
}

async function deleteSection(id) {
  if (!confirm("Are you sure you want to delete this section?")) return;
  try {
    await axios.delete(`/schools/sections/${id}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    toast.success("Section deleted");
    fetchSections();
  } catch (err) {
    toast.error("Failed to delete section");
  }
}

onMounted(() => {
  fetchGrades();
  fetchSections();
});
</script>
