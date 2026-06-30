<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Subjects Management</h1>
        <button
          @click="showModal = true"
          class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
        >
          + Add Subject
        </button>
      </div>

      <div
        class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        <table class="w-full">
          <thead class="bg-slate-700">
            <tr>
              <th class="text-left px-6 py-4">Title</th>
              <th class="text-left px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="subject in subjects"
              :key="subject._id"
              class="border-t border-slate-700"
            >
              <td class="px-6 py-4">{{ subject.title }}</td>
              <td class="px-6 py-4 space-x-2">
                <button
                  @click="editSubject(subject)"
                  class="text-cyan-400 hover:text-cyan-300"
                >
                  Edit
                </button>
                <button
                  @click="triggerDelete(subject._id)"
                  class="text-red-400 hover:text-red-300 cursor-pointer"
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
          <h3 class="text-xl font-bold mb-4">
            {{ editingId ? "Edit" : "Add" }} Subject
          </h3>
          <form @submit.prevent="saveSubject" class="space-y-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">Title</label>
              <input
                v-model="form.title"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                placeholder="e.g., Mathematics"
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
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This will affect all associated books and content."
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

const subjects = ref([]);
const showModal = ref(false);
const editingId = ref(null);
const form = ref({ title: "" });
const toast = useToast();

const showDeleteConfirm = ref(false);
const subjectToDelete = ref(null);

async function fetchSubjects() {
  const res = await axios.get("http://localhost:3000/subjects");
  subjects.value = res.data;
}

function editSubject(subject) {
  editingId.value = subject._id;
  form.value = { title: subject.title };
  showModal.value = true;
}

async function saveSubject() {
  if (editingId.value) {
    await axios.put(
      `http://localhost:3000/subjects/${editingId.value}`,
      form.value,
    );
  } else {
    await axios.post("http://localhost:3000/subjects", form.value);
  }
  closeModal();
  fetchSubjects();
}

function triggerDelete(id) {
  subjectToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function handleConfirmDelete() {
  if (!subjectToDelete.value) return;
  try {
    await axios.delete(
      `http://localhost:3000/subjects/${subjectToDelete.value}`,
    );
    toast.success("Subject deleted successfully");
    fetchSubjects();
  } catch (err) {
    console.error("Delete error:", err);
    toast.error(
      "Delete failed: " + (err.response?.data?.message || err.message),
    );
  } finally {
    showDeleteConfirm.value = false;
    subjectToDelete.value = null;
  }
}

function closeModal() {
  showModal.value = false;
  editingId.value = null;
  form.value = { title: "" };
}

onMounted(fetchSubjects);
</script>
