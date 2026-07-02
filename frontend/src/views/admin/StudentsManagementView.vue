<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <h1 class="text-3xl font-bold mb-8">Students Management</h1>

      <div
        class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        <table class="w-full">
          <thead class="bg-slate-700">
            <tr>
              <th class="text-left px-6 py-4">Name</th>
              <th class="text-left px-6 py-4">Email</th>
              <th class="text-left px-6 py-4">Registered</th>
              <th class="text-left px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="student in students"
              :key="student._id"
              class="border-t border-slate-700"
            >
              <td class="px-6 py-4">{{ student.name }}</td>
              <td class="px-6 py-4">{{ student.email }}</td>
              <td class="px-6 py-4">
                {{ new Date(student.createdAt).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4">
                <button
                  @click="triggerDelete(student._id)"
                  class="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ConfirmModal
        :show="showDeleteConfirm"
        title="Delete Student"
        message="Are you sure you want to delete this student? This will remove all their progress and account data."
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

const students = ref([]);
const toast = useToast();

const showDeleteConfirm = ref(false);
const studentToDelete = ref(null);

async function fetchStudents() {
  const res = await axios.get("/students");
  students.value = res.data.data;
}

function triggerDelete(id) {
  studentToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function handleConfirmDelete() {
  if (!studentToDelete.value) return;
  try {
    await axios.delete(
      `/students/${studentToDelete.value}`,
    );
    toast.success("Student deleted successfully");
    fetchStudents();
  } catch (err) {
    console.error("Delete error:", err);
    toast.error(
      "Delete failed: " + (err.response?.data?.message || err.message),
    );
  } finally {
    showDeleteConfirm.value = false;
    studentToDelete.value = null;
  }
}

onMounted(fetchStudents);
</script>
