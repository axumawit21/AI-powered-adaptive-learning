<template>
  <div
    class="h-full flex flex-col w-64 border-r transition-colors"
    :style="{
      background: 'var(--bg-primary)',
      borderColor: 'var(--border-color)',
    }"
  >
    <div
      class="p-4 border-b flex justify-between items-center"
      :style="{ borderColor: 'var(--border-color)' }"
    >
      <h2
        class="text-lg font-semibold"
        :style="{ color: 'var(--text-primary)' }"
      >
        Chat History
      </h2>
      <button
        @click="$emit('new-chat')"
        class="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors text-white text-sm"
        title="New Chat"
      >
        + New
      </button>
    </div>

    <div class="p-2">
      <input
        v-model="search"
        type="text"
        placeholder="Search chats..."
        class="w-full text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500 border transition-colors"
        :style="{
          background: 'var(--input-bg)',
          color: 'var(--text-primary)',
          borderColor: 'var(--input-border)',
        }"
      />
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div
        v-for="session in filteredSessions"
        :key="session._id"
        @click="$emit('select-session', session._id)"
        class="group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
        :class="
          activeSessionId === session._id
            ? 'bg-cyan-500/10 border-cyan-500/30'
            : 'border-transparent' // Removed hover:bg-slate-800/50 here, handling in style style
        "
        :style="
          activeSessionId === session._id
            ? {
                background: 'var(--accent-primary-alpha)',
                borderColor: 'var(--accent-primary)',
              }
            : {
                // Normal State
              }
        "
        @mouseenter="
          $event.target.style.background =
            activeSessionId === session._id
              ? 'var(--accent-primary-alpha)'
              : 'var(--bg-elevated)'
        "
        @mouseleave="
          $event.target.style.background =
            activeSessionId === session._id
              ? 'var(--accent-primary-alpha)'
              : 'transparent'
        "
      >
        <div
          class="truncate text-sm flex-1 mr-2 transition-colors"
          :style="{ color: 'var(--text-primary)' }"
        >
          {{ session.title || "Untitled Chat" }}
          <div
            class="text-xs mt-0.5"
            :style="{ color: 'var(--text-secondary)' }"
          >
            {{ formatDate(session.updatedAt || session.createdAt) }}
          </div>
        </div>

        <button
          @click.stop="triggerDelete(session._id)"
          class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-all"
          title="Delete"
        >
          🗑️
        </button>
      </div>

      <div
        v-if="filteredSessions.length === 0"
        class="text-center text-slate-500 text-sm mt-4"
      >
        No chats found
      </div>
    </div>

    <ConfirmModal
      :show="showDeleteConfirm"
      title="Delete Chat"
      message="Are you sure you want to delete this chat session? This action cannot be undone."
      @confirm="handleConfirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import ConfirmModal from "../common/ConfirmModal.vue";

const props = defineProps({
  activeSessionId: String,
});

const emit = defineEmits(["select-session", "new-chat", "session-deleted"]);

const sessions = ref([]);
const search = ref("");
const showDeleteConfirm = ref(false);
const sessionToDelete = ref(null);

const filteredSessions = computed(() => {
  if (!search.value) return sessions.value;
  return sessions.value.filter((s) =>
    s.title?.toLowerCase().includes(search.value.toLowerCase())
  );
});

async function fetchHistory() {
  try {
    const res = await axios.get("chat/history");
    sessions.value = res.data || [];
  } catch (e) {
    console.error("Failed to fetch history", e);
  }
}

function triggerDelete(id) {
  sessionToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function handleConfirmDelete() {
  if (!sessionToDelete.value) return;
  try {
    await axios.delete(`chat/${sessionToDelete.value}`);
    sessions.value = sessions.value.filter(
      (s) => s._id !== sessionToDelete.value
    );
    emit("session-deleted", sessionToDelete.value);
  } catch (e) {
    console.error("Failed to delete session", e);
  } finally {
    showDeleteConfirm.value = false;
    sessionToDelete.value = null;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // If within last 7 days, show day name
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

onMounted(() => {
  fetchHistory();
});

defineExpose({ refresh: fetchHistory });
</script>
