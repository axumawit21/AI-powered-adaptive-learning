<template>
  <div class="h-screen w-screen text-white overflow-hidden">
    <!-- Mobile Sidebar Drawer -->
    <MobileSidebar
      :is-open="mobileSidebarOpen"
      :history="history"
      :active-view="activeView"
      :current-session-id="currentSessionId"
      @close="mobileSidebarOpen = false"
      @new-chat="handleNewChat"
      @select-session="handleSelectSession"
      @settings="showSettings = true"
    />

    <!-- Desktop Sidebar (hidden on mobile) -->
    <div class="hidden md:block fixed left-0 top-0 h-screen w-64 z-20">
      <Sidebar
        :history="history"
        :active-view="activeView"
        :current-session-id="currentSessionId"
        @new-chat="handleNewChat"
        @select-session="handleSelectSession"
        @delete-session="handleDeleteSession"
        @progress-view="
          showProgress = true;
          showSettings = false;
        "
        @settings="showSettings = true"
        @reset-overlay="
          showProgress = false;
          showSettings = false;
        "
      />
    </div>

    <!-- Main Content Area -->
    <div
      class="md:ml-64 flex flex-col h-full max-h-screen overflow-hidden relative"
    >
      <ParticlesBackground :variant="subjectParticleVariant" />
      <div class="shrink-0 z-10" v-if="!(isMobile && activeUnit)">
        <Topbar
          :grade="grade"
          :subject="selectedSubject"
          :subjects="subjects"
          :mode="modeTitle"
          @update:grade="setGrade"
          @update:subject="onSubjectSelected"
          @subjects-loaded="onSubjectsLoaded"
          @toggle-mobile-sidebar="mobileSidebarOpen = true"
        />
      </div>
      <div class="flex-1 relative w-full overflow-y-auto custom-scrollbar p-3">
        <!-- Progress Dashboard Overlay (Legacy/Fallback if triggered via event) -->
        <ProgressDashboard
          v-if="showProgress"
          @close="showProgress = false"
          class="h-full w-full"
        />

        <!-- Main Content (Slot or Default Dashboard) -->
        <div v-else class="h-full w-full">
          <slot>
            <!-- Mobile Subunit View (shown on mobile when unit is selected) -->
            <MobileSubunitView
              v-if="isMobile && selectedSubject && activeUnit"
              :subject="selectedSubject"
              :grade="grade"
              :subunits="activeUnit.subtitles || activeUnit.subunits || []"
              :active-unit="activeUnit"
              :chat-messages="chatMessages"
              @select-subunit="onSubtitleSelected"
              @trigger-action="handleMobileAction"
              @send-chat="handleMobileChatSend"
              @toggle-menu="mobileSidebarOpen = true"
              @context-change="handleContextChange"
              @back="
                activeUnit = null;
                activeSubtitle = null;
              "
              class="h-full"
            />

            <!-- Desktop SubjectDetail (hidden on mobile) -->
            <SubjectDetail
              v-else-if="selectedSubject && activeUnit && !isChatStarted"
              :subject="selectedSubject"
              :activeUnit="activeUnit"
              @back="deselectSubject"
              @select-chapter="onUnitSelected"
              @select-subchapter="onSubtitleSelected"
              @start-chat="startChat"
              class="grow-0 shrink-0 max-h-[calc(100vh-120px)] overflow-y-auto h-full"
            />

            <!-- Main content / Map -->
            <div
              v-else
              class="w-full min-w-full max-w-full flex space-x-4 p-3 overflow-hidden h-full"
            >
              <div ref="mainAppContainer" class="grow shrink-0 h-full">
                <MainMap
                  v-if="subjects.length > 0 && !activeUnit"
                  :bookId="bookId"
                  :subjects="subjects"
                  :selectedSubject="selectedSubject"
                  :activeMode="activeMode"
                  :inAIChat="inAIChat"
                  :width="mainAppWidth"
                  :height="mainAppHeight"
                  @subject-selected="onSubjectSelected"
                  :inChat="inChat"
                  @update:inChat="(val) => (inChat = val)"
                  @unit-selected="onUnitSelected"
                  @subtitle-selected="onSubtitleSelected"
                  class="grow"
                />
              </div>
              <!-- Left Side Units Panel -->
              <UnitsNavigation
                v-if="
                  selectedSubject &&
                  selectedSubject.units?.length &&
                  !showProgress &&
                  !inAIChat &&
                  !inChat &&
                  !isChatStarted
                "
                :subject="selectedSubject"
                :activeUnit="activeUnit"
                :activeSubunit="activeSubtitle"
                @unit-selected="onUnitSelected"
                @subunit-selected="onSubtitleSelected"
                @read-book="openBookReader"
                class="grow-0 shrink-0 max-w-[300px] w-[300px] max-h-[calc(100vh-120px)] overflow-y-auto h-full"
              />
            </div>

            <!-- Bottom Composer (chat) -->
            <BottomComposer
              v-if="
                (inAIChat || inChat || activeUnit) &&
                !showProgress &&
                !showSettings &&
                !(isMobile && activeUnit)
              "
              :grade="grade"
              :active-mode="activeMode"
              :selectedSubject="selectedSubject || { name: 'Lumi AI' }"
              :selectedUnit="activeSubtitle || activeUnit"
              :units="selectedSubject?.units || []"
              :chat-messages="chatMessages"
              :inChat="inChat"
              @send="handleSend"
              @set-mode="(mode) => (activeMode = mode)"
              @context-change="handleContextChange"
              @focused="isInputFocused = true"
              @blurred="setTimeout(() => (isInputFocused = false), 200)"
              :class="{
                'h-full': isChatStarted,
              }"
            />
          </slot>
        </div>
      </div>
    </div>
    <SettingsModal v-if="showSettings" @close="showSettings = false" />

    <!-- Notification Toast -->
    <NotificationToast
      v-if="currentNotification"
      :notification="currentNotification"
      :show="showNotificationToast"
      @close="closeNotification"
      @snooze="handleSnooze"
    />

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="showDeleteConfirm = false"
    >
      <div
        class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-[400px] max-w-full shadow-2xl"
      >
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">🗑️</span>
          <h3 class="text-xl font-bold text-white">Delete Chat Session?</h3>
        </div>
        <p class="text-slate-300 mb-6">
          Are you sure you want to delete this chat session? This action cannot
          be undone.
        </p>
        <div class="flex gap-3 justify-end">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Note Button -->
    <QuickNote @saved="handleQuickNoteSaved" />

    <!-- Premium Book Reader Modal -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showBookReader"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 md:p-8"
        @click.self="showBookReader = false"
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
                  {{ selectedSubject?.title || "Book Reader" }}
                </h2>
                <p
                  class="text-xs text-slate-400 font-medium uppercase tracking-wider"
                >
                  Education Intelligence Reader
                </p>
              </div>
            </div>

            <button
              @click="showBookReader = false"
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
            <template v-if="selectedSubject?.fileUrl">
              <iframe
                :src="
                  selectedSubject.fileUrl +
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { useElementSize } from "@vueuse/core";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";

