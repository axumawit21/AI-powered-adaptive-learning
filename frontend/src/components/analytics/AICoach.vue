<template>
  <div class="ai-coach-container">
    <!-- Coach Trigger Button (If not always visible) -->
    <button
      v-if="variant === 'button'"
      @click="toggleCoach"
      class="coach-trigger-btn shadow-premium"
      :class="{ pulse: !hasViewedRecs }"
    >
      <div class="icon-wrapper">
        <span class="sparkle">✨</span>
      </div>
      <span class="btn-text">Consult AI Coach</span>
    </button>

    <!-- Main Coach Panel (integrated) -->
    <div v-else class="coach-panel hover-premium transition-all duration-500">
      <div class="panel-header">
        <div class="coach-avatar">
          <div class="avatar-inner">🤖</div>
          <div class="status-dot"></div>
        </div>
        <div class="header-text">
          <h3 class="title">AI Learning Coach</h3>
          <p class="subtitle">
            {{
              loading ? "Analyzing your progress..." : "Ready with new insights"
            }}
          </p>
        </div>
        <button
          v-if="recommendations"
          @click="$emit('refresh')"
          class="refresh-btn"
          :disabled="loading"
        >
          <span :class="{ 'animate-spin': loading }">🔄</span>
        </button>
      </div>

      <div class="panel-body custom-scrollbar">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="skeleton-text"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>

        <!-- Initial State -->
        <div
          v-else-if="!recommendations && !selectedSubject"
          class="empty-state"
        >
          <div class="empty-icon">📊</div>
          <p>Select a subject to see your personalized coaching plan.</p>
        </div>

        <!-- Insufficient Data State -->
        <div
          v-else-if="recommendations?.insufficientData"
          class="empty-state insufficient-data"
        >
          <div class="empty-icon">📝</div>
          <p class="text-amber-400 font-medium">Not enough data yet.</p>
          <p class="text-slate-400 text-sm mt-2">
            Take a quiz to unlock insights!
          </p>
        </div>

        <!-- Content -->
        <div v-else class="coach-content animate-fade-in">
          <!-- Analysis Bubble -->
          <div v-if="recommendations" class="coach-bubble prose">
            <p>"{{ recommendations.content }}"</p>
          </div>

          <!-- Insight Tabs -->
          <div
            class="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl border border-white/5"
          >
            <button
              @click="activeTab = 'winning'"
              class="flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2"
              :class="
                activeTab === 'winning'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              "
            >
              <span>🏆</span> Winning in
            </button>
            <button
              @click="activeTab = 'focus'"
              class="flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2"
              :class="
                activeTab === 'focus'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              "
            >
              <span>📉</span> Focus on
            </button>
          </div>

          <div class="insights-content min-h-[120px]">
            <Transition name="fade" mode="out-in">
              <!-- Strong Areas -->
              <div
                v-if="activeTab === 'winning'"
                key="winning"
                class="insight-card success border border-emerald-500/20 bg-emerald-500/5 p-5 rounded-2xl animate-fade-in"
              >
                <div class="card-header flex items-center gap-3 mb-4">
                  <div
                    class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"
                  >
                    🏆
                  </div>
                  <h4
                    class="font-bold text-emerald-400 uppercase tracking-wider text-xs"
                  >
                    Your Strengths
                  </h4>
                </div>
                <div
                  v-if="recommendations.strongAreas?.length"
                  class="tag-list flex flex-wrap gap-2"
                >
                  <span
                    v-for="area in recommendations.strongAreas"
                    :key="area"
                    class="px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full text-[11px] font-bold border border-emerald-500/20"
                  >
                    {{ area }}
                  </span>
                </div>
                <div v-else class="text-slate-500 italic text-sm py-2">
                  No mastery areas identified yet. Keep going!
                </div>
              </div>

              <!-- Weak Areas -->
              <div
                v-else
                key="focus"
                class="insight-card warning border border-amber-500/20 bg-amber-500/5 p-5 rounded-2xl animate-fade-in"
              >
                <div class="card-header flex items-center gap-3 mb-4">
                  <div
                    class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400"
                  >
                    🎯
                  </div>
                  <h4
                    class="font-bold text-amber-400 uppercase tracking-wider text-xs"
                  >
                    Growth Areas
                  </h4>
                </div>
                <div
                  v-if="recommendations.weakAreas?.length"
                  class="tag-list flex flex-wrap gap-2"
                >
                  <span
                    v-for="area in recommendations.weakAreas"
                    :key="area"
                    class="px-3 py-1 bg-amber-500/10 text-amber-300 rounded-full text-[11px] font-bold border border-amber-500/20"
                  >
                    {{ area }}
                  </span>
                </div>
                <div v-else class="text-slate-500 italic text-sm py-2">
                  No specific focus areas identified yet. Great job!
                </div>
              </div>
            </Transition>
          </div>

          <!-- Suggested Actions -->
          <div class="actions-section">
            <h4 class="section-title">Recommended Next Steps</h4>
            <div class="steps-list">
              <div
                v-for="(step, i) in recommendations.suggestedFocus"
                :key="i"
                class="step-item"
              >
                <div class="step-num">{{ i + 1 }}</div>
                <div class="step-text">{{ step }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide-over / Modal (used with 'button' variant) -->
    <Transition name="slide-up">
      <div
        v-if="isOpen && variant === 'button'"
        class="coach-overlay"
        @click.self="isOpen = false"
      >
        <div class="coach-modal shadow-2xl">
          <div class="modal-header">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <span>✨</span> Learning Analysis:
              {{ selectedSubject?.subjectTitle || "Lumi AI" }}
            </h2>
            <button @click="isOpen = false" class="close-btn">✕</button>
          </div>
          <!-- Re-use the panel body logic here or similar -->
          <div class="modal-body custom-scrollbar p-6">
            <!-- (Body content similar to panel-body above) -->
            <div v-if="loading" class="loading-state">
              ...Analyzing Student Performance...
            </div>
            <div
              v-else-if="recommendations && selectedSubject"
              class="coach-content"
            >
              <!-- ... Content ... -->
              <div
                class="coach-bubble bg-indigo-500/10 p-4 rounded-2xl mb-6 border border-indigo-500/20"
              >
                <p class="text-lg leading-relaxed font-medium text-slate-100">
                  "{{ recommendations.content }}"
                </p>
              </div>

              <!-- Insight Tabs in Modal -->
              <div class="flex gap-4 mb-6">
                <button
                  @click="activeTab = 'winning'"
                  class="flex-1 p-4 rounded-2xl transition-all duration-300 border text-left group"
                  :class="
                    activeTab === 'winning'
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-slate-800/40 border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                  "
                >
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl">🏆</span>
                    <span
                      class="text-xs font-bold text-emerald-400 uppercase tracking-widest"
                      >Winning</span
                    >
                  </div>
                  <div class="text-[10px] text-slate-400">
                    Topics you've mastered
                  </div>
                </button>
                <button
                  @click="activeTab = 'focus'"
                  class="flex-1 p-4 rounded-2xl transition-all duration-300 border text-left group"
                  :class="
                    activeTab === 'focus'
                      ? 'bg-amber-500/10 border-amber-500/50'
                      : 'bg-slate-800/40 border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                  "
                >
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl">📈</span>
                    <span
                      class="text-xs font-bold text-amber-400 uppercase tracking-widest"
                      >Focus</span
                    >
                  </div>
                  <div class="text-[10px] text-slate-400">Areas to improve</div>
                </button>
              </div>

              <div class="min-h-[140px] mb-8">
                <Transition name="fade" mode="out-in">
                  <div
                    v-if="activeTab === 'winning'"
                    key="winning-modal"
                    class="animate-fade-in"
                  >
                    <div
                      v-if="recommendations.strongAreas?.length"
                      class="flex flex-wrap gap-2"
                    >
                      <span
                        v-for="a in recommendations.strongAreas"
                        :key="a"
                        class="px-4 py-2 bg-emerald-500/10 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                      >
                        {{ a }}
                      </span>
                    </div>
                    <div
                      v-else
                      class="p-8 text-center bg-slate-800/30 rounded-2xl border border-dashed border-white/10"
                    >
                      <span class="text-2xl block mb-2 opacity-50">🚀</span>
                      <p class="text-slate-400 text-sm italic">
                        Keep studying to reveal your strengths!
                      </p>
                    </div>
                  </div>
                  <div v-else key="focus-modal" class="animate-fade-in">
                    <div
                      v-if="recommendations.weakAreas?.length"
                      class="flex flex-wrap gap-2"
                    >
                      <span
                        v-for="a in recommendations.weakAreas"
                        :key="a"
                        class="px-4 py-2 bg-amber-500/10 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/20 shadow-lg shadow-amber-500/5"
                      >
                        {{ a }}
                      </span>
                    </div>
                    <div
                      v-else
                      class="p-8 text-center bg-slate-800/30 rounded-2xl border border-dashed border-white/10"
                    >
                      <span class="text-2xl block mb-2 opacity-50">✨</span>
                      <p class="text-slate-400 text-sm italic">
                        You're doing great! No urgent focus areas detected.
                      </p>
                    </div>
                  </div>
                </Transition>
              </div>

              <div
                class="bg-slate-800/50 rounded-2xl p-6 border border-white/5"
              >
                <h4 class="text-white font-bold mb-4 flex items-center gap-2">
                  <span>🚀</span> Your Personalized Study Plan
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="(s, i) in recommendations.suggestedFocus"
                    :key="i"
                    class="flex gap-4 items-start"
                  >
                    <div
                      class="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    >
                      {{ i + 1 }}
                    </div>
                    <div class="text-slate-300 text-sm leading-relaxed">
                      {{ s }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-6">
              <div class="mb-6">
                <span class="text-64 block mb-2">🧠</span>
                <h3 class="text-lg font-bold text-white mb-2">
                  Select a Subject to Analyze
                </h3>
                <p class="text-slate-400 text-sm">
                  Lumi Coach needs performance data to give you advice.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                <button
                  v-for="s in activeSubjects"
                  :key="s.subjectId"
                  @click="handleSelect(s)"
                  class="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 border border-white/5 hover:border-cyan-500/50 hover:bg-slate-700/50 transition-all text-left group"
                >
                  <div>
                    <div class="font-bold text-white group-hover:text-cyan-400">
                      {{ s.subjectTitle }}
                    </div>
                    <div class="text-[10px] text-slate-500 uppercase">
                      {{ s.gradeTitle }}
                    </div>
                  </div>
                  <span
                    class="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >→</span
                  >
                </button>

                <div
                  v-if="activeSubjects.length === 0"
                  class="text-slate-500 italic py-4"
                >
                  No active subjects found. Take a quiz or exam first!
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer p-4 border-t border-white/5">
            <button
              @click="$emit('refresh')"
              class="w-full py-3 rounded-xl bg-linear-to-r from-cyan-600 to-indigo-600 text-white font-bold"
              :disabled="loading"
            >
              {{
                loading ? "Generating Insights..." : "Refresh Coach Analysis"
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  subjects: {
    type: Array,
    default: () => [],
  },
  selectedSubject: {
    type: Object,
    default: null,
  },
  recommendations: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String, // 'button' or 'integrated'
    default: "integrated",
  },
});

const emit = defineEmits(["refresh", "select-subject"]);

const isOpen = ref(false);
const hasViewedRecs = ref(false);
const activeTab = ref("winning");

const activeSubjects = computed(() => {
  return props.subjects.filter((s) => s.hasActivity);
});

const toggleCoach = () => {
  isOpen.value = !isOpen.value;
  hasViewedRecs.value = true;
};

const handleSelect = (subject) => {
  console.log("[DEBUG_UI] AICoach: Subject clicked:", subject?.subjectTitle);
  emit("select-subject", subject);
};
</script>

<style scoped>
.ai-coach-container {
  font-family: "Inter", sans-serif;
}

/* Button Variant */
.coach-trigger-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #06b6d4, #6366f1);
  color: white;
  padding: 12px 24px;
  border-radius: 9999px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.coach-trigger-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 10px 20px -5px rgba(6, 182, 212, 0.5);
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse {
  animation: heartRate 2s ease-in-out infinite;
}

@keyframes heartRate {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(6, 182, 212, 0);
  }
}

/* Integrated Variant */
.coach-panel {
  background: var(--bg-surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 16px;
}

.coach-avatar {
  position: relative;
  width: 48px;
  height: 48px;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4f46e5, #9333ea);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.4);
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid #0f172a;
  border-radius: 50%;
}

.header-text .title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.header-text .subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.panel-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Content Styles */
.coach-bubble {
  background: var(--accent-primary-alpha);
  border: 1px solid var(--accent-primary);
  border-radius: 20px;
  border-top-left-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
}

.coach-bubble p {
  margin: 0;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.6;
  font-style: italic;
}

.insights-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.insight-card {
  padding: 16px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.insight-card.success {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.2);
}
.insight-card.warning {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.card-header h4 {
  font-size: 13px;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.success h4 {
  color: #10b981;
}
.warning h4 {
  color: #f59e0b;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.tag-success,
.tag-warning {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
}

.tag-success {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
}
.tag-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
}

.actions-section .section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-surface-solid);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s;
}

.step-item:hover {
  background: var(--surface-secondary);
}

.step-num {
  width: 20px;
  height: 20px;
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Modal Variant */
.coach-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.coach-modal {
  background: #0f172a;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
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

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 10px;
}
</style>
