<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <!-- Main Content -->
    <main class="ml-64 p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Grades Management</h1>
        <button
          @click="showModal = true"
          class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
        >
          + Add Grade
        </button>
      </div>

      <!-- Grades Table -->
      <div
        class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        <table class="w-full">
          <thead class="bg-slate-700">
            <tr>
              <th class="text-left px-6 py-4">Title</th>
              <th class="text-left px-6 py-4">Grade Number</th>
              <th class="text-left px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="grade in grades"
              :key="grade._id"
              class="border-t border-slate-700"
            >
              <td class="px-6 py-4">{{ grade.title }}</td>
              <td class="px-6 py-4">{{ grade.gradeNumber }}</td>
              <td class="px-6 py-4 space-x-2">
                <button
                  @click="editGrade(grade)"
                  class="text-cyan-400 hover:text-cyan-300"
                >
                  Edit
                </button>
                <button
                  @click="triggerDelete(grade._id)"
                  class="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div
          class="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700"
        >
          <h3 class="text-xl font-bold mb-4">
            {{ editingId ? "Edit" : "Add" }} Grade
          </h3>
          <form @submit.prevent="saveGrade" class="space-y-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">Title</label>
              <input
                v-model="form.title"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                placeholder="e.g., Grade 9"
              />
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1"
                >Grade Number</label
              >
              <input
                v-model.number="form.gradeNumber"
                type="number"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                placeholder="e.g., 9"
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
              <button type="submit" class="px-4 py-2 bg-emerald-600 rounded-lg">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        :show="showDeleteConfirm"
        title="Delete Grade"
        message="Are you sure you want to delete this grade? This will affect all associated books and content."
        @confirm="handleConfirmDelete"
        @cancel="showDeleteConfirm = false"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useToast } from "../../composables/useToast";
import ConfirmModal from "../../components/common/ConfirmModal.vue";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const grades = ref([]);
const showModal = ref(false);
const editingId = ref(null);
const form = ref({ title: "", gradeNumber: null });
const toast = useToast();

const showDeleteConfirm = ref(false);
const gradeToDelete = ref(null);

async function fetchGrades() {
  const res = await axios.get("/grades");
  grades.value = res.data;
}

function editGrade(grade) {
  editingId.value = grade._id;
  form.value = { title: grade.title, gradeNumber: grade.gradeNumber };
  showModal.value = true;
}

async function saveGrade() {
  if (editingId.value) {
    await axios.put(
      `/grades/${editingId.value}`,
      form.value,
    );
  } else {
    await axios.post("/grades", form.value);
  }
  closeModal();
  fetchGrades();
}

function triggerDelete(id) {
  gradeToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function handleConfirmDelete() {
  if (!gradeToDelete.value) return;
  try {
    await axios.delete(`/grades/${gradeToDelete.value}`);
    toast.success("Grade deleted successfully");
    fetchGrades();
  } catch (err) {
    console.error("Delete error:", err);
    toast.error(
      "Delete failed: " + (err.response?.data?.message || err.message),
    );
  } finally {
    showDeleteConfirm.value = false;
    gradeToDelete.value = null;
  }
}

function closeModal() {
  showModal.value = false;
  editingId.value = null;
  form.value = { title: "", gradeNumber: null };
}

onMounted(fetchGrades);
</script>
