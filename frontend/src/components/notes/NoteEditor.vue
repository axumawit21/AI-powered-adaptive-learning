<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
    @click.self="$emit('close')"
  >
    <div
      class="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl relative"
      :style="{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface-glass)',
      }"
    >
      <!-- Header -->
      <div
        class="sticky top-0 backdrop-blur-md p-6 flex items-center justify-between z-10"
        :style="{
          background: 'var(--bg-surface-glass)',
          borderBottom: '1px solid var(--border-color)',
        }"
      >
        <h2
          class="text-2xl font-bold tracking-tight"
          :style="{ color: 'var(--text-primary)' }"
        >
          {{ editMode ? "Edit Note" : "New Note" }}
        </h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-white/10 rounded-full transition-colors hover:text-white"
          :style="{ color: 'var(--text-secondary)' }"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <div class="p-6 space-y-6">
        <!-- Title -->
        <div>
          <label
            class="block text-sm font-bold uppercase tracking-wider mb-2"
            :style="{ color: 'var(--text-secondary)' }"
          >
            Title <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            maxlength="200"
            placeholder="Enter note title..."
            class="w-full rounded-xl px-4 py-3 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            :style="{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }"
          />
        </div>

        <!-- Content -->
        <div>
          <label
            class="block text-sm font-bold uppercase tracking-wider mb-2"
            :style="{ color: 'var(--text-secondary)' }"
          >
            Content <span class="text-red-400">*</span>
          </label>
          <textarea
            v-model="form.content"
            rows="8"
            maxlength="5000"
            placeholder="Write your note here..."
            class="w-full rounded-xl px-4 py-3 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all resize-none custom-scrollbar"
            :style="{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }"
          ></textarea>
          <div
            class="text-xs mt-1 text-right"
            :style="{ color: 'var(--text-secondary)' }"
          >
            {{ form.content.length }} / 5000
          </div>
        </div>

        <!-- Subject & Unit -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="block text-sm font-medium mb-2"
              :style="{ color: 'var(--text-secondary)' }"
            >
              Subject
            </label>
            <input
              v-model="form.subject"
              type="text"
              placeholder="e.g., Biology"
              class="w-full rounded-lg px-4 py-2 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none border"
              :style="{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
              }"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium mb-2"
              :style="{ color: 'var(--text-secondary)' }"
            >
              Unit
            </label>
            <input
              v-model="form.unit"
              type="text"
              placeholder="e.g., Unit 1"
              class="w-full rounded-lg px-4 py-2 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none border"
              :style="{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
              }"
            />
          </div>
        </div>

        <!-- Color Picker -->
        <div>
          <label
            class="block text-sm font-medium mb-2"
            :style="{ color: 'var(--text-secondary)' }"
          >
            Color
          </label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in colors"
              :key="color.value"
              @click="form.color = color.value"
              :class="[
                'w-10 h-10 rounded-lg border-2 transition-all',
                form.color === color.value
                  ? 'border-white scale-110'
                  : 'border-transparent',
              ]"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
            ></button>
          </div>
        </div>

        <!-- Tags -->
        <div>
          <label
            class="block text-sm font-medium mb-2"
            :style="{ color: 'var(--text-secondary)' }"
          >
            Tags
          </label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(tag, index) in form.tags"
              :key="index"
              class="px-3 py-1 rounded-lg flex items-center gap-2"
              :style="{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
              }"
            >
              #{{ tag }}
              <button
                @click="removeTag(index)"
                class="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newTag"
              @keydown.enter.prevent="addTag"
              type="text"
              placeholder="Add tag..."
              class="flex-1 border rounded-lg px-4 py-2 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none"
              :style="{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
              }"
            />
            <button
              @click="addTag"
              class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <!-- Reminder -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-slate-300">
              Reminder
            </label>
            <button
              v-if="form.reminder"
              @click="form.reminder = null"
              class="text-xs text-red-400 hover:text-red-300"
            >
              Remove Reminder
            </button>
          </div>
          <div v-if="!form.reminder" class="mb-2">
            <button
              @click="enableReminder"
              class="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>🔔</span>
              <span>Add Reminder</span>
            </button>
          </div>
          <div v-else class="space-y-3">
            <input
              v-model="form.reminder.date"
              type="datetime-local"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
            <div>
              <label class="block text-xs text-slate-400 mb-1">
                Recurring
              </label>
              <select
                v-model="form.reminder.recurring"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option :value="null">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Pin & Archive -->
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.isPinned"
              type="checkbox"
              class="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-600 focus:ring-cyan-500"
            />
            <span class="text-sm text-slate-300">📌 Pin this note</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.isArchived"
              type="checkbox"
              class="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-600 focus:ring-cyan-500"
            />
            <span class="text-sm text-slate-300">🗃️ Archive</span>
          </label>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="sticky bottom-0 p-6 flex gap-3 justify-end"
        :style="{
          background: 'var(--bg-surface-glass)',
          borderTop: '1px solid var(--border-color)',
        }"
      >
        <button
          @click="$emit('close')"
          class="px-6 py-2 rounded-lg transition-colors"
          :style="{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
          }"
        >
          Cancel
        </button>
        <button
          @click="save"
          :disabled="!canSave"
          class="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {{ editMode ? "Update" : "Create" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  show: Boolean,
  note: Object,
});

const emit = defineEmits(["close", "save"]);

const colors = [
  { name: "Gray", value: "#64748b" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
];

const form = ref({
  title: "",
  content: "",
  subject: "",
  unit: "",
  color: "#64748b",
  tags: [],
  isPinned: false,
  isArchived: false,
  reminder: null,
});

const newTag = ref("");
const editMode = computed(() => !!props.note);

const canSave = computed(() => {
  return form.value.title.trim() && form.value.content.trim();
});

watch(
  () => props.note,
  (note) => {
    if (note) {
      form.value = {
        title: note.title || "",
        content: note.content || "",
        subject: note.subject || "",
        unit: note.unit || "",
        color: note.color || "#64748b",
        tags: [...(note.tags || [])],
        isPinned: note.isPinned || false,
        isArchived: note.isArchived || false,
        reminder: note.reminder
          ? {
              date: new Date(note.reminder.date).toISOString().slice(0, 16),
              recurring: note.reminder.recurring || null,
            }
          : null,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  form.value = {
    title: "",
    content: "",
    subject: "",
    unit: "",
    color: "#64748b",
    tags: [],
    isPinned: false,
    isArchived: false,
    reminder: null,
  };
  newTag.value = "";
}

function addTag() {
  const tag = newTag.value.trim();
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag);
    newTag.value = "";
  }
}

function removeTag(index) {
  form.value.tags.splice(index, 1);
}

function enableReminder() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  form.value.reminder = {
    date: tomorrow.toISOString().slice(0, 16),
    recurring: null,
  };
}

function save() {
  if (!canSave.value) return;

  const data = {
    ...form.value,
    subject: form.value.subject || undefined,
    unit: form.value.unit || undefined,
  };

  emit("save", data);
  resetForm();
}
</script>
