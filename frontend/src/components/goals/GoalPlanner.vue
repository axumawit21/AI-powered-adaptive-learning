<template>
  <div class="goal-planner glass-panel rounded-xl p-6 relative">
    <div class="flex items-center justify-between mb-6">
      <h2
        class="text-2xl font-bold tracking-tight"
        :style="{ color: 'var(--text-primary)' }"
      >
        🎯 My Goals
      </h2>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold text-white transition-all shadow-lg shadow-cyan-500/20 active:scale-95 text-sm"
      >
        + New Goal
      </button>
    </div>

    <!-- Timeframe Tabs -->
    <div
      class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
    >
      <button
        v-for="timeframe in timeframes"
        :key="timeframe.value"
        @click="selectedTimeframe = timeframe.value"
        class="px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm border"
        :class="
          selectedTimeframe === timeframe.value
            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 border-cyan-500'
            : 'border-transparent'
        "
        :style="
          selectedTimeframe !== timeframe.value
            ? {
                background: 'var(--bg-surface-solid)',
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-color)',
              }
            : {}
        "
      >
        {{ timeframe.label }}
      </button>
    </div>

    <!-- Goals List -->
    <div class="space-y-4">
      <div
        v-for="goal in filteredGoals"
        :key="goal._id"
        class="rounded-xl p-5 border transition-all group"
        :style="{
          background: 'var(--surface-secondary)',
          borderColor: 'var(--border-subtle)',
        }"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3
              class="font-bold mb-1"
              :style="{ color: 'var(--text-primary)' }"
            >
              {{ goal.title }}
            </h3>
            <p
              v-if="goal.description"
              class="text-sm"
              :style="{ color: 'var(--text-secondary)' }"
            >
              {{ goal.description }}
            </p>
          </div>
          <button
            @click="deleteGoal(goal._id)"
            class="text-red-400 hover:text-red-300 text-sm"
          >
            🗑️
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="mb-2">
          <div
            class="flex justify-between text-xs mb-1"
            :style="{ color: 'var(--text-secondary)' }"
          >
            <span>Progress</span>
            <span>{{ goal.currentValue }} / {{ goal.targetValue }}</span>
          </div>
          <div
            class="w-full rounded-full h-2"
            :style="{ background: 'var(--surface-secondary)' }"
          >
            <div
              class="h-2 rounded-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all duration-500"
              :style="{ width: getProgress(goal) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Status Badge -->
        <div class="flex items-center justify-between">
          <span
            class="text-xs px-2 py-1 rounded-full"
            :class="getStatusClass(goal.status)"
          >
            {{ goal.status }}
          </span>
          <span class="text-xs" :style="{ color: 'var(--text-secondary)' }">
            {{ getDaysRemaining(goal.endDate) }}
          </span>
        </div>
      </div>

      <div v-if="filteredGoals.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">🎯</div>
        <p :style="{ color: 'var(--text-secondary)' }">
          No {{ selectedTimeframe }} goals yet
        </p>
        <button
          @click="showCreateModal = true"
          class="mt-4 text-cyan-400 hover:text-cyan-300"
        >
          Create your first goal →
        </button>
      </div>
    </div>

    <!-- Create Goal Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="showCreateModal = false"
      >
        <div
          class="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-white/10"
        >
          <h3 class="text-xl font-bold text-white mb-4">Create New Goal</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm text-slate-400 mb-2">Title</label>
              <input
                v-model="newGoal.title"
                type="text"
                class="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., Complete 5 quizzes"
              />
            </div>

            <div>
              <label class="block text-sm text-slate-400 mb-2"
                >Description (optional)</label
              >
              <textarea
                v-model="newGoal.description"
                class="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                rows="2"
                placeholder="Add details..."
              ></textarea>
            </div>

            <div>
              <label class="block text-sm text-slate-400 mb-2">Timeframe</label>
              <select
                v-model="newGoal.timeframe"
                class="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-slate-400 mb-2">Goal Type</label>
              <select
                v-model="newGoal.type"
                class="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="quizzes">Quizzes Completed</option>
                <option value="exams">Exams Completed</option>
                <option value="study_time">Study Time (minutes)</option>
                <option value="units">Units Completed</option>
                <option value="custom">Custom</option>
              </select>
              <div
                v-if="
                  newGoal.type !== 'custom' &&
                  (currentActivity !== null || loadingActivity)
                "
                class="mt-2 text-xs text-slate-400 bg-slate-700/50 p-2 rounded flex items-center gap-2"
              >
                <span v-if="loadingActivity" class="animate-pulse"
                  >Loading stats...</span
                >
                <span v-else>
                  Current {{ newGoal.timeframe }} progress:
                  <strong class="text-cyan-400">{{ currentActivity }}</strong>
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm text-slate-400 mb-2"
                >Target Value</label
              >
              <input
                v-model.number="newGoal.targetValue"
                type="number"
                min="1"
                class="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              @click="showCreateModal = false"
              class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors text-white"
            >
              Cancel
            </button>
            <button
              @click="createGoal"
              class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-colors text-white"
            >
              Create Goal
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { gamificationService } from "../../services/gamificationService";
import { progressService } from "../../services/progressService";

