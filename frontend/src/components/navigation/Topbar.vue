<template>
  <div
    class="glass-panel p-3 md:p-4 flex items-center justify-between mx-2 md:mx-4 mt-2 md:mt-4 rounded-xl md:rounded-2xl gap-2 md:gap-4"
    :style="{ color: 'var(--text-primary)' }"
  >
    <!-- Left Section: Hamburger (mobile) + Logo/Selectors -->
    <div class="flex items-center gap-2 md:gap-4">
      <!-- Hamburger Menu (Mobile Only) -->
      <button
        @click="$emit('toggle-mobile-sidebar')"
        class="md:hidden w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
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
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <!-- Logo Section (Mobile) - Hidden per user request -->
      <div class="hidden">
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
        <span class="font-bold text-white hidden">Henon</span>
      </div>

      <!-- Grade Selector -->
      <div class="relative hidden md:block">
        <select
          v-model="selectedGradeId"
          class="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          :disabled="loadingGrades"
        >
          <option v-if="loadingGrades" value="" disabled>
            Loading grades...
          </option>
          <option v-else-if="grades.length === 0" value="" disabled>
            No grades available
          </option>
          <option v-for="grade in grades" :key="grade._id" :value="grade._id">
            {{ grade.title }}
          </option>
        </select>
      </div>

      <!-- Mobile Grade Selector (Compact) -->
      <div class="relative md:hidden">
        <select
          v-model="selectedGradeId"
          class="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          :disabled="loadingGrades"
        >
          <option v-if="loadingGrades" value="" disabled>Loading...</option>
          <option v-else-if="grades.length === 0" value="" disabled>
            No grades
          </option>
          <option v-for="grade in grades" :key="grade._id" :value="grade._id">
            {{ grade.title }}
          </option>
        </select>
      </div>

      <!-- Subject Selector (Desktop) -->
      <div class="relative hidden md:block" v-if="selectedGradeId">
        <select
          v-model="selectedSubjectId"
          @change="onSubjectChange"
          class="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          :disabled="loadingBooks"
        >
          <option v-if="loadingBooks" value="" disabled>
            Loading subjects...
          </option>
          <option v-else-if="subjects.length === 0" value="" disabled>
            No subjects available
          </option>
          <option value="">Select Subject</option>
          <option
            v-for="subject in subjects"
            :key="subject._id"
            :value="subject._id"
          >
            {{ subject.title }}
          </option>
        </select>
      </div>

      <!-- Subject Selector (Mobile - Compact) -->
      <div class="relative md:hidden" v-if="selectedGradeId">
        <select
          v-model="selectedSubjectId"
          @change="onSubjectChange"
          class="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent max-w-[120px]"
          :disabled="loadingBooks"
        >
          <option v-if="loadingBooks" value="" disabled>Loading...</option>
          <option v-else-if="subjects.length === 0" value="" disabled>
            No subjects
          </option>
          <option value="">Subject</option>
          <option
            v-for="subject in subjects"
            :key="subject._id"
            :value="subject._id"
          >
            {{ subject.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Mode Display (Hidden on small mobile) -->
    <div class="hidden sm:flex items-center space-x-2">
      <span class="text-sm" :style="{ color: 'var(--text-secondary)' }"
        >Mode:</span
      >
      <span class="font-medium" :style="{ color: 'var(--text-primary)' }">{{
        mode || "Explore"
      }}</span>
    </div>

    <!-- Right Side Actions -->
    <div class="flex items-center gap-2 md:gap-4">
      <!-- Location Icon (Mobile) -->
      <!-- Location Icon (Mobile inactive) -->
      <button
        class="hidden w-9 h-9 rounded-xl bg-cyan-500/20 items-center justify-center text-cyan-400"
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
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </button>

      <!-- User Profile -->
      <div
        v-if="user"
        class="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-700"
      >
        <div class="text-right hidden md:block">
          <div
            class="text-sm font-medium"
            :style="{ color: 'var(--text-primary)' }"
          >
            {{ user.name }}
          </div>
          <div class="text-xs" :style="{ color: 'var(--text-secondary)' }">
            {{ user.email }}
          </div>
        </div>
        <div
          class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-800"
        >
          {{ user.name?.[0]?.toUpperCase() || "U" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, nextTick, toRaw } from "vue";
import axios from "axios";
import { useAuth } from "../../composables/useAuth";

const { user } = useAuth();

const props = defineProps({
  grade: { type: Object, default: null },
  subject: { type: Object, default: null },
  mode: { type: String, default: null },
});

const emit = defineEmits([
  "update:grade",
  "update:subject",
  "ask-general",
  "subjects-loaded",
  "toggle-mobile-sidebar",
]);

// State
const grades = ref([]);
const books = ref([]);
const selectedGradeId = ref(null);
const selectedSubjectId = ref("");
const loadingGrades = ref(false);
const loadingBooks = ref(false);

const subjects = computed(() => {
  return books.value.filter((b) => {
    const bookGradeId = b.grade?._id || b.grade;
    // Robust comparison: handle potential type mismatches (string vs object id string)
    return String(bookGradeId) === String(selectedGradeId.value);
  });
});

// Fetch grades from API
async function fetchGrades() {
  try {
    loadingGrades.value = true;
    const response = await axios.get("grades");
    grades.value = response.data || [];

    // Auto-select first grade if none selected
    if (grades.value.length > 0 && !selectedGradeId.value) {
      selectedGradeId.value = grades.value[0]._id;
      emit("update:grade", grades.value[0]);
    }
  } catch (err) {
    console.error("Failed to fetch grades:", err);
  } finally {
    loadingGrades.value = false;
  }
}

// Fetch books from API
async function fetchBooks() {
  try {
    loadingBooks.value = true;
    const response = await axios.get("books");
    books.value = response.data || [];
    console.log("Books fetched from API:", books.value);
    console.log("First book fileUrl:", books.value[0]?.fileUrl);
  } catch (err) {
    console.error("Failed to fetch books:", err);
  } finally {
    loadingBooks.value = false;
  }
}

// Fetch books to get units for subjects
async function fetchBooksForSubjects() {
  try {
    const selectedGrade = grades.value.find(
      (g) => g._id === selectedGradeId.value
    );
    if (!selectedGrade) return;

    const response = await axios.get("books");
    const books = response.data || [];

    // Filter books by grade title and map to subjects with units
    const gradeBooks = books.filter((b) => b.grade === selectedGrade.title);

    const subjectsWithUnits = subjects.value
      .map((subject) => {
        const book = gradeBooks.find((b) => b.subject === subject.title);
        return {
          ...subject,
          id: subject._id,
          name: subject.title,
          units: book?.units || [],
          bookId: book?._id,
        };
      })
      .filter((s) => gradeBooks.some((b) => b.subject === s.title));

    emit("subjects-loaded", subjectsWithUnits);
  } catch (err) {
    console.error("Failed to fetch books:", err);
  }
}

function onGradeChange() {
  const selectedGrade = grades.value.find(
    (g) => g._id === selectedGradeId.value
  );
  emit("update:grade", selectedGrade);
  selectedSubjectId.value = "";
  emit("update:subject", null);
}

function onSubjectChange() {
  if (!selectedSubjectId.value) {
    emit("update:subject", null);
    return;
  }

  const selectedSubject = subjects.value.find(
    (s) => s._id === selectedSubjectId.value
  );

  if (selectedSubject) {
    // Ensure we emit the same structure as emitSubjectsForGrade
    const subjectId = selectedSubject.subject?._id || selectedSubject.subject;

    emit("update:subject", {
      ...selectedSubject,
      id: subjectId, // Subject ID
      _id: subjectId,
      name: selectedSubject.title, // Book title usually matches Subject Name in this model
      title: selectedSubject.title,
      units: selectedSubject.units || [],
      bookId: selectedSubject._id, // Book ID
      fileUrl: selectedSubject.fileUrl,
    });
  }
}

function askGeneral() {
  emit("ask-general");
}

onMounted(async () => {
  await fetchGrades();
  await fetchBooks();
  // Emit initial subjects for the auto-selected grade
  emitSubjectsForGrade();
});

// Watch props.subject to sync if changed externally (e.g. via Map)
watch(
  () => props.subject,
  (newSubject) => {
    if (newSubject) {
      // The dropdown options are populated with Book IDs (subject._id from fetchBooks/subjects computed)
      // We must prefer bookId if available to match the dropdown value
      if (newSubject.bookId) {
        selectedSubjectId.value = newSubject.bookId;
      } else if (newSubject.id || newSubject._id) {
        // Fallback: Check if the ID matches a book ID directly
        const idToCheck = newSubject.id || newSubject._id;
        const matchingBook = subjects.value.find((b) => b._id === idToCheck);
        if (matchingBook) {
          selectedSubjectId.value = idToCheck;
        } else {
          // Fallback: Check if ID matches a Subject ID in the books
          const matchBySubject = subjects.value.find(
            (b) => (b.subject?._id || b.subject) === idToCheck
          );
          if (matchBySubject) {
            selectedSubjectId.value = matchBySubject._id;
          }
        }
      }
    } else {
      selectedSubjectId.value = "";
    }
  },
  { immediate: true }
);

// Watch selectedGradeId to emit subjects when grade changes
watch(selectedGradeId, async () => {
  // Clear selected subject when grade changes
  selectedSubjectId.value = "";
  emit("update:subject", null);

  // Wait for reactivity to update computed properties
  await nextTick();

  emitSubjectsForGrade();

  // Also emit grade change
  const selectedGrade = grades.value.find(
    (g) => g._id === selectedGradeId.value
  );
  if (selectedGrade) {
    emit("update:grade", selectedGrade);
  }
});

// Watch books to emit when they load
watch(books, () => {
  emitSubjectsForGrade();
});

function emitSubjectsForGrade() {
  // subjects is computed from books filtered by grade
  console.log("Raw subjects.value:", subjects.value);
  console.log("First subject in array:", subjects.value[0]);
  console.log("First subject keys:", Object.keys(subjects.value[0] || {}));
  console.log("First subject fileUrl:", subjects.value[0]?.fileUrl);

  const subjectsForGrade = subjects.value.map((book) => {
    // Deep clone to ensure we have a plain object
    const rawBook = JSON.parse(JSON.stringify(book));
    // The book.subject is the actual subject ID (string or object)
    const subjectId = rawBook.subject?._id || rawBook.subject;

    return {
      id: subjectId,
      _id: subjectId,
      name: rawBook.subject?.title || rawBook.subjectName || rawBook.title,
      title: rawBook.subject?.title || rawBook.subjectName || rawBook.title,
      bg: rawBook.subject?.bg || rawBook.subject?.image || null,
      units: rawBook.units || [],
      bookId: rawBook._id,
      gradeTitle: rawBook.grade?.title || rawBook.grade,
      fileUrl: rawBook.fileUrl, // Include the PDF file URL
    };
  });
  console.log(
    "Emitting subjects with fileUrl:",
    subjectsForGrade.map((s) => ({ name: s.name, fileUrl: s.fileUrl }))
  );
  emit("subjects-loaded", subjectsForGrade);
}
</script>

<style scoped>
/* Add any custom styles here */
</style>
