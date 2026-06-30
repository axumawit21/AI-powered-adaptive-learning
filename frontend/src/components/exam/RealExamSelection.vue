<template>
  <div class="real-exam-selection">
    <!-- Header -->
    <div class="selection-header">
      <button class="back-btn" @click="$emit('back')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h2>Real Exam Practice</h2>
      <p class="subtitle">
        Select an exam from the Ethiopian national examination archive
      </p>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Subject</label>
        <select v-model="selectedSubject" @change="filterExams">
          <option value="">All Subjects</option>
          <option v-for="s in availableSubjects" :key="s" :value="s">
            {{ s }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Year</label>
        <select v-model="selectedYear" @change="filterExams">
          <option value="">All Years</option>
          <option v-for="y in availableYears" :key="y" :value="y">
            {{ y }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading available exams...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredExams.length === 0" class="empty-state">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
      <p>No exams available for the selected filters</p>
      <span class="hint">Try adjusting your filters or check back later</span>
    </div>

    <!-- Exams List -->
    <div v-else class="exams-grid">
      <div
        v-for="exam in filteredExams"
        :key="exam._id"
        class="exam-card"
        @click="$emit('select-exam', exam)"
      >
        <div class="exam-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div class="exam-info">
          <h3>{{ exam.subjectTitle }}</h3>
          <div class="exam-meta">
            <span class="grade-badge">{{ exam.gradeTitle }}</span>
            <span class="year-badge">{{ exam.examYear }}</span>
          </div>
          <span class="questions-count"
            >{{ exam.approvedQuestionsCount }} Questions</span
          >
        </div>
        <div class="start-arrow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { examPaperService } from "../../services/examPaperService";
import { useGlobalState } from "../../composables/useGlobalState";

const emit = defineEmits(["back", "select-exam"]);
const { grade } = useGlobalState();

// Watch for grade changes to refetch
watch(grade, () => {
  fetchExams();
  // Reset filters when grade changes as subjects might be different
  selectedSubject.value = "";
  selectedYear.value = "";
});

// State
const exams = ref([]);
const loading = ref(true);
const selectedSubject = ref("");
const selectedYear = ref("");

// Computed
const availableSubjects = computed(() => {
  const subjects = [...new Set(exams.value.map((e) => e.subjectTitle))];
  return subjects.sort();
});

const availableYears = computed(() => {
  const years = [...new Set(exams.value.map((e) => e.examYear))];
  return years.sort((a, b) => b - a);
});

const filteredExams = computed(() => {
  return exams.value.filter((exam) => {
    if (selectedSubject.value && exam.subjectTitle !== selectedSubject.value)
      return false;
    if (selectedYear.value && exam.examYear !== selectedYear.value)
      return false;
    return true;
  });
});

// Methods
async function fetchExams() {
  loading.value = true;
  try {
    // Get student's grade ID if available
    const gradeId = grade.value?.id || grade.value?._id || "";
    const gradeTitle = grade.value?.title || "";

    // If we have a selected grade, filter by it. Backend handles empty gradeId by returning all?
    // Usually backend expects strict filtering if student is strict.
    // But here we want reactivity.

    console.log(
      "[RealExamSelection] Fetching exams for grade:",
      gradeTitle,
      gradeId
    );
    exams.value = await examPaperService.getApprovedExams({ gradeId });
  } catch (err) {
    console.error("Failed to fetch exams:", err);
    exams.value = [];
  } finally {
    loading.value = false;
  }
}

function filterExams() {
  // Filters are reactive, no action needed
}

onMounted(fetchExams);
</script>

<style scoped>
.real-exam-selection {
  padding: 1rem 0;
}

.selection-header {
  margin-bottom: 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #475569;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #334155;
  color: #f1f5f9;
}

.selection-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.5rem;
}

.subtitle {
  color: #94a3b8;
  margin: 0;
}

.filters-section {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #94a3b8;
}

.filter-group select {
  padding: 0.625rem 1rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  min-width: 160px;
  cursor: pointer;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state svg {
  color: #475569;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1.1rem;
  color: #e2e8f0;
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.9rem;
}

.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.exam-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.exam-card:hover {
  background: #273549;
  border-color: #475569;
  transform: translateY(-2px);
}

.exam-icon {
  padding: 0.875rem;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 10px;
  color: #3b82f6;
}

.exam-info {
  flex: 1;
}

.exam-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 0.5rem;
}

.exam-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.grade-badge,
.year-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.grade-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.year-badge {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.questions-count {
  font-size: 0.85rem;
  color: #94a3b8;
}

.start-arrow {
  color: #475569;
  transition: all 0.2s;
}

.exam-card:hover .start-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}
</style>
