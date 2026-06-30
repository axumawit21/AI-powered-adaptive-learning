<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        @click="$emit('close')"
      ></div>
    </Transition>

    <!-- Sidebar Drawer -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="isOpen"
        class="fixed left-0 top-0 w-72 h-full flex flex-col glass-panel border-r z-50 overflow-hidden"
        :style="{ borderColor: 'var(--border-color)' }"
      >
        <!-- Background Decor -->
        <div
          class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0"
        >
          <div
            class="absolute top-[-10%] left-[-10%] w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"
          ></div>
          <div
            class="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl"
          ></div>
        </div>

        <div
          class="flex-1 flex flex-col min-h-0 z-10 px-4 py-6 overflow-y-auto"
        >
          <!-- Header with Logo and Close -->
          <div class="flex items-center justify-between mb-8 pl-2">
            <div class="flex items-center gap-3">
              <div class="relative w-8 h-8">
                <div
                  class="absolute inset-0 bg-cyan-500 rounded-lg blur opacity-50 animate-pulse"
                ></div>
                <div
                  class="relative w-full h-full bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-cyan-400 font-bold"
                >
                  H
                </div>
              </div>
              <h1
                class="font-bold text-xl tracking-tight mb-0"
                :style="{ color: 'var(--text-primary)' }"
              >
                Henon
              </h1>
            </div>

            <!-- Close Button -->
            <button
              @click="$emit('close')"
              class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <!-- New Chat Button -->
          <div class="mb-8">
            <SidebarItem
              title="New Chat"
              :icon="`<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;w-full h-full&quot;><path d=&quot;M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z&quot;/><path d=&quot;M12 7v6&quot;/><path d=&quot;M9 10h6&quot;/></svg>`"
              color="#8b5cf6"
              @click="handleNewChat"
            />
          </div>

          <!-- Main Navigation -->
          <div class="space-y-1 mb-8">
            <p
              class="text-[10px] font-bold uppercase tracking-widest px-4 mb-2"
              style="color: #e0e0e0"
            >
              Menu
            </p>

            <SidebarItem
              title="Learning Path"
              :icon="`<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;w-full h-full&quot;><path d=&quot;M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z&quot;/><path d=&quot;M8 7h6&quot;/><path d=&quot;M8 11h8&quot;/></svg>`"
              to="/progress"
              :active="activeView === 'progress'"
              color="#22d3ee"
              @click="$emit('close')"
            />

            <SidebarItem
              title="Notes"
              :icon="`<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;w-full h-full&quot;><path d=&quot;M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7&quot;/><path d=&quot;M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z&quot;/></svg>`"
              to="/notes"
              :active="activeView === 'notes'"
              color="#34d399"
              @click="$emit('close')"
            />

            <SidebarItem
              title="Exam Center"
              :icon="`<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;w-full h-full&quot;><path d=&quot;M22 10v6M2 10l10-5 10 5-10 5z&quot;/><path d=&quot;M6 12v5c3 3 9 3 12 0v-5&quot;/></svg>`"
              to="/exam"
              :active="activeView === 'exam'"
              color="#f472b6"
              @click="$emit('close')"
            />
          </div>

          <!-- History Section -->
          <div class="flex-1 min-h-0 flex flex-col">
            <div class="flex items-center justify-between px-2 mb-3">
              <h3
                class="text-[10px] font-bold uppercase tracking-widest"
                style="color: #e0e0e0"
              >
                Library
              </h3>
              <!-- Search Bar -->
              <div
                class="relative flex items-center transition-all duration-300"
                :class="isSearchOpen ? 'w-full' : 'w-8 justify-end'"
              >
                <!-- Search Input -->
                <input
                  v-if="isSearchOpen"
                  ref="searchInput"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search chats..."
                  class="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-1 pl-2 pr-8 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-500"
                  @blur="
                    if (!searchQuery) {
                      isSearchOpen = false;
                    }
                  "
                  @keydown.esc="
                    searchQuery = '';
                    isSearchOpen = false;
                  "
                />

                <!-- Search Icon (Toggle) -->
                <button
                  @click="toggleSearch"
                  class="text-slate-400 hover:text-white transition-colors absolute right-0 p-1"
                  :class="{
                    'pointer-events-none': isSearchOpen && !searchQuery,
                  }"
                  title="Search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-4 h-4"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>

                <!-- Clear Button (only when open and has query) -->
                <button
                  v-if="isSearchOpen && searchQuery"
                  @click="
                    searchQuery = '';
                    $refs.searchInput.focus();
                  "
                  class="absolute right-7 text-slate-500 hover:text-white transition-colors p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-3 h-3"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <div
              class="overflow-y-auto pr-1 flex-1 min-h-0 -mr-2 space-y-4 pb-6 custom-scrollbar"
            >
              <SidebarSubjectGroup
                v-for="group in groupedHistory"
                :key="group.subject"
                :subject="formatSubjectName(group.subject)"
                :count="group.chats.length"
                :icon="group.icon"
                :color="group.color"
                :chats="group.chats"
                :current-session-id="currentSessionId"
                @select-session="selectSession"
                @delete-session="(id) => $emit('delete-session', id)"
              />

              <!-- Empty State -->
              <div
                v-if="groupedHistory.length === 0"
                class="text-center py-8 px-4 opacity-50"
              >
                <div
                  class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-6 h-6 text-slate-500"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <span class="text-xs text-slate-400"
                  >No active knowledge bases</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div
          class="flex items-center justify-between mt-auto shrink-0 p-4 border-t z-10"
          :style="{
            borderColor: 'var(--border-subtle)',
            background: 'var(--glass-bg)',
          }"
        >
          <button
            @click="openSettings"
            class="flex items-center gap-2 p-2 rounded-lg transition-colors group"
            :style="{ color: 'var(--text-secondary)' }"
          >
            <span class="group-hover:text-cyan-400 transition-colors">
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
                <path
                  d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span
              class="inline-block md:hidden xl:inline"
              style="color: var(--text-secondary)"
              >Settings</span
            >
          </button>

          <!-- Theme Toggle -->
          <ThemeToggle />

          <button
            @click="handleLogout"
            class="flex items-center gap-2 p-2 rounded-lg transition-colors group"
            :style="{ color: 'var(--text-secondary)' }"
          >
            <span class="group-hover:scale-110 transition-transform">
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
            </span>
            <span
              class="inline-block md:hidden xl:inline"
              :style="{ color: 'var(--text-secondary)' }"
              >Logout</span
            >
          </button>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../../composables/useAuth";
