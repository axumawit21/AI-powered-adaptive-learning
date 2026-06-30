<template>
  <DefaultLayout>
    <div
      class="h-full flex flex-col bg-transparent overflow-y-auto custom-scrollbar relative font-sans p-6 md:p-8 animate-fade-in"
    >
      <!-- Stats Header (Streak & Focus) -->
      <div
        class="z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8"
      >
        <div>
          <h1
            class="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 mb-2 tracking-tight"
          >
            Learning Journey
          </h1>
          <p
            class="text-sm font-medium"
            :style="{ color: 'var(--text-secondary)' }"
          >
            "Success is the sum of small efforts, repeated day in and day out."
          </p>
        </div>

        <!-- Streak & Total Time Progress -->
        <div class="flex flex-col md:flex-row gap-4 items-center">
          <!-- Total Time Progress Bar -->
          <div class="glass-panel px-6 py-3 rounded-2xl min-w-[240px]">
            <div
              class="flex justify-between items-center mb-1 text-[10px] font-bold uppercase tracking-wider"
              :style="{ color: 'var(--text-secondary)' }"
            >
              <span>Overall Goal</span>
              <span class="text-cyan-400"
                >{{ totalTimeUsedPercent }}% Achieved</span
              >
            </div>
            <div
              class="w-full rounded-full h-2 overflow-hidden"
              :style="{ background: 'var(--surface-secondary)' }"
            >
              <div
                class="h-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                :style="{ width: `${totalTimeUsedPercent}%` }"
              ></div>
            </div>
          </div>

          <!-- Streak Badge -->
          <div
            class="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4 group hover:border-amber-500/30 transition-all shadow-lg"
          >
            <div class="relative">
              <div
                class="text-4xl group-hover:scale-110 transition-transform duration-300"
              >
                🔥
              </div>
              <div
                class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"
              ></div>
            </div>
            <div class="flex flex-col">
              <span
                class="text-2xl font-bold leading-none"
                :style="{ color: 'var(--text-primary)' }"
                >{{ streak }}</span
              >
              <span
                class="text-[10px] text-amber-500 font-bold uppercase tracking-wider"
                >Day Streak</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
        <!-- Goals Section (Full Width) -->
        <div class="xl:col-span-12">
          <div class="flex items-center gap-2 mb-4">
            <h2
              class="text-2xl font-bold"
              :style="{ color: 'var(--text-primary)' }"
            >
              Goals & Targets
            </h2>
            <span
              class="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-600 rounded-full border border-cyan-500/30"
              >New</span
            >
          </div>
          <GoalPlanner />
        </div>
        <!-- Loading State -->
        <div
          v-if="loading"
          class="xl:col-span-12 flex items-center justify-center min-h-[40vh]"
        >
          <div class="text-center">
            <div class="animate-spin text-5xl mb-4 text-cyan-500">⏳</div>
            <p
              class="font-medium tracking-wide"
              :style="{ color: 'var(--text-secondary)' }"
            >
              Analysing progress...
            </p>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!hasData"
          class="xl:col-span-12 flex items-center justify-center min-h-[50vh]"
        >
          <div
            class="glass-panel p-10 rounded-3xl text-center max-w-2xl mx-auto border"
            :style="{ borderColor: 'var(--border-color)' }"
          >
            <div class="text-8xl mb-6 animate-bounce">📚</div>
            <h2
              class="text-3xl font-bold mb-4"
              :style="{ color: 'var(--text-primary)' }"
            >
              Start Your Learning Journey!
            </h2>
            <p
              class="mb-8 max-w-lg mx-auto"
              :style="{ color: 'var(--text-secondary)' }"
            >
              Complete quizzes and study sessions to see your progress here.
              Your achievements, study time, and mastery levels will be tracked
              automatically.
            </p>
            <div class="grid grid-cols-3 gap-4 text-center mb-8">
              <div
                class="rounded-xl p-4 border"
                :style="{
                  background: 'var(--bg-surface-solid)',
                  borderColor: 'var(--border-color)',
                }"
              >
                <div class="text-3xl mb-2">📝</div>
                <p class="text-sm" :style="{ color: 'var(--text-secondary)' }">
                  Take Quizzes
                </p>
              </div>
              <div
                class="rounded-xl p-4 border"
                :style="{
                  background: 'var(--bg-surface-solid)',
                  borderColor: 'var(--border-color)',
                }"
              >
                <div class="text-3xl mb-2">⏱️</div>
                <p class="text-sm" :style="{ color: 'var(--text-secondary)' }">
                  Track Study Time
                </p>
              </div>
              <div
                class="rounded-xl p-4 border"
                :style="{
                  background: 'var(--bg-surface-solid)',
                  borderColor: 'var(--border-color)',
                }"
              >
                <div class="text-3xl mb-2">📊</div>
                <p class="text-sm" :style="{ color: 'var(--text-secondary)' }">
                  See Progress
                </p>
              </div>
            </div>
            <router-link
              to="/"
              class="inline-block px-8 py-4 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95"
            >
              Start Learning →
            </router-link>
          </div>
        </div>

        <!-- LEFT COLUMN (8/12): Charts & Subjects -->
        <div v-else class="xl:col-span-8 flex flex-col gap-8">
          <!-- Learning Activity & Stats Section -->
          <div class="glass-panel rounded-3xl p-6 relative overflow-hidden">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Left: Chart -->
              <div class="flex-1 min-w-0">
                <h3
                  class="text-xl font-bold mb-6 flex items-center gap-2"
                  :style="{ color: 'var(--text-primary)' }"
                >
                  <span>📊</span> Learning Activity
                </h3>
                <ProgressChart
                  :data="studyHistory"
                  :selectedRange="timeRange"
                  @update:range="updateTimeRange"
                />
              </div>

              <!-- Right: Stats Cards -->
              <div class="lg:w-72 grid grid-cols-2 gap-3 shrink-0">
                <!-- Total Time -->
                <div
                  class="rounded-2xl p-4 border transition-all group"
                  :style="{
                    background: 'var(--surface-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <div
                      class="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform"
                    >
                      ⏱️
                    </div>
                    <span
                      class="text-xs font-bold uppercase"
                      :style="{ color: 'var(--text-secondary)' }"
                      >Study Time</span
                    >
                  </div>
                  <div
                    class="text-xl font-bold"
                    :style="{ color: 'var(--text-primary)' }"
                  >
                    {{ formatTime(totalStudyTime) }}
                  </div>
                </div>

                <!-- Quizzes Done -->
                <div
                  class="rounded-2xl p-4 border transition-all group"
                  :style="{
                    background: 'var(--surface-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <div
                      class="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform"
                    >
                      📝
                    </div>
                    <span
                      class="text-xs font-bold uppercase"
                      :style="{ color: 'var(--text-secondary)' }"
                      >Quizzes</span
                    >
                  </div>
                  <div
                    class="text-xl font-bold"
                    :style="{ color: 'var(--text-primary)' }"
                  >
                    {{ totalQuizzesCompleted }}
                  </div>
                </div>

                <!-- Exams Done -->
                <div
                  class="rounded-2xl p-4 border transition-all group"
                  :style="{
                    background: 'var(--surface-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <div
                      class="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform"
                    >
                      📋
                    </div>
                    <span
                      class="text-xs font-bold uppercase"
                      :style="{ color: 'var(--text-secondary)' }"
                      >Exams</span
                    >
                  </div>
                  <div
                    class="text-xl font-bold"
                    :style="{ color: 'var(--text-primary)' }"
                  >
                    {{ totalExamsCompleted }}
                  </div>
                </div>

                <!-- Avg Progress -->
                <div
                  class="rounded-2xl p-4 border transition-all group"
                  :style="{
                    background: 'var(--surface-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <div
                      class="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform"
                    >
                      📊
                    </div>
                    <span
                      class="text-xs font-bold uppercase"
                      :style="{ color: 'var(--text-secondary)' }"
                      >Avg Progress</span
                    >
                  </div>
                  <div
                    class="text-xl font-bold"
                    :style="{ color: 'var(--text-primary)' }"
                  >
                    {{ avgMastery }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Subject Cards Grid -->
          <h3
            class="text-xl font-bold px-2 mt-2"
            :style="{ color: 'var(--text-primary)' }"
          >
            Your Subjects
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SubjectProgressCard
              v-for="subject in subjects"
              :key="subject.subjectId"
              :subject="subject"
              class="cursor-pointer hover:border-cyan-500/50"
              :class="{
                'border-cyan-500 shadow-lg shadow-cyan-900/20':
                  selectedSubject?.subjectId === subject.subjectId,
              }"
              @click="selectSubject(subject)"
              @start-quiz="handleStartQuiz"
              @take-exam="handleTakeExam"
            />
          </div>
        </div>

        <!-- RIGHT COLUMN (4/12): AI Insight Panel -->
        <div class="xl:col-span-4 flex flex-col h-full relative">
          <AICoach
            variant="integrated"
            :subjects="subjects"
            :selected-subject="selectedSubject"
            :recommendations="recommendations"
            :loading="loadingRecs"
            @refresh="generateRecommendations"
            @select-subject="selectSubject"
          />
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import Chart from "chart.js/auto";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import { useAuth } from "../../composables/useAuth";
import { progressService } from "../../services/progressService";
import SubjectProgressCard from "../../components/gamification/SubjectProgressCard.vue";
import ProgressChart from "../../components/charts/ProgressChart.vue";
import GoalPlanner from "../../components/goals/GoalPlanner.vue";
import AICoach from "../../components/analytics/AICoach.vue";
import { useProgress } from "../../composables/useProgress";
import { useGlobalState } from "../../composables/useGlobalState";
import api from "../../services/api";

