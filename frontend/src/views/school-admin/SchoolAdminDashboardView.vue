<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <!-- Main Content -->
    <main class="ml-64 p-8">
      <h1 class="text-3xl font-bold mb-8">School Dashboard</h1>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"
        ></div>
      </div>

      <!-- Stats Grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="text-slate-400 text-sm mb-2">Total Students</div>
          <div class="text-3xl font-bold text-teal-400">
            {{ stats.totalStudents }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="text-slate-400 text-sm mb-2">Total Teachers</div>
          <div class="text-3xl font-bold text-emerald-400">
            {{ stats.totalTeachers }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="text-slate-400 text-sm mb-2">Total Sections</div>
          <div class="text-3xl font-bold text-violet-400">
            {{ stats.totalSections }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="text-slate-400 text-sm mb-2">School Status</div>
          <div class="text-xl font-bold text-cyan-400">Active</div>
        </div>
      </div>

      <!-- Students by Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-lg font-semibold mb-4">Students by Section</h3>
          <div v-if="stats.studentsBySection?.length > 0">
            <div
              v-for="item in stats.studentsBySection"
              :key="item.section"
              class="flex justify-between py-2 border-b border-slate-700 last:border-0"
            >
              <span class="text-slate-400">{{ item.section }}</span>
              <span class="font-bold">{{ item.count }} students</span>
            </div>
          </div>
          <div v-else class="text-slate-400 text-sm">
            No sections created yet.
            <router-link
              to="/school-admin/sections"
              class="text-teal-400 hover:underline"
            >
              Create sections
            </router-link>
          </div>
        </div>

        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
          <div class="space-y-3">
            <router-link
              to="/school-admin/sections"
              class="block w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg text-center transition-colors"
            >
              Manage Sections
            </router-link>
            <router-link
              to="/school-admin/import"
              class="block w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg text-center transition-colors"
            >
              Bulk Import Students
            </router-link>
            <router-link
              to="/school-admin/students"
              class="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition-colors"
            >
              View All Students
            </router-link>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const loading = ref(true);
const stats = ref({
  totalStudents: 0,
  totalTeachers: 0,
  totalSections: 0,
  studentsBySection: [],
});

const schoolId = computed(() => {
  const admin = JSON.parse(localStorage.getItem("schoolAdmin") || "{}");
  return admin.schoolId;
});

async function fetchStats() {
  if (!schoolId.value) {
    loading.value = false;
    return;
  }

  try {
    const token = localStorage.getItem("schoolAdminToken");
    const res = await axios.get(
      `http://localhost:3000/schools/${schoolId.value}/stats`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    stats.value = res.data;
  } catch (err) {
    console.error("Failed to fetch stats:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStats);
</script>
