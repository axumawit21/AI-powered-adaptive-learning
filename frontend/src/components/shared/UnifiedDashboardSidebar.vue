<template>
  <aside
    class="fixed left-0 top-0 w-64 h-screen bg-slate-800 border-r border-slate-700 p-4"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-full" :class="headerGradient"></div>
      <div>
        <h1 class="text-xl font-bold">{{ panelTitle }}</h1>
        <p
          v-if="subtitle"
          class="text-xs text-slate-400 truncate max-w-[140px]"
        >
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="space-y-2 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
      <router-link
        v-for="feature in visibleFeatures"
        :key="feature.id"
        :to="feature.route"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        :class="{ 'bg-slate-700': isActive(feature.route) }"
      >
        <component
          :is="getIcon(feature.icon)"
          class="w-5 h-5"
          :class="getIconColor(feature.id)"
        />
        {{ feature.label }}
      </router-link>
    </nav>

    <!-- Logout Button -->
    <button
      @click="handleLogout"
      class="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
    >
      <LogOutIcon class="w-5 h-5" />
      Logout
    </button>
  </aside>
</template>

<script setup>
import { computed, h } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePermissions } from "../../composables/usePermissions";
import { FEATURES, getAllowedFeatures } from "../../config/permissions";

// Icons (inline SVGs as functional components for simplicity)
const icons = {
  "layout-dashboard": () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
        h("path", { d: "M3 9h18" }),
        h("path", { d: "M9 21V9" }),
      ],
    ),
  "graduation-cap": () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M22 10v6M2 10l10-5 10 5-10 5z" }),
        h("path", { d: "M6 12v5c3 3 9 3 12 0v-5" }),
      ],
    ),
  "book-open": () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" }),
        h("path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" }),
      ],
    ),
  book: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z",
        }),
        h("path", { d: "M8 7h6" }),
        h("path", { d: "M8 11h8" }),
      ],
    ),
  layers: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }),
        h("path", { d: "M2 17l10 5 10-5" }),
        h("path", { d: "M2 12l10 5 10-5" }),
      ],
    ),
  users: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
        h("circle", { cx: "9", cy: "7", r: "4" }),
        h("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
        h("circle", { cx: "19", cy: "11", r: "3" }),
      ],
    ),
  "user-check": () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
        h("circle", { cx: "9", cy: "7", r: "4" }),
        h("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
        h("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }),
      ],
    ),
  building: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
        h("polyline", { points: "9 22 9 12 15 12 15 22" }),
      ],
    ),
  database: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }),
        h("path", { d: "M2 17l10 5 10-5" }),
        h("path", { d: "M2 12l10 5 10-5" }),
      ],
    ),
  "shield-check": () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M9 11l3 3L22 4" }),
        h("path", {
          d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
        }),
      ],
    ),
  "file-text": () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", {
          d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
        }),
        h("polyline", { points: "14 2 14 8 20 8" }),
        h("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
        h("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
      ],
    ),
  award: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }),
        h("path", { d: "M2 17l10 5 10-5" }),
        h("path", { d: "M2 12l10 5 10-5" }),
      ],
    ),
  grid: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }),
        h("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }),
        h("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }),
        h("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }),
      ],
    ),
  upload: () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
        h("polyline", { points: "17 8 12 3 7 8" }),
        h("line", { x1: "12", y1: "3", x2: "12", y2: "15" }),
      ],
    ),
};

const LogOutIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
      h("polyline", { points: "16 17 21 12 16 7" }),
      h("line", { x1: "21", y1: "12", x2: "9", y2: "12" }),
    ],
  );

const props = defineProps({
  // Optional: Override the panel title
  title: { type: String, default: null },
  // Optional: Force specific features (useful for custom layouts)
  forceFeatures: { type: Array, default: null },
});

const router = useRouter();
const route = useRoute();
const { permissions, userRole, user } = usePermissions();

// Determine panel title based on role
const panelTitle = computed(() => {
  if (props.title) return props.title;
  switch (userRole) {
    case "super_admin":
    case "admin":
      return "Admin Panel";
    case "school_admin":
      return "School Admin";
    case "content_moderator":
      return "Moderation";
    case "teacher":
      return "Teacher Panel";
    default:
      return "Dashboard";
  }
});

// Subtitle (e.g., school name for school admins)
const subtitle = computed(() => {
  if (userRole === "school_admin" && user?.schoolName) {
    return user.schoolName;
  }
  return null;
});

// Header gradient based on role
const headerGradient = computed(() => {
  switch (userRole) {
    case "super_admin":
    case "admin":
      return "bg-gradient-to-br from-orange-400 to-red-500";
    case "school_admin":
      return "bg-gradient-to-br from-teal-400 to-cyan-500";
    case "content_moderator":
      return "bg-gradient-to-br from-emerald-400 to-green-500";
    case "teacher":
      return "bg-gradient-to-br from-blue-400 to-indigo-500";
    default:
      return "bg-gradient-to-br from-slate-400 to-slate-500";
  }
});

// Get visible features based on permissions
const visibleFeatures = computed(() => {
  if (props.forceFeatures) {
    return props.forceFeatures;
  }
  return getAllowedFeatures(permissions.value, userRole);
});

// Check if route is active
const isActive = (featureRoute) => {
  if (route.path === featureRoute) return true;
  // Also match sub-routes
  if (featureRoute !== "/admin" && route.path.startsWith(featureRoute))
    return true;
  return false;
};

// Get icon component
const getIcon = (iconName) => {
  return icons[iconName] || icons["layout-dashboard"];
};

// Icon colors based on feature
const iconColors = {
  dashboard: "text-cyan-400",
  grades: "text-violet-400",
  subjects: "text-orange-400",
  books: "text-emerald-400",
  units: "text-amber-400",
  students: "text-blue-400",
  teachers: "text-emerald-400",
  schools: "text-teal-400",
  questionBank: "text-rose-400",
  contentModeration: "text-emerald-400",
  examPapers: "text-cyan-400",
  modelExams: "text-purple-400",
  sections: "text-violet-400",
  bulkImport: "text-amber-400",
};

const getIconColor = (featureId) => {
  return iconColors[featureId] || "text-slate-400";
};

// Logout handler
const handleLogout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
  localStorage.removeItem("schoolAdminToken");
  localStorage.removeItem("schoolAdmin");
  localStorage.removeItem("teacherToken");
  localStorage.removeItem("teacher");

  // Redirect based on role
  if (userRole === "school_admin") {
    router.push("/school-admin/login");
  } else if (userRole === "teacher") {
    router.push("/teacher/login");
  } else {
    router.push("/admin/login");
  }
};
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