const router = useRouter();

// Get selected grade from global state
const { grade: selectedGrade, selectedSubject: globalSelectedSubject } =
  useGlobalState();

const { token } = useAuth();
const subjects = ref([]);
const totalStudyTime = ref(0);
const avgMastery = ref(0);
const totalQuizzesCompleted = ref(0);
const totalExamsCompleted = ref(0);
const totalTimeUsedPercent = ref(0);
const streak = ref(0);
const selectedSubject = ref(null);
const recommendations = ref(null);
const loadingRecs = ref(false);
const loading = ref(true);
const studyHistory = ref([]);
const timeRange = ref("weekly");

const hasData = computed(() => {
  return subjects.value.length > 0 || totalStudyTime.value > 0;
});

const fetchDashboard = async () => {
  console.log("Fetching dashboard data...");
  loading.value = true;
  try {
    // parallel fetch
    const [dashboardData, historyData, booksRes] = await Promise.all([
      progressService.getDashboardOverview(),
      progressService.getGlobalHistory(timeRange.value === "weekly" ? 7 : 30),
      api.get("/books"),
    ]);

    console.log("Dashboard data received:", dashboardData);

    const data = dashboardData;
    // subjects.value = data.subjects || []; // OLD logic

    // New Logic: Merge with books
    subjects.value = resolveAllSubjects(
      data.subjects || [],
      booksRes.data || [],
    );

    totalStudyTime.value = data.totalStudyTime || 0;
    streak.value = data.streak || 0;
    studyHistory.value = historyData || [];

    // Use backend-provided totals if available, otherwise calculate from subjects
    totalQuizzesCompleted.value =
      data.totalQuizzes ||
      subjects.value.reduce((sum, s) => sum + (s.quizzesDone || 0), 0);
    totalExamsCompleted.value =
      data.totalExams ||
      subjects.value.reduce(
        (sum, s) => sum + (s.examsDone || s.examsCompleted || 0),
        0,
      );

    // Calculate avgMastery as average learningProgress across active subjects
    // This represents overall subjects mastery percentage
    if (subjects.value.length > 0) {
      const totalProgress = subjects.value.reduce(
        (sum, s) => sum + (s.learningProgress || 0),
        0,
      );
      avgMastery.value = Math.round(totalProgress / subjects.value.length);
    } else {
      avgMastery.value = 0;
    }

    // Global progress based on average learning progress across subjects
    totalTimeUsedPercent.value = avgMastery.value;
  } catch (err) {
    console.error("Failed to load progress dashboard", err);
  } finally {
    loading.value = false;
  }
};

