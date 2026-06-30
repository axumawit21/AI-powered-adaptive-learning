<template>
  <DefaultLayout>
    <div
      class="h-full bg-transparent p-6 md:p-8 overflow-y-auto custom-scrollbar relative z-10"
      :style="{ color: 'var(--text-primary)' }"
    >
      <!-- Header -->
      <div class="max-w-7xl mx-auto mb-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1
              class="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-500 mb-2 tracking-tight"
            >
              📝 My Notes
            </h1>
            <p class="text-slate-400 font-medium">
              {{ filteredNotes.length }} note{{
                filteredNotes.length !== 1 ? "s" : ""
              }}
              {{ filters.isArchived ? "(archived)" : "" }}
            </p>
          </div>
          <button
            @click="openEditor()"
            class="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <span class="text-xl font-bold">+</span>
            <span>New Note</span>
          </button>
        </div>

        <!-- Controls -->
        <div
          class="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center"
          :style="{ border: '1px solid var(--border-color)' }"
        >
          <!-- Search -->
          <div class="flex-1 min-w-[200px] relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              >🔍</span
            >
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search notes..."
              class="w-full rounded-xl pl-10 pr-4 py-2.5 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              :style="{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
              }"
            />
          </div>

          <!-- Filter by Subject -->
          <select
            v-model="filters.subject"
            class="rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer border transition-colors"
            :style="{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }"
          >
            <option value="">All Subjects</option>
            <option
              v-for="subject in uniqueSubjects"
              :key="subject"
              :value="subject"
            >
              {{ subject }}
            </option>
          </select>

          <!-- Filter by Reminder -->
          <select
            v-model="filters.hasReminder"
            class="rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer border transition-colors"
            :style="{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }"
          >
            <option value="">All Notes</option>
            <option value="true">🔔 Reminders</option>
            <option value="false">No Reminder</option>
          </select>

          <!-- Sort -->
          <select
            v-model="sortBy"
            class="rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer border transition-colors"
            :style="{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="subject">Sort by Subject</option>
          </select>

          <!-- Archive Toggle -->
          <button
            @click="filters.isArchived = !filters.isArchived"
            class="px-4 py-2.5 rounded-xl font-medium transition-colors border"
            :class="[
              filters.isArchived
                ? 'bg-orange-600/20 border-orange-500 text-orange-400 hover:bg-orange-600/30'
                : 'hover:bg-slate-800/50',
            ]"
            :style="
              !filters.isArchived
                ? {
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-secondary)',
                  }
                : {}
            "
          >
            {{ filters.isArchived ? "📂 Archived" : "🗃️ Archive" }}
          </button>
        </div>
      </div>

      <!-- Notes Grid -->
      <div class="max-w-7xl mx-auto">
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin text-4xl">⏳</div>
          <p class="text-slate-400 mt-4">Loading notes...</p>
        </div>

        <div v-else-if="filteredNotes.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-slate-400 text-lg">
            {{
              searchQuery || filters.subject || filters.hasReminder
                ? "No notes found matching your filters"
                : filters.isArchived
                ? "No archived notes yet"
                : "No notes yet. Create your first note!"
            }}
          </p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <NoteCard
            v-for="note in sortedNotes"
            :key="note._id"
            :note="note"
            @edit="openEditor(note)"
            @delete="confirmDelete(note._id)"
            @toggle-pin="togglePin(note._id)"
            @toggle-archive="toggleArchive(note._id)"
          />
        </div>
      </div>

      <!-- Note Editor Modal -->
      <NoteEditor
        :show="showEditor"
        :note="editingNote"
        @close="closeEditor"
        @save="saveNote"
      />

      <ConfirmModal
        :show="showDeleteConfirm"
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        @confirm="deleteNote"
        @cancel="showDeleteConfirm = false"
      />
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import DefaultLayout from "../../layouts/DefaultLayout.vue";
import { notesService } from "../../services/notes";
import NoteCard from "../../components/notes/NoteCard.vue";
import NoteEditor from "../../components/notes/NoteEditor.vue";
import { useToast } from "../../composables/useToast";
import ConfirmModal from "../../components/common/ConfirmModal.vue";

const notes = ref([]);
const loading = ref(false);
const showEditor = ref(false);
const editingNote = ref(null);
const showDeleteConfirm = ref(false);
const noteToDelete = ref(null);
const searchQuery = ref("");
const sortBy = ref("date");
const toast = useToast();

const filters = ref({
  subject: "",
  hasReminder: "",
  isArchived: false,
});

const uniqueSubjects = computed(() => {
  const subjects = notes.value.map((n) => n.subject).filter((s) => s);
  return [...new Set(subjects)];
});

const filteredNotes = computed(() => {
  let result = notes.value;

  // Filter by archive status
  result = result.filter((n) => n.isArchived === filters.value.isArchived);

  // Filter by subject
  if (filters.value.subject) {
    result = result.filter((n) => n.subject === filters.value.subject);
  }

  // Filter by reminder
  if (filters.value.hasReminder === "true") {
    result = result.filter((n) => n.reminder);
  } else if (filters.value.hasReminder === "false") {
    result = result.filter((n) => !n.reminder);
  }

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }

  return result;
});

const sortedNotes = computed(() => {
  const result = [...filteredNotes.value];

  switch (sortBy.value) {
    case "title":
      return result.sort((a, b) => a.title.localeCompare(b.title));
    case "subject":
      return result.sort((a, b) =>
        (a.subject || "").localeCompare(b.subject || "")
      );
    case "date":
    default:
      return result.sort((a, b) => {
        // Pinned notes first
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        // Then by date
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }
});

async function fetchNotes() {
  loading.value = true;
  try {
    const res = await notesService.getAllNotes();
    notes.value = res.data.data || [];
  } catch (error) {
    console.error("Failed to fetch notes:", error);
  } finally {
    loading.value = false;
  }
}

function openEditor(note = null) {
  editingNote.value = note;
  showEditor.value = true;
}

function closeEditor() {
  showEditor.value = false;
  editingNote.value = null;
}

async function saveNote(data) {
  try {
    if (editingNote.value) {
      await notesService.updateNote(editingNote.value._id, data);
    } else {
      await notesService.createNote(data);
    }
    await fetchNotes();
    closeEditor();
  } catch (error) {
    console.error("Failed to save note:", error);
    toast.error("Failed to save note. Please try again.");
  }
}

function confirmDelete(id) {
  noteToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function deleteNote() {
  if (!noteToDelete.value) return;

  try {
    await notesService.deleteNote(noteToDelete.value);
    await fetchNotes();
  } catch (error) {
    console.error("Failed to delete note:", error);
  } finally {
    showDeleteConfirm.value = false;
    noteToDelete.value = null;
  }
}

async function togglePin(id) {
  try {
    await notesService.togglePin(id);
    await fetchNotes();
  } catch (error) {
    console.error("Failed to toggle pin:", error);
  }
}

async function toggleArchive(id) {
  try {
    await notesService.toggleArchive(id);
    await fetchNotes();
  } catch (error) {
    console.error("Failed to toggle archive:", error);
  }
}

onMounted(() => {
  fetchNotes();
});
</script>
