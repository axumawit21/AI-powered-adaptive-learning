<template>
  <aside
    class="fixed left-0 top-0 w-64 h-screen bg-slate-800 border-r border-slate-700 p-4"
  >
    <div class="flex items-center gap-3 mb-8">
      <div
        class="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-500"
      ></div>
      <h1 class="text-xl font-bold">Admin Panel</h1>
    </div>

    <nav class="space-y-2 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
      <router-link
        to="/admin"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{ 'bg-slate-700': $route.path === '/admin' }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5 text-cyan-400"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        Dashboard
      </router-link>
      <router-link
        to="/admin/grades"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{ 'bg-slate-700': $route.path.includes('/admin/grades') }"
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
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
        Grades
      </router-link>
      <router-link
        to="/admin/subjects"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{ 'bg-slate-700': $route.path.includes('/admin/subjects') }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5 text-orange-400"
        >
          <path
            d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
          />
          <path d="M8 7h6" />
          <path d="M8 11h8" />
        </svg>
        Subjects
      </router-link>
      <router-link
        to="/admin/books"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{ 'bg-slate-700': $route.path.includes('/admin/books') }"
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
          <path
            d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
          />
          <path d="M8 7h6" />
          <path d="M8 11h8" />
        </svg>
        Books
      </router-link>
      <router-link
        to="/admin/units"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{ 'bg-slate-700': $route.path.includes('/admin/units') }"
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
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <rect width="8" height="4" x="8" y="2" rx="1" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
        Units
      </router-link>
      <router-link
        to="/admin/students"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{ 'bg-slate-700': $route.path.includes('/admin/students') }"
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
        to="/admin/question-bank"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/admin/question-bank'),
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
          class="w-5 h-5 text-rose-400"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Question Bank
      </router-link>
      <router-link
        to="/admin/content-moderation"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/admin/content-moderation'),
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
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        Content Moderation
      </router-link>
      <router-link
        to="/admin/exam-papers"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/admin/exam-papers'),
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
          class="w-5 h-5 text-cyan-400"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        Exam Papers
      </router-link>
      <router-link
        to="/admin/model-exams"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/admin/model-exams'),
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
          class="w-5 h-5 text-purple-400"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Model Exams
      </router-link>
      <router-link
        to="/admin/schools"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{
          'bg-slate-700': $route.path.includes('/admin/schools'),
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
          class="w-5 h-5 text-teal-400"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Schools
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
import { useRouter, useRoute } from "vue-router";
import axios from "axios";

const router = useRouter();

function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
  delete axios.defaults.headers.common["Authorization"];
  router.push("/admin/login");
}
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
