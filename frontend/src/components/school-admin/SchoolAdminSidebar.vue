<template>
  <aside
    class="fixed left-0 top-0 w-64 h-screen bg-slate-800 border-r border-slate-700 p-4"
  >
    <div class="flex items-center gap-3 mb-8">
      <div
        class="w-10 h-10 rounded-full bg-linear-to-br from-teal-400 to-cyan-500"
      ></div>
      <div>
        <h1 class="text-xl font-bold">School Admin</h1>
        <p class="text-xs text-slate-400 truncate max-w-[140px]">
          {{ schoolName }}
        </p>
      </div>
    </div>

    <nav class="space-y-2 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
      <router-link
        to="/school-admin"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{ 'bg-slate-700': $route.path === '/school-admin' }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5 text-teal-400"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        Dashboard
      </router-link>

      <router-link
        to="/school-admin/sections"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/school-admin/sections'),
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5 text-violet-400"
        >
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
        Sections
      </router-link>

      <router-link
        to="/school-admin/students"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/school-admin/students'),
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5 text-blue-400"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <circle cx="19" cy="11" r="3" />
        </svg>
        Students
      </router-link>

      <router-link
        to="/school-admin/teachers"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/school-admin/teachers'),
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5 text-emerald-400"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Teachers
      </router-link>

      <router-link
        to="/school-admin/import"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/school-admin/import'),
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5 text-amber-400"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Bulk Import
      </router-link>
    </nav>

    <button
      @click="logout"
      class="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-5 h-5"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Logout
    </button>
  </aside>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

const schoolName = computed(() => {
  const admin = JSON.parse(localStorage.getItem("schoolAdmin") || "{}");
  return admin.schoolName || "School";
});

function logout() {
  localStorage.removeItem("schoolAdminToken");
  localStorage.removeItem("schoolAdmin");
  delete axios.defaults.headers.common["Authorization"];
  router.push("/school-admin/login");
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
