<template>
  <div class="flex flex-col h-full bg-slate-900 text-white">
    <!-- Header -->
    <div
      class="shrink-0 glass-panel mx-2 mt-2 p-3 rounded-xl flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <!-- Burger Menu -->
        <button
          @click="$emit('toggle-menu')"
          class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
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
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>

        <!-- Back Button -->
        <button
          @click="$emit('back')"
          class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <!-- Logo -->
        <div class="relative w-7 h-7">
          <div
            class="absolute inset-0 bg-cyan-500 rounded-lg blur opacity-50"
          ></div>
          <div
            class="relative w-full h-full bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-cyan-400 font-bold text-sm"
          >
            H
          </div>
        </div>

        <!-- Title / Context Switcher -->
        <ChatContextSwitcher
          v-if="chatMessages && chatMessages.length > 0"
          :units="getUnitsFromSubject()"
          :selected-unit="activeUnit"
          :selected-subunit="selectedSubunit"
          :drop-up="true"
          class="flex-1"
          @context-change="handleContextChange"
        />
        <div v-else class="flex flex-col">
          <span class="font-semibold text-white leading-tight">{{
            subject?.title || subject?.name || "Subject"
          }}</span>
          <span class="text-xs text-slate-400">{{ gradeTitle }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content (Chat or Table of Contents) -->
    <div
      class="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
      ref="contentContainer"
    >
      <!-- Chat Messages -->
      <div
        v-if="chatMessages && chatMessages.length > 0"
        class="space-y-6 pb-4"
      >
        <div
          v-for="(msg, index) in chatMessages"
          :key="index"
          class="space-y-4"
        >
          <!-- User Question -->
          <div v-if="msg.question" class="flex justify-end">
            <div
              class="bg-slate-800/80 backdrop-blur-sm px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] border border-slate-700 shadow-xl"
            >
              <div
                class="text-[10px] text-cyan-400 font-bold tracking-wider mb-1 uppercase"
              >
                You
              </div>
              <div class="text-white text-sm leading-relaxed">
                {{ msg.question }}
              </div>
            </div>
          </div>

          <!-- AI Answer / Content -->
          <div
            v-if="
              msg.answer || msg.quiz || msg.summaryData || msg.presentationData
            "
            class="flex justify-start w-full"
          >
            <!-- Standard Text Answer -->
            <div
              v-if="
                msg.answer &&
                !msg.quiz &&
                !msg.summaryData &&
                !msg.presentationData
              "
              class="bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl rounded-tl-sm w-full border border-slate-700/50 shadow-2xl relative overflow-hidden"
            >
              <!-- Robot Header -->
              <div
                class="flex items-center justify-between mb-3 border-b border-white/5 pb-2"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-lg bg-linear-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                  >
                    <span class="text-xs">🤖</span>
                  </div>
                  <div class="text-xs font-bold text-cyan-400 tracking-wide">
                    LUMI AI
                  </div>
                </div>
                <button
                  class="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 transition-colors"
                >
                  <span>🔊</span> Listen
                </button>
              </div>

              <!-- Content -->
              <div class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5">✨</span>
                <div class="space-y-1 w-full">
                  <div class="text-xs text-white font-bold">Answer</div>
                  <div
                    class="text-sm text-slate-300 leading-relaxed prose prose-invert max-w-none"
                    v-html="renderMarkdown(msg.answer)"
                  ></div>
                </div>
              </div>

              <!-- Decorative BG -->
              <div
                class="absolute -right-10 -bottom-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"
              ></div>
            </div>

            <!-- Quiz Component -->
            <div v-else-if="msg.quiz" class="w-full">
              <InlineQuizPlayer
                :quiz-data="msg.quiz"
                @close="removeMessage(index)"
              />
            </div>

            <!-- Summary Component -->
            <div
              v-else-if="msg.summaryData"
              class="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md"
            >
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xl">📝</span>
                <div class="flex-1">
                  <h3 class="font-bold text-white text-base">Unit Summary</h3>
                  <div class="text-[10px] text-slate-400">
                    Select detail level
                  </div>
                </div>
                <button
                  @click="removeMessage(index)"
                  class="text-slate-500 hover:text-red-400 p-2 transition-colors"
                >
                  ✕
                </button>
              </div>

              <!-- Toggle -->
              <div class="flex bg-slate-900 p-1 rounded-lg mb-4 w-full">
                <button
                  @click="msg.summaryData.view = 'general'"
                  :class="[
                    'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
                    msg.summaryData.view === 'general'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  ]"
                >
                  General
                </button>
                <button
                  @click="msg.summaryData.view = 'detailed'"
                  :class="[
                    'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
                    msg.summaryData.view === 'detailed'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  ]"
                >
                  Detailed
                </button>
              </div>

              <!-- Content -->
              <div
                class="prose prose-invert prose-sm max-w-none bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 text-sm"
              >
                <div v-if="msg.summaryData.view === 'general'">
                  <h4 class="text-indigo-400 font-bold mb-1">
                    General Summary
                  </h4>
                  <div
                    class="leading-relaxed"
                    v-html="renderMarkdown(msg.summaryData.general)"
                  ></div>
                </div>
                <div v-else>
                  <h4 class="text-indigo-400 font-bold mb-1">
                    Detailed Summary
                  </h4>
                  <div
                    class="leading-relaxed"
                    v-html="renderMarkdown(msg.summaryData.detailed)"
                  ></div>

                  <div
                    v-if="
                      msg.summaryData.keyConcepts &&
                      msg.summaryData.keyConcepts.length > 0
                    "
                    class="mt-3 pt-3 border-t border-slate-700"
                  >
                    <h4
                      class="text-emerald-400 font-bold mb-2 text-xs uppercase"
                    >
                      Key Concepts
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="c in msg.summaryData.keyConcepts"
                        :key="c"
                        class="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20"
                      >
                        {{ c }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Presentation Component -->
            <div v-else-if="msg.presentationData" class="w-full relative group">
              <button
                @click="removeMessage(index)"
                class="absolute -top-2 -right-2 z-10 bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 w-6 h-6 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              <PresentationViewer :presentation="msg.presentationData" />
            </div>
          </div>
        </div>
      </div>

      <!-- Table of Contents (Fallback) -->
      <div v-else>
        <h2 class="text-xl font-light text-white/90 mb-4 ml-1">
          Subunits of {{ activeUnit?.title || activeUnit?.name || "Unit" }}
        </h2>

        <div class="space-y-2">
          <button
            v-for="(subunit, index) in subunits"
            :key="subunit.id || index"
            @click="selectSubunit(subunit)"
            :class="[
              'w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all',
              selectedSubunit?.id === subunit.id
                ? 'bg-indigo-500/20 border border-indigo-500/30'
                : 'bg-slate-800/40 hover:bg-slate-800 border border-transparent',
            ]"
          >
            <span
              class="text-white text-sm font-medium text-left line-clamp-1"
              >{{ subunit.title }}</span
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-4 h-4 text-slate-400 shrink-0"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <!-- Empty State -->
          <div
            v-if="!subunits || subunits.length === 0"
            class="text-center py-12 text-slate-500"
          >
            <div class="text-4xl mb-3">📚</div>
            <p>No chapters available for this unit</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions Section -->
    <div
      class="shrink-0 bg-linear-to-t from-slate-900 via-slate-900 to-transparent pt-4 pb-6 px-4 space-y-4"
    >
      <div class="flex items-center gap-2">
        <!-- File Upload Button -->
        <button
          @click="triggerFileUpload"
          class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors relative shrink-0"
          :disabled="uploading"
        >
          <span v-if="!uploading">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
              />
            </svg>
          </span>
          <span v-else class="animate-spin text-cyan-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
          <!-- Upload Count Badge -->
          <span
            v-if="uploadedFileCount > 0"
            class="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {{ uploadedFileCount }}
          </span>
        </button>

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,image/*"
          multiple
          class="hidden"
          @change="handleFileUpload"
        />

        <div class="flex-1 relative">
          <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            v-model="chatText"
            type="text"
            :placeholder="inputPlaceholder"
            class="w-full bg-slate-800 border-2 border-slate-700/50 rounded-full pl-12 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all shadow-lg shadow-black/20"
            @keydown.enter="sendChat"
          />
        </div>
        <button
          @click="sendChat"
          class="w-12 h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/20 active:scale-95 shrink-0"
          :disabled="!chatText.trim()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5 text-white"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>

      <!-- Quiz Configuration -->
      <div
        v-if="activeMode === 'quiz'"
        class="mb-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 backdrop-blur-sm shadow-lg animate-[fadeIn_0.2s_ease-out]"
      >
        <div class="flex items-center gap-3 justify-between">
          <div class="flex flex-col gap-1 w-1/2">
            <span
              class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              >Difficulty</span
            >
            <select
              v-model="quizDifficulty"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg py-1.5 px-2 text-xs text-white focus:ring-2 focus:ring-pink-500/50 outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div class="flex flex-col gap-1 w-1/2">
            <span
              class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              >Type</span
            >
            <select
              v-model="quizQuestionType"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg py-1.5 px-2 text-xs text-white focus:ring-2 focus:ring-pink-500/50 outline-none"
            >
              <option :value="null">Default (MCQ)</option>
              <option value="mcq">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="short-answer">Short Answer</option>
              <option value="fill-blank">Fill in the Blank</option>
              <option value="matching">Matching</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Quiz Configuration -->
      <div
        v-if="activeMode === 'quiz'"
        class="mb-4 p-4 bg-slate-800/90 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-300"
      >
        <div class="flex items-center gap-4 justify-between">
          <div class="flex flex-col gap-1.5 w-1/2">
            <span
              class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider pl-1"
              >Difficulty</span
            >
            <div class="relative">
              <select
                v-model="quizDifficulty"
                class="w-full appearance-none bg-slate-900/50 border border-slate-600 rounded-xl py-2.5 pl-3 pr-8 text-xs font-medium text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
              <div
                class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-1.5 w-1/2">
            <span
              class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider pl-1"
              >Type</span
            >
            <div class="relative">
              <select
                v-model="quizQuestionType"
                class="w-full appearance-none bg-slate-900/50 border border-slate-600 rounded-xl py-2.5 pl-3 pr-8 text-xs font-medium text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all outline-none"
              >
                <option :value="null">Default (MCQ)</option>
                <option value="mcq">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
                <option value="fill-blank">Fill in the Blank</option>
                <option value="matching">Matching</option>
                <option value="mixed">Mixed</option>
              </select>
              <div
                class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Generate Button (Optional helper text or explicit button logic handled by main buttons for now) -->
        <div class="mt-3 text-center">
          <span class="text-[10px] text-slate-400 italic"
            >Select options and tap Quiz again to generate</span
          >
        </div>
      </div>

      <!-- Action Buttons - Primary Actions -->
      <div class="grid grid-cols-3 gap-3">
        <!-- Summarize Button -->
        <button
          @click="triggerAction('summarize')"
          :class="[
            'flex flex-col items-start gap-1 p-4 rounded-2xl transition-all active:scale-95 border box-border backdrop-blur-md',
            activeMode === 'summarize'
              ? 'bg-indigo-600/90 border-indigo-500 shadow-lg shadow-indigo-500/30'
              : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40',
          ]"
        >
          <span class="text-sm font-bold text-white tracking-wide"
            >Summarize</span
          >
          <span
            class="text-[10px] text-slate-300 leading-tight text-left font-medium"
            >Summarize selected text</span
          >
        </button>

        <!-- Quiz Button -->
        <button
          @click="triggerAction('quiz')"
          :class="[
            'flex flex-col items-start gap-1 p-4 rounded-2xl transition-all active:scale-95 border box-border backdrop-blur-md',
            activeMode === 'quiz'
              ? 'bg-pink-600/90 border-pink-500 shadow-lg shadow-pink-500/30'
              : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40',
          ]"
        >
          <span class="text-sm font-bold text-white tracking-wide">Quiz</span>
          <span
            class="text-[10px] text-slate-300 leading-tight text-left font-medium"
            >Generate quiz</span
          >
        </button>

        <!-- Presentation Button -->
        <button
          @click="triggerAction('presentation')"
          :class="[
            'flex flex-col items-start gap-1 p-4 rounded-2xl transition-all active:scale-95 border box-border backdrop-blur-md',
            activeMode === 'presentation'
              ? 'bg-emerald-600/90 border-emerald-500 shadow-lg shadow-emerald-500/30'
              : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40',
          ]"
        >
          <span class="text-sm font-bold text-white tracking-wide"
            >Presentation</span
          >
          <span
            class="text-[10px] text-slate-300 leading-tight text-left font-medium"
            >Generate PPT Slides</span
          >
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import InlineQuizPlayer from "../quiz/InlineQuizPlayer.vue";
import PresentationViewer from "../presentation/PresentationViewer.vue";
import ChatContextSwitcher from "../chat/ChatContextSwitcher.vue";
import { useChatLogic } from "../../composables/useChatLogic";
import { useToast } from "../../composables/useToast";
import api from "../../services/api";

const { renderMarkdown } = useChatLogic();

const props = defineProps({
  subject: { type: Object, default: null },
  grade: { type: [String, Object], default: null },
  activeUnit: { type: Object, default: null },
  subunits: { type: Array, default: () => [] },
  chatMessages: { type: Array, default: () => [] },
});

const removeMessage = (index) => {
  props.chatMessages.splice(index, 1);
};

const emit = defineEmits([
  "back",
  "toggle-menu",
  "select-subunit",
  "trigger-action",
  "send-chat",
  "context-change", // Emitted when user switches unit/subunit mid-chat
]);

const chatText = ref("");
const quizDifficulty = ref("mixed");
const quizQuestionType = ref(null);
const selectedSubunit = ref(null);
const activeMode = ref(null);
const contentContainer = ref(null);

// Upload state
const fileInput = ref(null);
const uploading = ref(false);
const uploadedFileCount = ref(0);
const { success: toastSuccess, error: toastError } = useToast();

watch(
  () => props.chatMessages.length,
  async () => {
    await nextTick();
    if (contentContainer.value) {
      contentContainer.value.scrollTop = contentContainer.value.scrollHeight;
    }
  }
);

const gradeTitle = computed(() => {
  if (typeof props.grade === "string") return props.grade;
  return props.grade?.title || "Grade";
});

const inputPlaceholder = computed(() => {
  if (selectedSubunit.value) {
    return `Ask Lumi about ${selectedSubunit.value.title}...`;
  }
  return "Ask Lumi anything about this chapter...";
});

// Get units from subject for ChatContextSwitcher
function getUnitsFromSubject() {
  if (!props.subject) return [];
  return props.subject.units || [];
}

// Handle context change from ChatContextSwitcher
function handleContextChange({ unit, subunit }) {
  selectedSubunit.value = subunit;
  emit("context-change", { unit, subunit });
}

function selectSubunit(subunit) {
  if (selectedSubunit.value?.id === subunit.id) {
    selectedSubunit.value = null; // Deselect
  } else {
    selectedSubunit.value = subunit;
  }
  // Emit with 'subtitle' key to match DefaultLayout's onSubtitleSelected handler expectation
  emit("select-subunit", { subtitle: selectedSubunit.value });
}

function triggerAction(action) {
  // Special handling for quiz: requires 2 steps (Select Mode -> Configure -> Click Again to Generate)
  if (action === "quiz") {
    if (activeMode.value !== "quiz") {
      activeMode.value = "quiz"; // Step 1: Show config
      return;
    }
    // Step 2: If already in quiz mode, proceed to generate
  } else {
    // For other modes, toggle or set
    if (activeMode.value === action) {
      activeMode.value = null; // Toggle off
      return;
    }
    activeMode.value = action;
  }

  // Emit with the selected subunit or active unit
  emit("trigger-action", {
    action,
    subunit: selectedSubunit.value,
    unit: props.activeUnit,
    quizConfig:
      action === "quiz"
        ? {
            difficulty: quizDifficulty.value,
            questionType: quizQuestionType.value,
          }
        : null,
  });
}

// Upload Logic
function triggerFileUpload() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  await processFiles(files);
}

async function processFiles(files) {
  uploading.value = true;
  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/student-upload/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        uploadedFileCount.value++;
        toastSuccess(`📎 Uploaded: ${file.name}`);
      } else {
        toastError(`Failed to upload ${file.name}`);
      }
    }

    if (uploadedFileCount.value > 0) {
      props.chatMessages.push({
        question: `📎 Uploaded ${files.length} file(s) for in-session analysis`,
        answer: `Great! I've processed your uploaded content. Ask me questions about it!`,
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    toastError("Upload failed");
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function sendChat() {
  if (!chatText.value.trim()) return;

  // Handle Upload Chat
  if (uploadedFileCount.value > 0) {
    const question = chatText.value.trim();
    chatText.value = "";

    // Add user message immediately
    props.chatMessages.push({
      question: question,
      answer: null,
    });

    // Scroll to bottom
    await nextTick();
    if (contentContainer.value)
      contentContainer.value.scrollTop = contentContainer.value.scrollHeight;

    try {
      const response = await api.post("/student-upload/ask", {
        question,
        grade: props.grade?.title || props.grade,
        subject: props.subject?.title || props.subject?.name,
        // Using session logic if available, or defaulting
      });

      const lastMsg = props.chatMessages[props.chatMessages.length - 1];
      lastMsg.answer = response.data.answer;

      if (response.data.sources?.length > 0) {
        lastMsg.answer += `\n\n📎 Sources: ${response.data.sources.join(", ")}`;
      }
    } catch (error) {
      const lastMsg = props.chatMessages[props.chatMessages.length - 1];
      lastMsg.answer = "❌ Error processing your question.";
    }
    return;
  }

  // Regular Chat
  emit("send-chat", {
    text: chatText.value.trim(),
    subunit: selectedSubunit.value,
    unit: props.activeUnit,
  });

  chatText.value = "";
}
</script>

<style scoped>
button {
  border: none;
  outline: none;
  cursor: pointer;
}

/* ChatGPT-like "Clean & Crisp" Markdown Styling */
:deep(.prose h3) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff; /* White title */
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  letter-spacing: -0.01em;
}

