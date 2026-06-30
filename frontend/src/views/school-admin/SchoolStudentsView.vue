<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <button
          @click="goToGrades"
          class="hover:text-white transition-colors"
          :class="{ 'text-white font-medium': viewMode === 'grades' }"
        >
          All Grades
        </button>
        <template v-if="viewMode !== 'grades'">
          <span class="text-slate-600">›</span>
          <button
            @click="goToSections"
            class="hover:text-white transition-colors"
            :class="{ 'text-white font-medium': viewMode === 'sections' }"
          >
            Grade {{ selectedGradeNumber }}
          </button>
        </template>
        <template v-if="viewMode === 'students'">
          <span class="text-slate-600">›</span>
          <span class="text-white font-medium">{{ selectedSectionName }}</span>
        </template>
      </nav>

      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center gap-4">
          <button
            v-if="viewMode !== 'grades'"
            @click="goBack"
            class="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-3xl font-bold">
            <span v-if="viewMode === 'grades'">Students</span>
            <span v-else-if="viewMode === 'sections'"
              >Grade {{ selectedGradeNumber }} - Sections</span
            >
            <span v-else>{{ selectedSectionName }} - Students</span>
          </h1>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"
        ></div>
      </div>

      <!-- Grade Cards View -->
      <div
        v-else-if="viewMode === 'grades'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="grade in displayGrades"
          :key="grade._id"
          @click="selectGrade(grade)"
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-teal-500 cursor-pointer transition-all hover:scale-105"
        >
          <div class="flex items-center justify-center mb-4">
            <div
              class="w-16 h-16 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center"
            >
              <span class="text-2xl font-bold">{{ grade.gradeNumber }}</span>
            </div>
          </div>
          <h3 class="text-xl font-bold text-center mb-2">
            Grade {{ grade.gradeNumber }}
          </h3>
          <p class="text-slate-400 text-center text-sm">
            {{ getSectionsForGrade(grade._id).length }} sections
          </p>
          <p class="text-slate-500 text-center text-xs mt-1">
            {{ getStudentsForGrade(grade._id).length }} students
          </p>
        </div>
      </div>

      <!-- Section Cards View -->
      <div
        v-else-if="viewMode === 'sections'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="section in sectionsForSelectedGrade"
          :key="section._id"
          @click="selectSection(section)"
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-teal-500 cursor-pointer transition-all hover:scale-105"
        >
          <h3 class="text-xl font-bold text-teal-400 mb-2">
            {{ section.name }}
          </h3>
          <p class="text-slate-400 text-sm mb-4">
            {{ getStudentsForSection(section._id).length }} students
          </p>
          <div class="text-sm text-slate-500">
            Homeroom: {{ section.homeroomTeacherId?.name || "Not assigned" }}
          </div>
        </div>

        <!-- Empty state for no sections -->
        <div
          v-if="sectionsForSelectedGrade.length === 0"
          class="col-span-full bg-slate-800 p-12 rounded-xl border border-slate-700 text-center"
        >
          <p class="text-slate-400 mb-4">
            No sections found for Grade {{ selectedGradeNumber }}.
          </p>
          <router-link
            to="/school-admin/sections"
            class="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Create Section
          </router-link>
        </div>
      </div>

      <!-- Students Table View -->
      <div v-else-if="viewMode === 'students'">
        <div
          v-if="studentsForSelectedSection.length > 0"
          class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
        >
          <table class="w-full">
            <thead class="bg-slate-700">
              <tr>
                <th class="text-left px-6 py-4">Name</th>
                <th class="text-left px-6 py-4">Email</th>
                <th class="text-left px-6 py-4">Registered</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in studentsForSelectedSection"
                :key="student._id"
                class="border-t border-slate-700 hover:bg-slate-700/50"
              >
                <td class="px-6 py-4">{{ student.name }}</td>
                <td class="px-6 py-4 text-slate-400">{{ student.email }}</td>
                <td class="px-6 py-4 text-slate-400">
                  {{ new Date(student.createdAt).toLocaleDateString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="bg-slate-800 p-12 rounded-xl border border-slate-700 text-center"
        >
          <p class="text-slate-400 mb-4">No students in this section.</p>
          <router-link
            to="/school-admin/sections"
            class="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Import Students
          </router-link>
        </div>

        <!-- Stats -->
        <div class="mt-6 text-slate-400 text-sm">
          Showing {{ studentsForSelectedSection.length }} students
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const students = ref([]);
const sections = ref([]);
const grades = ref([]);

// View state
const viewMode = ref("grades"); // 'grades' | 'sections' | 'students'
const selectedGradeId = ref(null);
const selectedSectionId = ref(null);

const schoolId = computed(() => {
  const admin = JSON.parse(localStorage.getItem("schoolAdmin") || "{}");
  return admin.schoolId;
});

const token = computed(() => localStorage.getItem("schoolAdminToken"));

// Filter grades to show only 9, 10, 11, 12
const displayGrades = computed(() => {
  return grades.value
    .filter((g) => {
      const num = parseInt(g.title?.replace(/\D/g, "") || g.gradeNumber || "0");
      return num >= 9 && num <= 12;
    })
    .map((g) => ({
      ...g,
      gradeNumber: parseInt(
        g.title?.replace(/\D/g, "") || g.gradeNumber || "0",
      ),
    }))
    .sort((a, b) => a.gradeNumber - b.gradeNumber);
});

const selectedGradeNumber = computed(() => {
  if (!selectedGradeId.value) return "";
  const grade = displayGrades.value.find(
    (g) => g._id === selectedGradeId.value,
  );
  return grade?.gradeNumber || "";
});

const selectedSectionName = computed(() => {
  if (!selectedSectionId.value) return "";
  const section = sections.value.find((s) => s._id === selectedSectionId.value);
  return section?.name || "";
});

const sectionsForSelectedGrade = computed(() => {
  if (!selectedGradeId.value) return [];
  return sections.value.filter(
    (s) =>
      s.gradeId?._id === selectedGradeId.value ||
      s.gradeId === selectedGradeId.value,
  );
});

const studentsForSelectedSection = computed(() => {
  if (!selectedSectionId.value) return [];
  return students.value.filter((s) => s.sectionId === selectedSectionId.value);
});

function getSectionsForGrade(gradeId) {
  return sections.value.filter(
    (s) => s.gradeId?._id === gradeId || s.gradeId === gradeId,
  );
}

function getStudentsForGrade(gradeId) {
  const gradeSections = getSectionsForGrade(gradeId);
  const sectionIds = gradeSections.map((s) => s._id);
  return students.value.filter((s) => sectionIds.includes(s.sectionId));
}

function getStudentsForSection(sectionId) {
  return students.value.filter((s) => s.sectionId === sectionId);
}

function selectGrade(grade) {
  selectedGradeId.value = grade._id;
  viewMode.value = "sections";
}

function selectSection(section) {
  selectedSectionId.value = section._id;
  viewMode.value = "students";
}

function goBack() {
  if (viewMode.value === "students") {
    viewMode.value = "sections";
    selectedSectionId.value = null;
  } else if (viewMode.value === "sections") {
    viewMode.value = "grades";
    selectedGradeId.value = null;
  }
}

function goToGrades() {
  viewMode.value = "grades";
  selectedGradeId.value = null;
  selectedSectionId.value = null;
}

function goToSections() {
  viewMode.value = "sections";
  selectedSectionId.value = null;
}

async function fetchStudents() {
  if (!schoolId.value) return;
  try {
    const res = await axios.get(
      `http://localhost:3000/students?schoolId=${schoolId.value}`,
      { headers: { Authorization: `Bearer ${token.value}` } },
    );
    students.value = res.data.data || res.data;
  } catch (err) {
    console.error("Failed to fetch students:", err);
  }
}

async function fetchSections() {
  if (!schoolId.value) return;
  try {
    const res = await axios.get(
      `http://localhost:3000/schools/${schoolId.value}/sections`,
      { headers: { Authorization: `Bearer ${token.value}` } },
    );
    sections.value = res.data;
  } catch (err) {
    console.error("Failed to fetch sections:", err);
  }
}

async function fetchGrades() {
  try {
    const res = await axios.get("http://localhost:3000/grades");
    grades.value = res.data;
  } catch (err) {
    console.error("Failed to fetch grades:", err);
  }
}

// Handle query params for direct section navigation
watch(
  () => route.query.section,
  (newSection) => {
    if (newSection && sections.value.length > 0) {
      const section = sections.value.find((s) => s._id === newSection);
      if (section) {
        selectedGradeId.value = section.gradeId?._id || section.gradeId;
        selectedSectionId.value = newSection;
        viewMode.value = "students";
      }
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await Promise.all([fetchGrades(), fetchSections(), fetchStudents()]);
  loading.value = false;

  // Check for section query param after data loads
  if (route.query.section) {
    const section = sections.value.find((s) => s._id === route.query.section);
    if (section) {
      selectedGradeId.value = section.gradeId?._id || section.gradeId;
      selectedSectionId.value = route.query.section;
      viewMode.value = "students";
    }
  }
});
</script>