const updateTimeRange = async (newRange) => {
  timeRange.value = newRange;
  try {
    studyHistory.value = await progressService.getGlobalHistory(
      newRange === "weekly" ? 7 : 30,
    );
  } catch (e) {
    console.error(e);
  }
};

// Icons helper
const getSubjectIcon = (title) => {
  const map = {
    Math: "📐",
    Physics: "⚛️",
    Chemistry: "🧪",
    Biology: "🧬",
    History: "🏺",
    English: "📝",
    Geography: "🌍",
    Computer: "💻",
    Art: "🎨",
    Music: "🎵",
  };
  // Partial match
  const key = Object.keys(map).find((k) => title && title.includes(k));
  return key ? map[key] : "📖";
};

const selectSubject = (subject) => {
  console.log("[DEBUG_UI] selectSubject triggered for:", subject?.subjectTitle);
  selectedSubject.value = subject;
  generateRecommendations();
};

const generateRecommendations = async () => {
  if (!selectedSubject.value) {
    console.warn("[DEBUG_UI] generateRecommendations: No subject selected.");
    return;
  }
  console.log(
    "[DEBUG_UI] Generating recommendations for:",
    selectedSubject.value.subjectId,
  );
  recommendations.value = null;
  loadingRecs.value = true;
  try {
    const res = await api.post(
      `/progress/${selectedSubject.value.subjectId}/analyze`,
    );
    console.log("[DEBUG_UI] Recommendations received:", res.data);
    recommendations.value = res.data;
  } catch (err) {
    console.error("[DEBUG_UI] Failed to generate recommendations", err);
  } finally {
    loadingRecs.value = false;
  }
};