:deep(.prose h4) {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0; /* slater-200 */
  margin-top: 1.25em;
  margin-bottom: 0.5em;
}

:deep(.prose p) {
  margin-bottom: 1em;
  line-height: 1.7; /* Relaxed reading */
  color: #cbd5e1; /* slate-300 */
}

:deep(.prose strong) {
  font-weight: 700;
  color: #fff; /* Pop out bold text */
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

:deep(.prose ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin-bottom: 1em;
  color: #cbd5e1;
}

:deep(.prose ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin-bottom: 1em;
  color: #cbd5e1;
}

:deep(.prose li) {
  margin-bottom: 0.5em;
  padding-left: 0.25em;
  color: #cbd5e1 !important;
}

:deep(.prose li::before) {
  content: none !important; /* Remove the global colored dot */
  display: none !important;
}

:deep(.prose blockquote) {
  border-left: 4px solid #475569; /* slate-600 */
  padding-left: 1em;
  font-style: italic;
  color: #94a3b8; /* slate-400 */
  margin: 1.5em 0;
}

:deep(.prose code) {
  background-color: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  border: none !important;
  font-family: inherit !important;
  font-weight: 700 !important;
  color: #38bdf8 !important; /* sky-400 */
}

:deep(.prose pre) {
  background-color: #0f172a; /* slate-900 */
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 1.5em 0;
  border: 1px solid #334155; /* slate-700 */
}

:deep(.prose pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.9em;
}

/* Elegant Tables */
:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.95em;
}

:deep(.prose th) {
  border-bottom: 2px solid #334155; /* slate-700 */
  padding: 0.75em 1em;
  text-align: left;
  font-weight: 600;
  color: #f8fafc; /* slate-50 */
}

:deep(.prose td) {
  border-bottom: 1px solid #1e293b; /* slate-800 */
  padding: 0.75em 1em;
  color: #cbd5e1; /* slate-300 */
}

:deep(.prose tr:last-child td) {
  border-bottom: none;
}
</style>
