<template>
  <div
    class="flex h-screen overflow-hidden"
    :style="{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }"
  >
    <!-- Sidebar -->
    <ChatHistorySidebar
      ref="historySidebar"
      :active-session-id="currentSessionId"
      @select-session="loadSession"
      @new-chat="startNewChat"
      @session-deleted="handleSessionDeleted"
      class="shrink-0"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col relative w-full pt-16">
      <!-- Header -->
      <header
        class="h-16 border-b flex items-center justify-between px-6 z-20 absolute top-0 w-full"
        :style="{
          borderColor: 'var(--border-color)',
          background: 'var(--bg-surface-solid)',
        }"
      >
        <div class="flex items-center gap-3">
          <button
            @click="$router.push('/')"
            class="text-slate-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div
            v-if="loadingBook"
            class="animate-pulse h-6 w-48 rounded"
            :style="{ background: 'var(--surface-secondary)' }"
          ></div>
          <h1
            v-else
            class="text-xl font-bold truncate max-w-md"
            :style="{ color: 'var(--text-primary)' }"
          >
            {{ book?.title || "Book View" }}
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="book && book.fileUrl"
            @click="showReader = true"
            class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
          >
            📖 Read Book
          </button>

          <button
            @click="showProgress = true"
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-sm font-medium rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
          >
            📊 Progress
          </button>
        </div>
      </header>

      <!-- Chat Area -->
      <div class="flex-1 overflow-hidden relative flex flex-col">
        <!-- Background Particles -->
        <ParticlesBackground :variant="subjectParticleVariant" />

        <BottomComposer
          v-if="book"
          :active-mode="activeMode"
          :selected-subject="book.subject"
          :grade="book.grade"
          :chat-messages="chatMessages"
          :in-chat="true"
          :selected-unit="selectedUnit"
          :units="book.units || []"
          :session-id="currentSessionId"
          @session-created="(id) => (currentSessionId = id)"
          @set-mode="setMode"
          @send="handleSend"
          class="h-full flex flex-col relative z-10"
        />
      </div>

      <!-- Premium Reader Modal -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showReader"
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 md:p-8"
          @click.self="showReader = false"
        >
          <div
            class="bg-slate-900 border border-white/10 rounded-3xl w-full h-full max-w-7xl flex flex-col relative shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <!-- Sleek Header -->
            <div
              class="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-slate-800/50 backdrop-blur-sm"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-6 h-6"
                  >
                    <path
                      d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 class="text-white font-bold text-lg leading-none mb-1">
                    {{ book?.title }}
                  </h2>
                  <p
                    class="text-xs text-slate-400 font-medium uppercase tracking-wider"
                  >
                    Education Intelligence Reader
                  </p>
                </div>
              </div>

              <button
                @click="showReader = false"
                class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <!-- Scrollable PDF Content -->
            <div
              class="flex-1 bg-slate-950/50 relative overflow-hidden reader-container flex flex-col"
              @contextmenu.prevent
            >
              <template v-if="book?.fileUrl">
                <iframe
                  :src="
                    book.fileUrl +
                    '#toolbar=0&navpanes=0&scrollbar=1&view=FitH&statusbar=0&messages=0'
                  "
                  class="w-full h-full border-none"
                  title="Book Reader"
                ></iframe>

                <!-- Guard overlay for native toolbar protection -->
                <div
                  class="absolute top-0 left-0 right-0 h-14 z-10 bg-transparent pointer-events-auto cursor-default"
                ></div>
              </template>

              <div
                v-else
                class="flex items-center justify-center h-full text-slate-500 gap-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-8 h-8 opacity-20"
                >
                  <path
                    d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
                  />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span class="font-medium">Document could not be loaded</span>
              </div>
            </div>

            <!-- Sleek Footer -->
            <div
              class="px-8 py-4 border-t border-white/5 bg-slate-800/30 flex items-center justify-between"
            >
              <div class="flex items-center gap-6 text-sm text-slate-400">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                  ></div>
                  <span>Secure Viewer Active</span>
                </div>
                <div class="h-4 w-px bg-white/10"></div>
                <span>Scroll to navigate</span>
              </div>

              <div class="flex items-center gap-3">
                <div
                  class="px-3 py-1 rounded-lg bg-white/5 text-xs font-bold text-slate-300 border border-white/5"
                >
                  PDF 1.7
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Progress Modal -->
      <div
        v-if="showProgress"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="showProgress = false"
      >
        <div
          class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-[600px] max-w-full shadow-2xl relative"
        >
          <button
            @click="showProgress = false"
            class="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            ✕
          </button>
          <div class="mb-4">
            <h2 class="text-xl font-bold text-white">Your Progress</h2>
            <div class="text-slate-300 text-sm">
              Tracking study time for <b>{{ book?.title }}</b
              >.
            </div>
          </div>

          <ProgressChart
            :data="progressData"
            :selected-range="progressRange"
            @update:range="(val) => (progressRange = val)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import BottomComposer from "../../components/chat/BottomComposer.vue";
