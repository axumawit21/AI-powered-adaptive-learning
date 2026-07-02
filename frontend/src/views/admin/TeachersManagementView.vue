<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <h1 class="text-3xl font-bold mb-8">Teachers Management</h1>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"
        ></div>
        <p class="text-slate-400">Loading teachers...</p>
      </div>

      <!-- Teachers Table -->
      <div
        v-else
        class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        <table class="w-full">
          <thead class="bg-slate-700">
            <tr>
              <th class="text-left px-6 py-4">Teacher ID</th>
              <th class="text-left px-6 py-4">Name</th>
              <th class="text-left px-6 py-4">Email</th>
              <th class="text-left px-6 py-4">School</th>
              <th class="text-left px-6 py-4">Grade</th>
              <th class="text-left px-6 py-4">Subject</th>
              <th class="text-left px-6 py-4">Registered</th>
              <th class="text-left px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="teachers.length === 0">
              <td colspan="8" class="px-6 py-8 text-center text-slate-400">
                No teachers registered yet.
              </td>
            </tr>
            <tr
              v-for="teacher in teachers"
              :key="teacher._id"
              class="border-t border-slate-700 hover:bg-slate-700/50"
            >
              <td class="px-6 py-4">
                <span
                  class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded"
                >
                  {{ teacher.teacherId || "N/A" }}
                </span>
              </td>
              <td class="px-6 py-4 font-medium">{{ teacher.name }}</td>
              <td class="px-6 py-4 text-slate-300">{{ teacher.email }}</td>
              <td class="px-6 py-4">
                <span v-if="teacher.schoolId?.name" class="text-cyan-400">
                  {{ teacher.schoolId.name }}
                </span>
                <span v-else class="text-slate-500">Not set</span>
              </td>
              <td class="px-6 py-4">
                <span v-if="teacher.gradeId?.title" class="text-sky-400">
                  {{ teacher.gradeId.title }}
                </span>
                <span v-else class="text-slate-500">Not set</span>
              </td>
              <td class="px-6 py-4">
                <span v-if="teacher.subjectId?.title" class="text-violet-400">
                  {{ teacher.subjectId.title }}
                </span>
                <span v-else class="text-slate-500">Not set</span>
              </td>
              <td class="px-6 py-4 text-slate-400">
                {{ formatDate(teacher.createdAt) }}
              </td>
              <td class="px-6 py-4">
                <button
                  @click="triggerDelete(teacher._id)"
                  class="text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Info -->
        <div
          v-if="teachers.length > 0"
          class="px-6 py-4 border-t border-slate-700 flex justify-between items-center"
        >
          <span class="text-sm text-slate-400">
            Showing {{ teachers.length }} of {{ total }} teachers
          </span>
          <div class="flex gap-2" v-if="totalPages > 1">
            <button
              v-for="p in totalPages"
              :key="p"
              @click="goToPage(p)"
              :class="[
                'px-3 py-1 rounded text-sm',
                page === p
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
              ]"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        :show="showDeleteConfirm"
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This will remove their account and all associated data."
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

const teachers = ref([]);
const loading = ref(true);
const toast = useToast();

const page = ref(1);
const total = ref(0);
const totalPages = ref(1);

const showDeleteConfirm = ref(false);
const teacherToDelete = ref(null);

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString();
}

async function fetchTeachers() {
  loading.value = true;
  try {
    const token = localStorage.getItem("adminToken");
    const res = await axios.get(
      `/teachers?page=${page.value}&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    teachers.value = res.data.data || [];
    total.value = res.data.total || 0;
    totalPages.value = res.data.totalPages || 1;
  } catch (err) {
    console.error("Error fetching teachers:", err);
    toast.error("Failed to load teachers");
  } finally {
    loading.value = false;
  }
}

function goToPage(p) {
  page.value = p;
  fetchTeachers();
}

function triggerDelete(id) {
  teacherToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function handleConfirmDelete() {
  if (!teacherToDelete.value) return;
  try {
    const token = localStorage.getItem("adminToken");
    await axios.delete(
      `/teachers/${teacherToDelete.value}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    toast.success("Teacher deleted successfully");
    fetchTeachers();
  } catch (err) {
    console.error("Delete error:", err);
    toast.error(
      "Delete failed: " + (err.response?.data?.message || err.message),
    );
  } finally {
    showDeleteConfirm.value = false;
    teacherToDelete.value = null;
  }
}

onMounted(fetchTeachers);
</script>