import Sidebar from "../components/navigation/Sidebar.vue";
import MobileSidebar from "../components/navigation/MobileSidebar.vue";
import MobileSubunitView from "../components/navigation/MobileSubunitView.vue";
import Topbar from "../components/navigation/Topbar.vue";
import MainMap from "../components/subject/MainMap.vue";
import BottomComposer from "../components/chat/BottomComposer.vue";
import UnitsNavigation from "../components/navigation/UnitsNavigation.vue";
import SubjectDetail from "../components/subject/SubjectDetail.vue";
import ProgressDashboard from "../views/student/ProgressView.vue";
import SettingsModal from "../components/common/SettingsModal.vue";
import NotificationToast from "../components/notes/NotificationToast.vue";
import ParticlesBackground from "../components/ui/ParticlesBackground.vue";

import QuickNote from "../components/notes/QuickNote.vue";
import { useProgress } from "../composables/useProgress";
import { useNotifications } from "../composables/useNotifications";
import { useAuth } from "../composables/useAuth";
import { useGlobalState } from "../composables/useGlobalState";
import { useToast } from "../composables/useToast";
import { useChatLogic } from "../composables/useChatLogic"; // Import the shared logic

/* --- State --- */
const showDeleteConfirm = ref(false);
const sessionToDelete = ref(null);
const history = ref([]);
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { sendMessage } = useChatLogic(); // Use the shared logic