import ChatHistorySidebar from "../../components/chat/ChatHistorySidebar.vue";
import ProgressChart from "../../components/charts/ProgressChart.vue";
import ParticlesBackground from "../../components/ui/ParticlesBackground.vue";

const route = useRoute();
const router = useRouter();
const bookId = route.params.bookId as string;

// State
const book = ref<any>(null);
const loadingBook = ref(true);
const chatMessages = ref<any[]>([]);
const currentSessionId = ref<string | undefined>(undefined);
const activeMode = ref<string | null>(null); // 'summarize', 'quiz'
const selectedUnit = ref<any>(null);

const showProgress = ref(false);
const showReader = ref(false);
const progressData = ref<any[]>([]);
const progressRange = ref("weekly"); // 'weekly' or 'monthly'
const historySidebar = ref(null);

const subjectParticleVariant = computed(() => {
  if (!book.value || !book.value.subject) return "default";

  const title = (
    book.value.subject.title ||
    book.value.subject.name ||
    ""
  ).toLowerCase();

  if (title.includes("math")) return "math";
  if (
    title.includes("science") ||
    title.includes("physics") ||
    title.includes("chemistry") ||
    title.includes("biology")
  )
    return "science";
  if (title.includes("history")) return "history";
  if (
    title.includes("english") ||
    title.includes("literature") ||
    title.includes("language")
  )
    return "english";

  return "default";
});

// Methods
async function fetchBookDetails() {
  try {
    loadingBook.value = true;
    const res = await axios.get(`books/details/${bookId}`);
    book.value = res.data;
    console.log("[BookView DEBUG] Book loaded:", {
      bookId: book.value._id,
      subjectId: book.value.subject?._id || book.value.subject,
      gradeId: book.value.grade?._id || book.value.grade,
      subjectObj: book.value.subject,
    });
  } catch (e) {
    console.error("Failed to load book", e);
  } finally {
    loadingBook.value = false;
  }
}

async function fetchProgress() {
  if (!bookId) return;
  try {
    const endpoint =
      progressRange.value === "monthly"
        ? `progress/monthly/${bookId}`
        : `progress/weekly/${bookId}`;

    const res = await axios.get(endpoint);
    progressData.value = res.data;
  } catch (e) {
    console.error("Failed to load progress", e);
  }
}

watch(progressRange, fetchProgress);

watch(showProgress, (val) => {
  if (val) fetchProgress();
});

function setMode(mode: any) {
  activeMode.value = mode;
}

function startNewChat() {
  currentSessionId.value = undefined;
  chatMessages.value = [];
  chatMessages.value.push({
    answer: `**Hello!** I'm Lumi. Ask me anything about *${
      book.value?.title || "this book"
    }*! 📚`,
  });
}

// Navigation
function goBack() {
  if (showReader.value) {
    showReader.value = false;
  } else {
    router.back();
  }
}

// Keyboard shortcuts protection
function handleKeydown(e: KeyboardEvent) {
  if (!showReader.value) return;

  // Block Ctrl+S (Save) and Ctrl+P (Print)
  if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p")) {
    e.preventDefault();
    return false;
  }
}

function handleSessionDeleted(id: string) {
  if (currentSessionId.value === id) {
    startNewChat();
  }
}

async function loadSession(sessionId: string) {
  try {
    currentSessionId.value = sessionId;
    const res = await axios.get(`chat/${sessionId}`);
    const session = res.data;

    const uiMessages: any[] = [];

    for (const msg of session.messages) {
      if (msg.role === "user") {
        uiMessages.push({ question: msg.content });
      } else {
        const last = uiMessages[uiMessages.length - 1];
        if (last && last.question && !last.answer && !last.quiz) {
          last.answer = msg.content;
        } else {
          uiMessages.push({ answer: msg.content });
        }
      }
    }

    chatMessages.value = uiMessages;
    activeMode.value = null;
  } catch (e) {
    console.error("Failed to load session", e);
  }
}

async function handleSend(msgPayload: any) {
  console.log("Message sent", msgPayload);
}

onMounted(() => {
  fetchBookDetails();
  fetchProgress();
  startNewChat();
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>
