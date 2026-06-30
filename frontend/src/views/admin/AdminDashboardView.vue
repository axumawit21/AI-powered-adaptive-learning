<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <!-- Main Content -->
    <main class="ml-64 p-8">
      <h1 class="text-3xl font-bold mb-8">Dashboard</h1>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="text-slate-400 text-sm mb-2">Total Students</div>
          <div class="text-3xl font-bold text-cyan-400">
            {{ stats.totalStudents }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="text-slate-400 text-sm mb-2">Total Books</div>
          <div class="text-3xl font-bold text-emerald-400">
            {{ stats.totalBooks }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="text-slate-400 text-sm mb-2">Total Grades</div>
          <div class="text-3xl font-bold text-violet-400">
            {{ stats.totalGrades }}
          </div>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="text-slate-400 text-sm mb-2">Total Subjects</div>
          <div class="text-3xl font-bold text-orange-400">
            {{ stats.totalSubjects }}
          </div>
        </div>
      </div>

      <!-- Recent Stats -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-lg font-semibold mb-4">Recent Activity</h3>
          <p class="text-slate-400">
            New students this week:
            <span class="text-white font-bold">{{ stats.recentStudents }}</span>
          </p>
          <p class="text-slate-400 mt-2">
            Total progress entries:
            <span class="text-white font-bold">{{ stats.totalProgress }}</span>
          </p>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 class="text-lg font-semibold mb-4">Books by Grade</h3>
          <div
            v-for="item in stats.booksByGrade"
            :key="item._id"
            class="flex justify-between py-2 border-b border-slate-700 last:border-0"
          >
            <span class="text-slate-400">{{
              item.gradeTitle || item._id
            }}</span>
            <span class="font-bold">{{ item.count }} books</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const router = useRouter();
const stats = ref({
  totalStudents: 0,
  totalBooks: 0,
  totalGrades: 0,
  totalSubjects: 0,
  recentStudents: 0,
  totalProgress: 0,
  booksByGrade: [],
});

async function fetchStats() {
  try {
    const res = await axios.get("http://localhost:3000/analytics/dashboard");
    stats.value = res.data;
  } catch (err) {
    console.error("Failed to fetch stats:", err);
  }
}

onMounted(fetchStats);
</script>