import SidebarItem from "./SidebarItem.vue";
import SidebarSubjectGroup from "./SidebarSubjectGroup.vue";
import ThemeToggle from "../ui/ThemeToggle.vue";
import { getSubjectMeta } from "../../utils/subjectIcons";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  history: { type: Array, default: () => [] },
  activeView: { type: String, default: "chat" },
  currentSessionId: { type: String, default: null },
});

const emit = defineEmits([
  "close",
  "new-chat",
  "select-session",
  "settings",
  "delete-session",
]);

const router = useRouter();
const { user, logout } = useAuth();
const searchQuery = ref("");
const isSearchOpen = ref(false);
const searchInput = ref(null);

function handleNewChat() {
  emit("new-chat");
  emit("close");
}

function openSettings() {
  emit("settings");
  emit("close");
}

function handleLogout() {
  logout();
  router.push("/login");
  emit("close");
}

function selectSession(sessionId) {
  emit("select-session", sessionId);
  emit("close");
}

function toggleSearch() {
  if (isSearchOpen.value && !searchQuery.value) {
    isSearchOpen.value = false;
  } else {
    isSearchOpen.value = true;
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
}

// Group history by Subject
const groupedHistory = computed(() => {
  const groups = {};
  const query = searchQuery.value.toLowerCase().trim();

  props.history.forEach((session) => {
    // Filter based on search query
    if (
      query &&
      !session.title?.toLowerCase().includes(query) &&
      !session.subject?.toLowerCase().includes(query)
    ) {
      return;
    }

    let subject = session.subject || "General";
    if (!groups[subject]) {
      groups[subject] = {
        subject,
        chats: [],
        ...getSubjectMeta(subject),
      };
    }
    groups[subject].chats.push(session);
  });

  return Object.values(groups).sort((a, b) => b.chats.length - a.chats.length);
});

function formatSubjectName(name) {
  if (!name) return "";
  return name
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
</script>

<style scoped>
/* Remove default button styling for any raw buttons left */
button {
  border: none;
  outline: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>
