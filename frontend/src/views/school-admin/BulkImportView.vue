<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <h1 class="text-3xl font-bold mb-8">Bulk Import Students</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Upload Section -->
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 class="text-xl font-semibold mb-4">Upload CSV File</h2>

          <div class="mb-6">
            <p class="text-slate-400 text-sm mb-4">
              Upload a CSV file with the following columns:
            </p>
            <div class="bg-slate-900 p-4 rounded-lg font-mono text-sm">
              <span class="text-teal-400">email</span>,
              <span class="text-emerald-400">name</span>,
              <span class="text-amber-400">password</span> (optional),
              <span class="text-violet-400">sectionName</span> (optional)
            </div>
          </div>

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
                selectedFile ? selectedFile.name : "Click or drag CSV file here"
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
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 class="text-xl font-semibold mb-4">Import Results</h2>

          <div v-if="!importResult" class="text-slate-400 text-center py-12">
            Upload a file to see import results
          </div>

          <div v-else>
            <!-- Summary -->
            <div class="grid grid-cols-3 gap-4 mb-6">
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

            <!-- Errors -->
            <div v-if="importResult.errors?.length > 0">
              <h3 class="text-sm font-medium text-slate-400 mb-2">Errors</h3>
              <div class="max-h-48 overflow-y-auto space-y-2">
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
        </div>
      </div>

      <!-- Sample CSV Download -->
      <div class="mt-6 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 class="text-xl font-semibold mb-4">Sample CSV</h2>
        <pre class="bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto">
email,name,password,sectionName
student1@school.com,John Doe,password123,10-A
student2@school.com,Jane Smith,,10-B
student3@school.com,Mike Johnson,secret123,11-A</pre
        >
        <button
          @click="downloadSampleCsv"
          class="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
        >
          Download Sample CSV
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { useToast } from "../../composables/useToast";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const toast = useToast();
const selectedFile = ref(null);
const dragActive = ref(false);
const uploading = ref(false);
const importResult = ref(null);

const schoolId = computed(() => {
  const admin = JSON.parse(localStorage.getItem("schoolAdmin") || "{}");
  return admin.schoolId;
});

const token = computed(() => localStorage.getItem("schoolAdminToken"));

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file && file.type === "text/csv") {
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
  if (!selectedFile.value || !schoolId.value) return;

  uploading.value = true;
  const formData = new FormData();
  formData.append("file", selectedFile.value);

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
  const csv = `email,name,password,sectionName
student1@school.com,John Doe,password123,10-A
student2@school.com,Jane Smith,,10-B
student3@school.com,Mike Johnson,secret123,11-A`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_students.csv";
  a.click();
  URL.revokeObjectURL(url);
}
</script>
