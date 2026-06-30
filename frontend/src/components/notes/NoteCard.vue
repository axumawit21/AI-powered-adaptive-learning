<template>
  <div
    :class="[
      'p-5 rounded-2xl transition-all cursor-pointer group hover:-translate-y-1 duration-300 relative overflow-hidden border',
      note.isPinned
        ? 'ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/10'
        : '',
    ]"
    :style="{
      borderLeftColor: note.color,
      borderLeftWidth: '4px',
      background: 'var(--bg-surface-glass)',
      borderColor: 'var(--border-color)',
    }"
    @click="$emit('edit', note)"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-2">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span v-if="note.isPinned" class="text-cyan-400 text-lg">📌</span>
        <h3
          class="font-semibold truncate"
          :style="{ color: 'var(--text-primary)' }"
        >
          {{ note.title }}
        </h3>
      </div>
      <div
        class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          @click.stop="$emit('toggle-pin', note._id)"
          class="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          :title="note.isPinned ? 'Unpin' : 'Pin'"
        >
          <span class="text-sm">{{ note.isPinned ? "📌" : "📍" }}</span>
        </button>
        <button
          @click.stop="$emit('toggle-archive', note._id)"
          class="p-1.5 rounded-lg transition-colors hover:bg-slate-700/50"
          :title="note.isArchived ? 'Unarchive' : 'Archive'"
        >
          <span class="text-sm">{{ note.isArchived ? "📂" : "🗃️" }}</span>
        </button>
        <button
          @click.stop="$emit('delete', note._id)"
          class="p-1.5 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
          title="Delete"
        >
          <span class="text-sm">🗑️</span>
        </button>
      </div>
    </div>

    <!-- Content Preview -->
    <p
      class="text-sm line-clamp-3 mb-3"
      :style="{ color: 'var(--text-secondary)' }"
    >
      {{ note.content }}
    </p>

    <!-- Footer -->
    <div class="flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center gap-2 flex-wrap">
        <span
          v-if="note.subject"
          class="px-2 py-1 rounded-md"
          :style="{
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
          }"
        >
          {{ note.subject }}
        </span>
        <span
          v-if="note.reminder"
          class="px-2 py-1 bg-orange-500/10 text-orange-400 rounded-md flex items-center gap-1 border border-orange-500/20"
        >
          🔔 {{ formatReminderDate(note.reminder.date) }}
        </span>
        <span
          v-for="tag in note.tags?.slice(0, 3)"
          :key="tag"
          class="px-2 py-1 rounded-md"
          :style="{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
          }"
        >
          #{{ tag }}
        </span>
        <span v-if="note.tags?.length > 3" class="text-slate-500">
          +{{ note.tags.length - 3 }}
        </span>
      </div>
      <span :style="{ color: 'var(--text-muted)' }">
        {{ formatDate(note.createdAt) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  note: { type: Object, required: true },
});

defineEmits(["edit", "delete", "toggle-pin", "toggle-archive"]);

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

function formatReminderDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d - now;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 0) return "Overdue";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString();
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