/* --- Mobile State --- */
const mobileSidebarOpen = ref(false);
const windowWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1024,
);

// Track window resize for mobile detection
function handleWindowResize() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => {
  window.addEventListener("resize", handleWindowResize);
});

// Computed property for mobile detection
const isMobile = computed(() => windowWidth.value < 768);

watch(
  () => route.path,
  () => {
    showProgress.value = false;
  },
);

/* --- Notifications --- */
const { notifications, clearNotification } = useNotifications();
const { user } = useAuth();
const showNotificationToast = ref(false);
const currentNotification = ref(null);
// Use Global State
const { grade, subjects, selectedSubject, activeUnit, activeSubtitle } =
  useGlobalState();
const bookId = ref(null);

const activeMode = ref(null);
const inChat = ref(false);
const inAIChat = ref(false);

const currentSessionId = ref(null);
const showProgress = ref(false);
const showSettings = ref(false);
const showBookReader = ref(false);
const mainAppContainer = ref(null);
const isInputFocused = ref(false);

const { startTracking, stopTracking } = useProgress();

/* --- Map dimensions --- */
const { width, height } = useElementSize(mainAppContainer);
const mainAppWidth = ref(width.value || 700);
const mainAppHeight = ref(height.value || 400);
watch(width, () => (mainAppWidth.value = width.value));
watch(height, () => (mainAppHeight.value = height.value));

const chatMessages = ref([]);
const isChatStarted = computed(() => chatMessages.value.length > 0);

const activeView = computed(() => {
  if (showProgress.value) return "progress";

  // Check routes to prevent "New Chat" highlighing on other pages
  const path = route.path;
  if (path.startsWith("/progress")) return "progress";
  if (path.startsWith("/gamification")) return "gamification";
  if (path.startsWith("/notes")) return "notes";
  if (path.startsWith("/exam")) return "exam";

  // If no overlays and no other route match, we are in chat mode (default)
  return "chat";
});

const modeTitle = computed(() => {
  if (activeMode.value === "summarize") return "Summary Mode";
  if (activeMode.value === "quiz") return "Quiz Mode";
  return "Explore";
});

const subjectParticleVariant = computed(() => {
  if (!selectedSubject.value) return "default";

  const title = (
    selectedSubject.value.name ||
    selectedSubject.value.title ||
    ""
  ).toLowerCase();

  if (title.includes("math")) return "math";
  if (title.includes("physics")) return "physics";
  if (title.includes("chemistry")) return "chemistry";
  if (title.includes("biology") || title.includes("life")) return "biology";
  if (title.includes("geography") || title.includes("earth"))
    return "geography";
  if (title.includes("history")) return "history";
  if (
    title.includes("english") ||
    title.includes("literature") ||
    title.includes("language")
  )
    return "english";

  return "default";
});

// Track progress when subject is selected
watch(selectedSubject, (newVal) => {
  if (newVal && newVal.id) {
    // Use mongoId if available, otherwise fallback to id (which might be grade-subject string)
    // In onSubjectSelected, we set mongoId.
    const realBookId = newVal.mongoId || newVal.id;
    const gradeTitle = grade.value?.title || "Unknown Grade";
    const subjectTitle = newVal.name || newVal.title || "Unknown Subject";
    // We pass IDs as null or if we have them?
    // Ideally pass grade.value.id and newVal.id (which might be bookId).
    // Let's pass what we have.
    const gradeId = grade.value?._id || grade.value?.id;
    const subjectId = newVal.id; // normalized subject has id

    startTracking(realBookId, gradeId, subjectId, gradeTitle, subjectTitle);
  } else {
    stopTracking();
  }
});