const formatTime = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// Quick action handlers for subject cards
const handleStartQuiz = (subject) => {
  console.log("[ProgressView] Starting quiz for:", subject.subjectTitle);
  // Set global subject state and navigate to home (quiz interface)
  globalSelectedSubject.value = {
    _id: subject.subjectId,
    title: subject.subjectTitle,
  };
  router.push("/");
};

const handleTakeExam = (subject) => {
  console.log("[ProgressView] Taking exam for:", subject.subjectTitle);
  // Navigate to exam page with subject pre-selected
  router.push({
    path: "/exam",
    query: { subjectId: subject.subjectId, subjectTitle: subject.subjectTitle },
  });
};

onMounted(() => {
  fetchDashboard();
});

// Refetch when grade changes
watch(selectedGrade, () => {
  console.log("[ProgressView] Grade changed, refetching dashboard...");
  fetchDashboard();
});

// Helper: Filter subjects by selected grade and only show those with progress
const resolveAllSubjects = (progressSubjects, allBooks) => {
  // Get selected grade title for filtering
  const currentGradeTitle = selectedGrade.value?.title || null;
  const currentGradeId =
    selectedGrade.value?._id || selectedGrade.value?.id || null;

  console.log(
    "[ProgressView] Filtering subjects for grade:",
    currentGradeTitle,
    currentGradeId,
  );
  console.log("[ProgressView] Progress subjects received:", progressSubjects);

  // 1. Filter books by selected grade (case-insensitive)
  const normalizedCurrentGradeTitle = (currentGradeTitle || "")
    .toLowerCase()
    .trim();

  const gradeFilteredBooks = allBooks.filter((book) => {
    if (!currentGradeTitle && !currentGradeId) return true; // No grade selected, show all

    // Match by grade title (case-insensitive) or ID
    const bookGradeTitle = (book.gradeTitle || "").toLowerCase().trim();
    const bookGradeId = book.grade?._id || book.grade;

    return (
      bookGradeTitle === normalizedCurrentGradeTitle ||
      bookGradeId === currentGradeId
    );
  });

  console.log(
    "[ProgressView] Grade filtered books:",
    gradeFilteredBooks.length,
  );

  // 2. Extract unique subjects from filtered books - KEY BY SUBJECT TITLE to avoid duplicates
  const subjectsMap = new Map();

  gradeFilteredBooks.forEach((book) => {
    if (!book.subject || !book.subjectTitle) return;

    // Key by normalized subject title (lowercase, trimmed) to prevent duplicates
    const normalizedTitle = book.subjectTitle.toLowerCase().trim();
    const key = normalizedTitle;
    const subjectId = book.subject._id || book.subject;

    // Count total units for this subject
    const unitCount = book.units?.length || 0;

    if (!subjectsMap.has(key)) {
      subjectsMap.set(key, {
        subjectId: subjectId,
        subjectTitle: book.subjectTitle,
        gradeTitle: book.gradeTitle,
        gradeId: book.grade?._id || book.grade,
        normalizedTitle: normalizedTitle,
        // New comprehensive metrics
        learningProgress: 0,
        quizzesDone: 0,
        examsDone: 0,
        unitsAttempted: 0,
        totalUnits: unitCount,
        avgQuizScore: 0,
        avgExamScore: 0,
        // Legacy fields
        mastery: 0,
        totalStudyTime: 0,
        examsCompleted: 0,
        unitsCompleted: 0,
      });
    } else {
      // Add units to existing subject
      const existing = subjectsMap.get(key);
      existing.totalUnits += unitCount;
    }
  });

  // 3. Merge progress data - match by subjectId OR by normalized subject title
  progressSubjects.forEach((p) => {
    // Check if this progress record matches the selected grade (case-insensitive)
    const pGradeTitle = (p.gradeTitle || "").toLowerCase().trim();
    const pGradeId = p.gradeId || "";
    const normalizedCurrentGrade = (currentGradeTitle || "")
      .toLowerCase()
      .trim();

    const matchesGrade =
      (!currentGradeTitle && !currentGradeId) ||
      pGradeTitle === normalizedCurrentGrade ||
      pGradeId === currentGradeId;

    if (!matchesGrade) {
      console.log(
        "[ProgressView] Skipping progress (grade mismatch):",
        p.subjectTitle,
        "grade:",
        pGradeTitle,
      );
      return;
    }

    // Normalize the subject title for matching
    const pNormalizedTitle = (p.subjectTitle || "").toLowerCase().trim();

    // Try to find by normalized title first, then by subjectId
    let matchKey = null;

    if (subjectsMap.has(pNormalizedTitle)) {
      matchKey = pNormalizedTitle;
    } else {
      // Try to find by subjectId
      for (const [key, value] of subjectsMap.entries()) {
        if (value.subjectId === p.subjectId) {
          matchKey = key;
          break;
        }
      }
    }

    if (matchKey) {
      const existing = subjectsMap.get(matchKey);
      // Merge progress, summing up values where appropriate
      existing.totalStudyTime =
        (existing.totalStudyTime || 0) + (p.totalStudyTime || 0);
      existing.quizzesDone = (existing.quizzesDone || 0) + (p.quizzesDone || 0);
      existing.examsDone = (existing.examsDone || 0) + (p.examsDone || 0);
      existing.examsCompleted =
        (existing.examsCompleted || 0) + (p.examsCompleted || 0);
      existing.unitsAttempted =
        (existing.unitsAttempted || 0) + (p.unitsAttempted || 0);
      existing.learningProgress = Math.max(
        existing.learningProgress || 0,
        p.learningProgress || 0,
      );
      existing.avgQuizScore = p.avgQuizScore || existing.avgQuizScore;
      existing.avgExamScore = p.avgExamScore || existing.avgExamScore;
      existing.mastery = Math.max(existing.mastery || 0, p.mastery || 0);

      // Keep the subjectId from progress if we don't have one
      if (!existing.subjectId) {
        existing.subjectId = p.subjectId;
      }

      console.log(
        "[ProgressView] Merged progress for:",
        existing.subjectTitle,
        "Study time:",
        existing.totalStudyTime,
      );
    } else {
      // Subject has progress but no matching book in this grade
      // Only add if it has meaningful progress
      const hasRealProgress =
        (p.totalStudyTime && p.totalStudyTime > 0) ||
        (p.quizzesDone && p.quizzesDone > 0) ||
        (p.examsDone && p.examsDone > 0);

      if (hasRealProgress) {
        console.log(
          "[ProgressView] Adding progress-only subject:",
          p.subjectTitle,
        );
        subjectsMap.set(pNormalizedTitle, {
          ...p,
          normalizedTitle: pNormalizedTitle,
        });
      }
    }
  });

  // 4. Filter to only show subjects that have actual meaningful progress AND valid names
  const subjectsWithProgress = Array.from(subjectsMap.values()).filter(
    (subject) => {
      // Filter out subjects with invalid names (e.g., "history9", "math12", etc.)
      const subjectName = (subject.subjectTitle || "").trim();

      // Invalid name patterns:
      // - Empty or "Unknown"
      // - Ends with a number (e.g., "history9", "math12")
      // - Contains only numbers
      const isInvalidName =
        !subjectName ||
        subjectName.toLowerCase() === "unknown" ||
        subjectName.toLowerCase() === "unknown subject" ||
        /\d+$/.test(subjectName) || // Ends with number(s)
        /^\d+$/.test(subjectName); // Only numbers

      if (isInvalidName) {
        console.log(
          "[ProgressView] Filtering out (invalid name):",
          subject.subjectTitle,
        );
        return false;
      }

      // Must have at least some study time OR quiz/exam activity
      const hasStudyTime = subject.totalStudyTime && subject.totalStudyTime > 0;
      const hasQuizzes = subject.quizzesDone && subject.quizzesDone > 0;
      const hasExams =
        (subject.examsDone && subject.examsDone > 0) ||
        (subject.examsCompleted && subject.examsCompleted > 0);
      const hasProgress =
        subject.learningProgress && subject.learningProgress > 0;
      const hasUnitsAttempted =
        subject.unitsAttempted && subject.unitsAttempted > 0;

      const hasMeaningfulProgress =
        hasStudyTime ||
        hasQuizzes ||
        hasExams ||
        hasProgress ||
        hasUnitsAttempted;

      if (!hasMeaningfulProgress) {
        console.log(
          "[ProgressView] Filtering out (no progress):",
          subject.subjectTitle,
        );
      }

      return hasMeaningfulProgress;
    },
  );

  console.log(
    "[ProgressView] Final subjects with progress:",
    subjectsWithProgress.map((s) => `${s.subjectTitle} (${s.totalStudyTime}m)`),
  );

  return subjectsWithProgress;
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.animate-pulse-slow {
  animation: pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulseSlow {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-pulse-fast {
  animation: pulseFast 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulseFast {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 0.3;
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
