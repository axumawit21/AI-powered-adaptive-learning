<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Books Management</h1>
        <div class="flex items-center gap-4">
          <!-- Grade Filter -->
          <select
            v-model="selectedGrade"
            class="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Grades</option>
            <option v-for="g in grades" :key="g._id" :value="g._id">
              {{ g.title }}
            </option>
          </select>

          <button
            @click="showModal = true"
            class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
          >
            + Add Book
          </button>
        </div>
      </div>

      <div
        class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        <table class="w-full">
          <thead class="bg-slate-700">
            <tr>
              <th class="text-left px-6 py-4">Grade</th>
              <th class="text-left px-6 py-4">Subject</th>
              <th class="text-left px-6 py-4">Units</th>
              <th class="text-left px-6 py-4">Status</th>
              <th class="text-left px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="book in filteredAndSortedBooks"
              :key="book._id"
              class="border-t border-slate-700"
            >
              <td class="px-6 py-4">{{ book.grade?.title || book.grade }}</td>
              <td class="px-6 py-4">
                {{ book.subject?.title || book.subject }}
              </td>
              <td class="px-6 py-4">{{ book.units?.length || 0 }} units</td>
              <td class="px-6 py-4">
                <span
                  v-if="book.isPreprocessed"
                  class="text-emerald-400 text-sm"
                  >✓ Preprocessed</span
                >
                <span v-else class="text-slate-500 text-sm"
                  >Not preprocessed</span
                >
              </td>
              <td class="px-6 py-4 space-x-2">
                <router-link
                  :to="`/admin/units?bookId=${book._id}`"
                  class="text-cyan-400 hover:text-cyan-300"
                  >Manage Units</router-link
                >
                <button
                  @click="initiatePreprocess(book)"
                  :disabled="processingBooks.has(book._id)"
                  class="text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{
                    processingBooks.has(book._id)
                      ? "Processing..."
                      : book.isPreprocessed
                        ? "Update Data"
                        : "Preprocess"
                  }}
                </button>
                <button
                  @click="confirmDelete(book._id)"
                  class="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div
          class="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700"
        >
          <h3 class="text-xl font-bold mb-4">Add Book</h3>
          <form @submit.prevent="uploadBook" class="space-y-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">Grade</label>
              <select
                v-model="form.gradeId"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
              >
                <option value="">Select Grade</option>
                <option v-for="g in grades" :key="g._id" :value="g._id">
                  {{ g.title }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">Subject</label>
              <select
                v-model="form.subjectId"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
              >
                <option value="">Select Subject</option>
                <option v-for="s in subjects" :key="s._id" :value="s._id">
                  {{ s.title }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">PDF File</label>
              <input
                type="file"
                accept=".pdf"
                @change="handleFile"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
              />
            </div>
            <div class="flex justify-end gap-2">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="uploading"
                class="px-4 py-2 bg-emerald-600 rounded-lg"
              >
                {{ uploading ? "Uploading..." : "Upload" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        :show="showDeleteConfirm"
        title="Delete Book"
        message="Are you sure you want to delete this book? This will remove all associated units and data."
        @confirm="deleteBook"
        @cancel="showDeleteConfirm = false"
      />

      <ConfirmModal
        :show="showPreprocessConfirm"
        title="Update Preprocessed Data?"
        message="This content has already been preprocessed and stored. Updating will overwrite the existing data in Qdrant. Do you want to continue?"
        confirmText="Yes, Update"
        @confirm="executePreprocess"
        @cancel="cancelPreprocess"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useToast } from "../../composables/useToast";
import ConfirmModal from "../../components/common/ConfirmModal.vue";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const books = ref([]);
const grades = ref([]);
const subjects = ref([]);
const showModal = ref(false);
const uploading = ref(false);
const processingBooks = ref(new Set());
const form = ref({ gradeId: "", subjectId: "" });
const file = ref(null);
const toast = useToast();

const selectedGrade = ref(""); // New state for filtering

const showDeleteConfirm = ref(false);
const bookToDelete = ref(null);

const showPreprocessConfirm = ref(false);
const bookToPreprocess = ref(null);

// Helper to extract grade number safely
function getGradeNumber(gradeData) {
  const title =
    gradeData?.title || (typeof gradeData === "string" ? gradeData : "") || "";
  const match = title.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999; // 999 for unknown grades to put them at end
}

// Computed property for sorting and filtering
const filteredAndSortedBooks = computed(() => {
  let result = [...books.value];

  // 1. Filter
  if (selectedGrade.value) {
    result = result.filter((book) => {
      const gId = book.grade?._id || book.grade;
      return gId === selectedGrade.value;
    });
  }

  // 2. Sort by Grade (9, 10, 11, 12)
  result.sort((a, b) => {
    const gradeA = getGradeNumber(a.grade);
    const gradeB = getGradeNumber(b.grade);
    return gradeA - gradeB;
  });

  return result;
});

async function fetchData() {
  const [booksRes, gradesRes, subjectsRes] = await Promise.all([
    axios.get("http://localhost:3000/books"),
    axios.get("http://localhost:3000/grades"),
    axios.get("http://localhost:3000/subjects"),
  ]);
  books.value = booksRes.data;
  grades.value = gradesRes.data;
  subjects.value = subjectsRes.data;
}

function handleFile(e) {
  file.value = e.target.files[0];
}

async function uploadBook() {
  if (!file.value) return toast.warning("Please select a PDF file");
  if (!form.value.gradeId || !form.value.subjectId)
    return toast.warning("Please select grade and subject");

  uploading.value = true;

  const formData = new FormData();
  formData.append("file", file.value);
  formData.append("grade", form.value.gradeId);
  formData.append("subject", form.value.subjectId);

  try {
    await axios.post("http://localhost:3000/books/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    closeModal();
    fetchData();
  } catch (err) {
    console.error("Upload error:", err);
    toast.error(
      "Upload failed: " + (err.response?.data?.message || err.message),
    );
  } finally {
    uploading.value = false;
  }
}

function initiatePreprocess(book) {
  if (processingBooks.value.has(book._id)) return;

  if (book.isPreprocessed) {
    bookToPreprocess.value = book._id;
    showPreprocessConfirm.value = true;
  } else {
    // Direct start for new books
    preprocessBook(book._id);
  }
}

function cancelPreprocess() {
  showPreprocessConfirm.value = false;
  bookToPreprocess.value = null;
}

function executePreprocess() {
  if (bookToPreprocess.value) {
    preprocessBook(bookToPreprocess.value);
    // Close modal
    cancelPreprocess();
  }
}

async function preprocessBook(id) {
  if (processingBooks.value.has(id)) return;

  // Small UX: Toast "Started" can be helpful if it takes time
  // toast.info("Preprocessing started...");

  processingBooks.value.add(id);
  try {
    const res = await axios.post(`http://localhost:3000/preprocess/${id}`);
    toast.success(
      `Success: ${res.data.data.message} (${res.data.data.totalPoints} chunks)`,
    );
    // Refresh list to update status
    fetchData();
  } catch (e) {
    console.error("Preprocess failed", e);
    toast.error(
      "Preprocessing failed: " + (e.response?.data?.message || e.message),
    );
  } finally {
    processingBooks.value.delete(id);
  }
}

function confirmDelete(id) {
  bookToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function deleteBook() {
  if (!bookToDelete.value) return;
  try {
    await axios.delete(`http://localhost:3000/books/${bookToDelete.value}`);
    fetchData();
    toast.success("Book deleted successfully");
  } catch (err) {
    toast.error("Failed to delete book");
  } finally {
    showDeleteConfirm.value = false;
    bookToDelete.value = null;
  }
}

function closeModal() {
  showModal.value = false;
  form.value = { gradeId: "", subjectId: "" };
  file.value = null;
}

onMounted(fetchData);
</script>