onMounted(async () => {
  await fetchHistory();

  // Request browser notification permission
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }

  // Connect to notification WebSocket
  const token = localStorage.getItem("token");
  if (token) {
    try {
      // Decode JWT to get userId
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("🔍 Debug: Token Payload:", payload);

      const userId = payload.userId || payload.sub;
      console.log("🔍 Debug: Extracted User ID:", userId);

      if (userId) {
        connect(userId);
        console.log("✅ Triggering connection for userId:", userId);
      } else {
        console.error("❌ No User ID found in token!");
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }
  // Check for session query param
  if (route.query.session) {
    console.log("Found session in query:", route.query.session);
    // Use a small timeout to ensure everything is ready
    setTimeout(() => {
      handleSelectSession(route.query.session);
      // Optional: clear the query param so refreshing doesn't sticky the session
      // router.replace({ path: '/', query: {} });
    }, 500);
  }
});

// Watch for new notifications
watch(
  notifications,
  (newNotifications) => {
    if (newNotifications.length > 0 && !currentNotification.value) {
      currentNotification.value = newNotifications[0];
      showNotificationToast.value = true;
    }
  },
  { deep: true },
);

function closeNotification() {
  if (currentNotification.value) {
    clearNotification(currentNotification.value.noteId);
    currentNotification.value = null;
    showNotificationToast.value = false;

    // Show next notification if any
    if (notifications.value.length > 0) {
      setTimeout(() => {
        currentNotification.value = notifications.value[0];
        showNotificationToast.value = true;
      }, 500);
    }
  }
}

function handleSnooze(minutes) {
  closeNotification();
}

function handleQuickNoteSaved() {
  // Optionally refresh notes or show success message
  console.log("Quick note saved!");
}

/* --- History Handling --- */
async function fetchHistory() {
  try {
    const res = await axios.get("chat/history");
    // Filter history by currently selected subject
    const allHistory = res.data.map((h) => ({
      _id: h._id,
      title: h.title,
      subject: h.subject,
      grade: h.grade,
      time: new Date(h.updatedAt || h.createdAt).toLocaleDateString(),
    }));

    // If a subject is selected, filter history to show only that subject's sessions
    if (selectedSubject.value && selectedSubject.value.name) {
      const subjectName = selectedSubject.value.name.toLowerCase();
      const subjectTitle = (selectedSubject.value.title || "").toLowerCase();

      history.value = allHistory.filter((h) => {
        const historySubject = (h.subject || "").toLowerCase();
        return (
          historySubject === subjectName || historySubject === subjectTitle
        );
      });
    } else {
      // Show all history if no subject selected
      history.value = allHistory;
    }
  } catch (e) {
    console.error("Failed to fetch history", e);
  }
}

async function handleSelectSession(sessionId) {
  // If we are NOT on the dashboard (home) page, we must navigate there first
  if (route.path !== "/") {
    console.log("Redirecting to dashboard for chat session:", sessionId);
    router.push({ path: "/", query: { session: sessionId } });
    return;
  }

  // Clear any existing unit/subtitle state FIRST to hide units panel

  activeUnit.value = null;
  activeSubtitle.value = null;

  // Set chat states immediately to show chat interface
  inAIChat.value = true;
  inChat.value = true;

  try {
    currentSessionId.value = sessionId;
    const res = await axios.get(`chat/${sessionId}`);
    const session = res.data;

    // Always clear before loading
    chatMessages.value = [];

    // Parse and group messages
    const grouped = [];
    let currentPair = {};
    session.messages.forEach((msg) => {
      if (msg.role === "user") {
        if (currentPair.question) {
          grouped.push(currentPair);
          currentPair = {};
        }
        currentPair.question = msg.content;
      } else if (msg.role === "assistant") {
        currentPair.answer = msg.content;
        grouped.push(currentPair);
        currentPair = {};
      }
    });
    if (currentPair.question) grouped.push(currentPair);

    chatMessages.value = grouped;

    // Restore Context if available
    if (session.grade && session.subject) {
      // Try to match grade/subject
      const found = subjects.value.find(
        (s) => s.name === session.subject || s.title === session.subject,
      );

      if (found) {
        // Load subject as context for chat only
        selectedSubject.value = {
          ...found,
          skipUnitsView: true,
        };
      } else {
        // Fallback: Create a temporary visual subject object
        console.warn(
          "Could not find subject for session:",
          session.subject,
          "Creating fallback.",
        );
        selectedSubject.value = {
          id: "history-" + session.subject,
          name: session.subject,
          title: session.subject,
          units: [],
          isHistorical: true,
        };
      }
    } else {
      // If session has no metadata or is "General"
      if (session.subject === "General" || !session.subject) {
        selectedSubject.value = { name: "Lumi AI", grade: null };
      }
    }
  } catch (e) {
    console.error("Failed to load session", e);
  }
}

async function handleDeleteSession(sessionId) {
  sessionToDelete.value = sessionId;
  showDeleteConfirm.value = true;
}

async function confirmDelete() {
  if (!sessionToDelete.value) return;

  try {
    await axios.delete(`chat/${sessionToDelete.value}`);
    await fetchHistory();

    // If the deleted session was the active one, reset chat
    if (currentSessionId.value === sessionToDelete.value) {
      currentSessionId.value = null;
      chatMessages.value = [];
      inChat.value = false;
      inAIChat.value = false;
    }
  } catch (e) {
    console.error("Failed to delete session", e);
  } finally {
    showDeleteConfirm.value = false;
    sessionToDelete.value = null;
  }
}

/* --- Handle subjects loaded from Topbar --- */
function onSubjectsLoaded(loadedSubjects) {
  // Map loaded subjects to the format expected by MainMap
  const mappedSubjects = loadedSubjects.map((s, idx) => ({
    id: s.id || s._id,
    name: s.name || s.title || s.subject?.title,
    bg: s.bg || null,
    units: s.units || [],
    bookId: s.bookId || s._id,
    fileUrl: s.fileUrl, // Include the PDF file URL from Topbar
  }));

  subjects.value = mappedSubjects;

  // If we have a selected subject (especially from restoring a session), try to preserve it
  if (selectedSubject.value) {
    // 1. If it was a "historical" fallback, accept a real match now
    if (selectedSubject.value.isHistorical) {
      const targetName =
        selectedSubject.value.name || selectedSubject.value.title;
      const found = mappedSubjects.find(
        (s) => s.name === targetName || s.title === targetName,
      );
      if (found) {
        console.log(
          "Restoring real subject from historical context:",
          found.name,
        );
        selectedSubject.value = found;
        return;
      }
    }

    // 2. If we are in an active session, try to keep the current subject if it exists in the new list
    if (currentSessionId.value) {
      const found = mappedSubjects.find(
        (s) => s.id === selectedSubject.value.id,
      );
      if (found) {
        // Refresh the object reference
        selectedSubject.value = found;
        return;
      }
    }
  }

  // Original Default: Reset selected subject when grade changes (and we aren't restoring)
  selectedSubject.value = null;
  activeUnit.value = null;
}

/* --- Mobile Action Handlers --- */
function handleMobileAction(payload) {
  const { action, subunit, unit, quizConfig } = payload;
  const targetUnit = subunit || unit;

  // Set the active mode
  activeMode.value = action;

  if (subunit) {
    activeSubtitle.value = subunit;
  }

  // Start chat/action
  inChat.value = true;
  isChatStarted.value = true;

  console.log("[Mobile Action]", action, "for", targetUnit?.title);

  // Use the shared send logic
  sendMessage({
    text: "", // No text input for button actions usually, or we can construct prompt?
    // Actually `useChatLogic` handles activeMode 'summarize'/'quiz'/'presentation' automatically if unit is passed
    // But `useChatLogic` usually expects `text` or `unit`.
    // If we pass `activeMode`, the composable logic says:
    // "If no text but we have a selected unit and active mode, use unit title" -> then executes logic for activeMode.
    // So we just need to pass the correct activeMode and unit.
    unit: targetUnit,
    activeMode: action,
    grade: grade.value,
    subject: selectedSubject.value,
    sessionId: currentSessionId.value,
    chatMessagesRef: chatMessages,
    onSessionCreated: (id) => {
      currentSessionId.value = id;
    },
    // Pass the quiz configuration (difficulty, type) if present
    quizConfig: quizConfig,
  });
}

function handleMobileChatSend(payload) {
  const { text, subunit, unit } = payload;

  // Set the active subtitle if provided
  if (subunit) {
    activeSubtitle.value = subunit;
  }

  // Start chat
  inChat.value = true;
  isChatStarted.value = true;

  console.log("[Mobile Chat Send]", text);

  // Call shared sendMessage
  sendMessage({
    text: text,
    unit: subunit || unit,
    activeMode: "chat", // Explicitly chat
    grade: grade.value,
    subject: selectedSubject.value,
    sessionId: currentSessionId.value,
    chatMessagesRef: chatMessages,
    onSessionCreated: (id) => {
      currentSessionId.value = id;
    },
  });
}

function parseSubjectId(subjectSimple) {
  if (!subjectSimple) return null;

  if (subjectSimple.id && !subjectSimple.id.includes("-")) {
    return {
      gradeKey: grade.value.toLowerCase(),
      subjectKey: (subjectSimple.name || "").toLowerCase().replace(/\s+/g, "-"),
    };
  }

  const parts = subjectSimple.id.split("-");
  return {
    gradeKey: parts[0],
    subjectKey: parts.slice(1).join("-"),
  };
}

/* --- Event Handlers --- */
async function onSubjectSelected(subjectSimple, autoSelectUnit = false) {
  if (!subjectSimple) {
    selectedSubject.value = null;
    return;
  }

  console.log("Subject selected:", subjectSimple);

  // The subject from UniverseOrbit/Topbar already has units
  // Normalize the subject structure
  const normalized = {
    id: subjectSimple.id || subjectSimple._id || subjectSimple.bookId,
    name: subjectSimple.name || subjectSimple.title,
    grade: grade.value?.title || "Unknown",
    bg: subjectSimple.bg || subjectSimple.colorClass || null,
    mongoId: subjectSimple.bookId || subjectSimple._id,
    fileUrl: subjectSimple.fileUrl || null, // Add fileUrl for PDF reading
    units: (subjectSimple.units || []).map((u, uidx) => ({
      id: u.id || `unit${uidx + 1}`,
      title: u.title || u.name || `Unit ${uidx + 1}`,
      unitNumber: u.unitNumber || uidx + 1,
      pageStart: u.pageStart,
      pageEnd: u.pageEnd,
      subtitles: (u.subChapters || u.subtitles || []).map((sc, sidx) => ({
        id: sc.id || `${uidx + 1}.${sidx + 1}`,
        title: sc.title || sc.name || `Sub ${sidx + 1}`,
        // Preserve subunitNumber for useChatLogic to detect subunit selection
        subunitNumber:
          sc.subunitNumber ||
          sc.id ||
          `${u.unitNumber || uidx + 1}.${sidx + 1}`,
        // CRITICAL: Include unitNumber from parent so retrieval uses correct unit
        unitNumber: u.unitNumber || uidx + 1,
        parentUnitTitle: u.title || u.name || `Unit ${uidx + 1}`,
        parentUnitNumber: u.unitNumber || uidx + 1,
        pageStart: sc.pageStart,
        pageEnd: sc.pageEnd,
      })),
    })),
  };

  selectedSubject.value = normalized;

  // Update subject entry in subjects list (for map/bg)
  const idx = subjects.value.findIndex((s) => s.id === normalized.id);
  if (idx >= 0) {
    subjects.value[idx] = {
      ...subjects.value[idx],
      name: normalized.name,
      bg: normalized.bg,
    };
  }

  // Reset unit/subtitle/chat state
  activeUnit.value = null;
  activeSubtitle.value = null;
  inChat.value = false;
  inAIChat.value = false;
  chatMessages.value = []; // Clear visual messages
  currentSessionId.value = null; // Force new session creation on next message

  // Refresh chat history to show only this subject's sessions
  await fetchHistory();

  if (autoSelectUnit && selectedSubject.value.units.length > 0) {
    onUnitSelected(selectedSubject.value.units[0]);
  }
}

function openBookReader() {
  console.log("Opening book reader, selectedSubject:", selectedSubject.value);

  if (selectedSubject.value?.fileUrl) {
    showBookReader.value = true;
  } else {
    toast.error(
      "Book file not available. Please check if the book was uploaded correctly.",
    );
  }
}

function onUnitSelected(payload) {
  // If payload has 'unit' property (from event), use it. Otherwise assume payload IS the unit.
  const unit = payload.unit || payload;

  // Toggle if clicking same unit? Or just set it.
  if (activeUnit.value && activeUnit.value.id === unit.id) {
    // Optional: collapse if clicking same? For now let's just keep it active.
  } else {
    activeUnit.value = unit;
  }

  // Do NOT start chat yet. Wait for subtitle selection or explicit chat start.
  inChat.value = false;
  inAIChat.value = false;
}

function onSubtitleSelected(payload) {
  activeSubtitle.value = payload.subtitle;
  inChat.value = true;
  inAIChat.value = false;
  chatMessages.value = [];
  currentSessionId.value = null; // New context, new session (or we could persist?)
}

function onLumiClicked() {
  inAIChat.value = true;
  inChat.value = false;
  selectedSubject.value = null;
  activeUnit.value = null;
  activeSubtitle.value = null;
  chatMessages.value = [];
  currentSessionId.value = null;
}

function setGrade(g) {
  grade.value = g;
  // Reset subject selection when grade changes
  selectedSubject.value = null;
  activeUnit.value = null;
  currentSessionId.value = null;
}

function deselectSubject() {
  selectedSubject.value = null;
  activeUnit.value = null;
  activeSubtitle.value = null;
  chatMessages.value = [];
  currentSessionId.value = null;
}

// Handle context change from ChatContextSwitcher (unit/subunit switch mid-chat)
function handleContextChange({ unit, subunit }) {
  console.log("[Context Change]", { unit, subunit });

  // Update active unit and subtitle
  activeUnit.value = unit;
  activeSubtitle.value = subunit;

  // Clear chat messages for fresh context (Option 1 - approved by user)
  chatMessages.value = [];
  currentSessionId.value = null;

  // Keep chat mode active
  inChat.value = true;
}

function handleNewChat() {
  selectedSubject.value = null;
  activeUnit.value = null;
  activeSubtitle.value = null;
  activeMode.value = null;
  inChat.value = false;
  inAIChat.value = false;
  chatMessages.value = [];
  currentSessionId.value = null;
  showProgress.value = false;
  showSettings.value = false;

  // Navigate to dashboard if not already there
  router.push("/");
}

// Replaced original handleSend with logic that delegates to sendMessage
async function handleSend(payload) {
  const question = payload.text;

  // Delegate to shared logic with chat mode
  // Note: handleSend is triggered by BottomComposer usually, but BottomComposer now uses useChatLogic directly.
  // However, if other components use this (like QuickNote or legacy calls), we should keep it.
  // If BottomComposer emits 'send', it might duplicate if we have listener here?
  // BottomComposer no longer emits 'send' in my previous edit?
  // Wait, I kept `emit('send')` in `BottomComposer` but commented it... no, I didn't change the emit list significantly but logic inside specific handlers.
  // Actually, BottomComposer calls `sendMessage` internally now.
  // Does it still emit 'send'?
  // In `BottomComposer.vue`: `async function send() { ... await sendMessage(...) ... }`
  // It does NOT emit 'send' anymore in the updated code (I replaced the body).
  // So this `handleSend` in DefaultLayout is only for fallback or other components.

  await sendMessage({
    text: question,
    unit: activeSubtitle.value || activeUnit.value,
    activeMode: activeMode.value || "chat",
    grade: grade.value,
    subject: selectedSubject.value,
    sessionId: currentSessionId.value,
    chatMessagesRef: chatMessages,
    onSessionCreated: (id) => {
      currentSessionId.value = id;
    },
  });
}

onMounted(() => {
  if (user.value) {
    fetchHistory();
  }
});

watch(user, (newUser) => {
  if (newUser) {
    fetchHistory();
  }
});
</script>