const goals = ref([]);
const selectedTimeframe = ref("weekly");
const showCreateModal = ref(false);
const newGoal = ref({
  title: "",
  description: "",
  timeframe: "weekly",
  type: "quizzes",
  targetValue: 5,
});

const currentActivity = ref(null);
const loadingActivity = ref(false);

const fetchCurrentActivity = async () => {
  if (newGoal.value.type === "custom") {
    currentActivity.value = null;
    return;
  }

  loadingActivity.value = true;
  try {
    const result = await progressService.getActivityStats(
      newGoal.value.type,
      newGoal.value.timeframe
    );
    currentActivity.value = result;
  } catch (e) {
    console.error(e);
    currentActivity.value = 0;
  } finally {
    loadingActivity.value = false;
  }
};

watch(
  () => [newGoal.value.type, newGoal.value.timeframe],
  () => {
    if (showCreateModal.value) {
      fetchCurrentActivity();
    }
  }
);

watch(showCreateModal, (val) => {
  if (val) {
    fetchCurrentActivity();
  }
});

const timeframes = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const filteredGoals = computed(() => {
  return goals.value.filter((g) => g.timeframe === selectedTimeframe.value);
});

const getProgress = (goal) => {
  return Math.min(
    Math.round((goal.currentValue / goal.targetValue) * 100),
    100
  );
};

const getStatusClass = (status) => {
  const classes = {
    active: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    paused: "bg-yellow-500/20 text-yellow-400",
  };
  return classes[status] || classes.active;
};

const getDaysRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Expired";
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
};

const createGoal = async () => {
  try {
    // If the goal is based on standard metrics, we might want to initialize currentValue
    // BUT typically a goal starts from 0 progress after creation.
    // The user however asked to "see progress of that goal based on my data".
    // If I see I have done 5 quizzes, maybe I want my goal to be "maintain 5 quizzes" or "reach 10".
    // Usually goals track progress *after* creation.
    // Unless the goal is "Have 50 quizzes total".
    // "Weekly goals" usually reset or count per week.
    // For now, we just create the goal as usual. The visualization is for decision support.

    await gamificationService.createGoal(newGoal.value);
    showCreateModal.value = false;
    newGoal.value = {
      title: "",
      description: "",
      timeframe: "weekly",
      type: "quizzes",
      targetValue: 5,
    };
    await loadGoals();
  } catch (error) {
    console.error("Failed to create goal:", error);
  }
};

const deleteGoal = async (goalId) => {
  if (!confirm("Are you sure you want to delete this goal?")) return;

  try {
    await gamificationService.deleteGoal(goalId);
    await loadGoals();
  } catch (error) {
    console.error("Failed to delete goal:", error);
  }
};

const loadGoals = async () => {
  try {
    goals.value = await gamificationService.getGoals();
  } catch (error) {
    console.error("Failed to load goals:", error);
  }
};

onMounted(loadGoals);
</script>
