<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Units Management</h1>
      </div>

      <!-- Book Selector -->
      <div class="mb-6">
        <label class="block text-sm text-slate-400 mb-2">Select Book</label>
        <select
          v-model="selectedBookId"
          @change="loadUnits"
          class="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 w-64"
        >
          <option value="">Select a book</option>
          <option v-for="book in sortedBooks" :key="book._id" :value="book._id">
            {{ book.grade?.title || book.grade }} -
            {{ book.subject?.title || book.subject }}
          </option>
        </select>
      </div>

      <div v-if="selectedBookId" class="space-y-6">
        <div class="flex justify-end">
          <button
            @click="addUnit"
            class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>+</span> Add Unit
          </button>
        </div>

        <!-- Units List -->
        <div
          v-for="(unit, uIndex) in units"
          :key="uIndex"
          class="bg-slate-800 rounded-xl border border-slate-700 p-5"
        >
          <!-- Unit Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold text-lg"
                >Unit {{ unit.unitNumber || uIndex + 1 }}</span
              >
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="generateSummary(unit)"
                :disabled="generatingMap[`unit-${unit.unitNumber}`]"
                class="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
              >
                <span v-if="generatingMap[`unit-${unit.unitNumber}`]"
                  >⏳ Generating...</span
                >
                <span v-else>✨ Generate Summary</span>
              </button>
              <button
                @click="triggerUploadAudio(unit)"
                :disabled="uploadingAudioMap[`unit-${unit.unitNumber}`]"
                class="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <span v-if="uploadingAudioMap[`unit-${unit.unitNumber}`]"
                  >⏳ Uploading...</span
                >
                <span v-else>🎵 Upload Audio</span>
              </button>
              <button
                @click="generatePresentation(unit)"
                :disabled="generatingPptMap[`unit-${unit.unitNumber}`]"
                class="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1"
              >
                <span v-if="generatingPptMap[`unit-${unit.unitNumber}`]"
                  >⏳ Generating...</span
                >
                <span v-else>📊 Generate PPT</span>
              </button>
              <button
                @click="triggerRemoveUnit(uIndex)"
                class="text-red-400 hover:text-red-300 text-sm"
              >
                🗑️ Remove Unit
              </button>
            </div>
          </div>

          <!-- Unit Fields -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label class="block text-xs text-slate-400 mb-1"
                >Unit Number</label
              >
              <input
                v-model.number="unit.unitNumber"
                type="number"
                min="1"
                class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                placeholder="1"
              />
            </div>
            <div class="md:col-span-1">
              <label class="block text-xs text-slate-400 mb-1"
                >Unit Title</label
              >
              <input
                v-model="unit.title"
                class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                placeholder="e.g., Cell Biology"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1"
                >Page Start</label
              >
              <input
                v-model.number="unit.pageStart"
                type="number"
                min="1"
                class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                placeholder="1"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Page End</label>
              <input
                v-model.number="unit.pageEnd"
                type="number"
                min="1"
                class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                placeholder="25"
              />
            </div>
          </div>

          <!-- Sub-chapters Section -->
          <div class="ml-4 border-l-2 border-slate-600 pl-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-slate-300 font-medium">Sub-chapters</h4>
              <button
                @click="addSubChapter(uIndex)"
                class="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
              >
                <span>+</span> Add Sub-chapter
              </button>
            </div>

            <div class="space-y-3">
              <SubUnitItem
                v-for="(sub, sIndex) in unit.subChapters"
                :key="sIndex"
                :sub="sub"
                :generatingSummary="
                  subunitGeneratingSummaryMap[sub.subunitNumber]
                "
                :generatingQuiz="subunitGeneratingQuizMap[sub.subunitNumber]"
                :generatingSummaryMap="subunitGeneratingSummaryMap"
                :generatingQuizMap="subunitGeneratingQuizMap"
                @remove="triggerRemoveSubChapter(uIndex, sIndex)"
                @generate-summary="(s) => generateSubunitSummary(unit, s)"
                @generate-quiz="(s) => generateSubunitQuiz(unit, s)"
              />
            </div>

            <div
              v-if="unit.subChapters.length === 0"
              class="text-slate-500 text-sm py-2"
            >
              No sub-chapters added yet.
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex gap-4 pt-4">
          <button
            @click="saveUnits"
            :disabled="saving"
            class="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            <span v-if="saving">⏳</span>
            <span v-else>💾</span>
            {{ saving ? "Saving..." : "Save All Units" }}
          </button>
          <button
            @click="loadUnits"
            class="bg-slate-600 hover:bg-slate-500 px-6 py-3 rounded-lg font-medium"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16 text-slate-400">
        <div class="text-6xl mb-4">📋</div>
        <p>Select a book above to manage its units and sub-chapters.</p>
      </div>

      <input
        type="file"
        ref="audioInput"
        accept="audio/*"
        class="hidden"
        @change="handleAudioUpload"
      />

      <ConfirmModal
        :show="confirmModal.show"
        :title="confirmModal.title"
        :message="confirmModal.message"
        @confirm="handleConfirmRemove"
        @cancel="confirmModal.show = false"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import SubUnitItem from "../../components/admin/SubUnitItem.vue";
import { useToast } from "../../composables/useToast";
import ConfirmModal from "../../components/common/ConfirmModal.vue";
import { uploadSummaryAudio, updateSummaryAudio } from "../../services/summary";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const route = useRoute();
const books = ref([]);
const selectedBookId = ref(route.query.bookId || "");
const units = ref([]);
const saving = ref(false);
const toast = useToast();

// Helper to extract grade number
function getGradeNumber(gradeData) {
  const title =
    gradeData?.title || (typeof gradeData === "string" ? gradeData : "") || "";
  const match = title.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

const sortedBooks = computed(() => {
  return [...books.value].sort((a, b) => {
    const gradeA = getGradeNumber(a.grade);
    const gradeB = getGradeNumber(b.grade);
    return gradeA - gradeB;
  });
});

// Audio Upload State
const audioInput = ref(null);
const currentUploadUnit = ref(null);
const uploadingAudioMap = ref({});

const confirmModal = ref({
  show: false,
  title: "",
  message: "",
  type: "", // 'unit' or 'subchapter'
  index: -1,
  subIndex: -1,
});

function triggerRemoveUnit(index) {
  confirmModal.value = {
    show: true,
    title: "Remove Unit",
    message: `Are you sure you want to remove Unit ${
      units.value[index].unitNumber || index + 1
    }?`,
    type: "unit",
    index,
  };
}

function triggerRemoveSubChapter(uIndex, sIndex) {
  const unit = units.value[uIndex];
  const sub = unit.subChapters[sIndex];
  confirmModal.value = {
    show: true,
    title: "Remove Sub-chapter",
    message: `Are you sure you want to remove sub-chapter "${
      sub.title || sub.subunitNumber
    }"?`,
    type: "subchapter",
    index: uIndex,
    subIndex: sIndex,
  };
}

function handleConfirmRemove() {
  if (confirmModal.value.type === "unit") {
    removeUnit(confirmModal.value.index);
  } else if (confirmModal.value.type === "subchapter") {
    removeSubChapter(confirmModal.value.index, confirmModal.value.subIndex);
  }
  confirmModal.value.show = false;
}

async function fetchBooks() {
  const res = await axios.get("/books");
  books.value = res.data;
  if (selectedBookId.value) loadUnits();
}

// Helper to recursively map subchapters
function mapSubChapters(subs) {
  return (
    subs?.map((s) => ({
      subunitNumber: s.subunitNumber || s.id || "",
      title: s.title || "",
      pageStart: s.pageStart || null,
      pageEnd: s.pageEnd || null,
      subChapters: mapSubChapters(s.subChapters) || [],
    })) || []
  );
}

function loadUnits() {
  const book = books.value.find((b) => b._id === selectedBookId.value);
  units.value =
    book?.units?.map((u, idx) => ({
      unitNumber: u.unitNumber || idx + 1,
      title: u.title || "",
      pageStart: u.pageStart || null,
      pageEnd: u.pageEnd || null,
      subChapters: mapSubChapters(u.subChapters),
    })) || [];
}

function addUnit() {
  const nextUnitNum = units.value.length + 1;
  units.value.push({
    unitNumber: nextUnitNum,
    title: "",
    pageStart: null,
    pageEnd: null,
    subChapters: [],
  });
}

const generatingMap = ref({}); // Track generation state per unit
const subunitGeneratingSummaryMap = ref({}); // Track summary generation state per subunit
const subunitGeneratingQuizMap = ref({}); // Track quiz generation state per subunit

async function generateSummary(unit) {
  const book = books.value.find((b) => b._id === selectedBookId.value);
  if (!book) return toast.error("Book not found");

  const unitId = `unit-${unit.unitNumber}`;
  generatingMap.value[unitId] = true;

  try {
    const payload = {
      gradeId: book.grade?._id || book.grade,
      subjectId: book.subject?._id || book.subject,
      unitIdentifier: unit.title || `Unit ${unit.unitNumber}`,
      type: "unit",
      gradeTitle: book.grade?.title || "Unknown Grade",
      subjectTitle: book.subject?.title || "Unknown Subject",
    };

    const res = await axios.post(
      "/summary/generate",
      payload,
    );
    if (res.data.ok) {
      toast.success(
        `Summary generated for ${unit.title || "Unit " + unit.unitNumber}`,
      );
    } else {
      toast.error("Failed: " + res.data.message);
    }
  } catch (e) {
    toast.error("Error generating summary: " + e.message);
  } finally {
    generatingMap.value[unitId] = false;
  }
}

// Subunit Summary Generation
async function generateSubunitSummary(unit, subunit) {
  const book = books.value.find((b) => b._id === selectedBookId.value);
  if (!book) return toast.error("Book not found");

  const subunitKey = subunit.subunitNumber;
  subunitGeneratingSummaryMap.value[subunitKey] = true;

  try {
    const payload = {
      gradeId: book.grade?._id || book.grade,
      subjectId: book.subject?._id || book.subject,
      unitIdentifier: unit.title || String(unit.unitNumber),
      subunitIdentifier: subunit.subunitNumber,
      subunitTitle: subunit.title,
      type: "subunit",
      gradeTitle: book.grade?.title || "Unknown Grade",
      subjectTitle: book.subject?.title || "Unknown Subject",
    };

    const res = await axios.post(
      "/summary/generate",
      payload,
    );
    if (res.data.ok) {
      toast.success(
        `Summary generated for ${subunit.title || subunit.subunitNumber}`,
      );
    } else {
      toast.error("Failed: " + res.data.message);
    }
  } catch (e) {
    toast.error("Error generating subunit summary: " + e.message);
  } finally {
    subunitGeneratingSummaryMap.value[subunitKey] = false;
  }
}

// Subunit Quiz Generation
async function generateSubunitQuiz(unit, subunit) {
  const book = books.value.find((b) => b._id === selectedBookId.value);
  if (!book) return toast.error("Book not found");

  const subunitKey = subunit.subunitNumber;
  subunitGeneratingQuizMap.value[subunitKey] = true;

  try {
    const payload = {
      gradeId: book.grade?._id || book.grade,
      subjectId: book.subject?._id || book.subject,
      unit: unit.title || String(unit.unitNumber),
      subunit: subunit.subunitNumber,
      subunitTitle: subunit.title,
      num_questions: 5,
      gradeTitle: book.grade?.title || "Unknown Grade",
      subjectTitle: book.subject?.title || "Unknown Subject",
    };

    const res = await axios.post(
      "/quiz/generate",
      payload,
    );
    if (res.data.ok) {
      toast.success(
        `Quiz generated for ${subunit.title || subunit.subunitNumber}`,
      );
    } else {
      toast.error("Failed: " + res.data.message);
    }
  } catch (e) {
    toast.error("Error generating subunit quiz: " + e.message);
  } finally {
    subunitGeneratingQuizMap.value[subunitKey] = false;
  }
}

// Audio Upload Logic
async function triggerUploadAudio(unit) {
  const book = books.value.find((b) => b._id === selectedBookId.value);
  if (!book) return toast.error("Book not found");

  // Check if summary exists first
  try {
    const res = await axios.get("/summary", {
      params: {
        grade: book.grade?.title || "Unknown Grade",
        subject: book.subject?.title || "Unknown Subject",
        unit: unit.title || `Unit ${unit.unitNumber}`,
      },
    });

    if (!res.data.ok || !res.data.data) {
      return toast.error(
        "Please generate the summary first before uploading audio.",
      );
    }

    // Store the summary ID to link the audio
    unit._summaryId = res.data.data._id;
  } catch (e) {
    return toast.error(
      "Please generate the summary first before uploading audio.",
    );
  }

  currentUploadUnit.value = unit;
  audioInput.value.click();
}

async function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const unit = currentUploadUnit.value;
  if (!unit) return;

  const unitKey = `unit-${unit.unitNumber}`;
  uploadingAudioMap.value[unitKey] = true;

  try {
    // 1. Upload File
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await uploadSummaryAudio(formData);
    if (!uploadRes.ok) throw new Error("Upload failed");

    const audioUrl = uploadRes.url;

    // 2. Link to Summary
    if (!unit._summaryId) throw new Error("Summary ID missing");

    await updateSummaryAudio(unit._summaryId, audioUrl);

    toast.success("Audio uploaded and attached successfully!");
  } catch (e) {
    toast.error("Failed to upload audio: " + e.message);
  } finally {
    uploadingAudioMap.value[unitKey] = false;
    event.target.value = ""; // Reset input
    currentUploadUnit.value = null;
  }
}

const generatingPptMap = ref({}); // Track PPT generation state

async function generatePresentation(unit) {
  const book = books.value.find((b) => b._id === selectedBookId.value);
  if (!book) return toast.error("Book not found");

  const unitId = `unit-${unit.unitNumber}`;
  generatingPptMap.value[unitId] = true;

  try {
    const payload = {
      gradeId: book.grade?._id || book.grade,
      subjectId: book.subject?._id || book.subject,
      unit: unit.title || `Unit ${unit.unitNumber}`,
      gradeTitle: book.grade?.title || "Unknown Grade",
      subjectTitle: book.subject?.title || "Unknown Subject",
    };

    const res = await axios.post(
      "/presentation/generate",
      payload,
    );
    if (res.data.ok) {
      toast.success(
        `Presentation generated for ${unit.title || "Unit " + unit.unitNumber}`,
      );
    } else {
      toast.error("Failed: " + res.data.message);
    }
  } catch (e) {
    toast.error("Error generating presentation: " + e.message);
  } finally {
    generatingPptMap.value[unitId] = false;
  }
}

function removeUnit(index) {
  units.value.splice(index, 1);
  // Renumber remaining units
  units.value.forEach((u, idx) => {
    u.unitNumber = idx + 1;
  });
}

function addSubChapter(uIndex) {
  const unit = units.value[uIndex];
  const nextSubNum = unit.subChapters.length + 1;
  unit.subChapters.push({
    subunitNumber: `${unit.unitNumber}.${nextSubNum}`,
    title: "",
    pageStart: null,
    pageEnd: null,
    subChapters: [],
  });
}

function removeSubChapter(uIndex, sIndex) {
  units.value[uIndex].subChapters.splice(sIndex, 1);
}

// Helper to recursively prepare payload
function prepareSubPayload(subs, parentNum) {
  return subs.map((s, idx) => ({
    id: s.subunitNumber || `${parentNum}.${idx + 1}`,
    subunitNumber: s.subunitNumber,
    title: s.title,
    pageStart: s.pageStart || 1,
    pageEnd: s.pageEnd || 1,
    subChapters: prepareSubPayload(s.subChapters || [], s.subunitNumber),
  }));
}

async function saveUnits() {
  saving.value = true;
  try {
    // Transform data to match backend schema
    const payload = units.value.map((u) => ({
      id: `unit-${u.unitNumber}`,
      unitNumber: u.unitNumber,
      title: u.title,
      pageStart: u.pageStart || 1,
      pageEnd: u.pageEnd || 1,
      subChapters: prepareSubPayload(u.subChapters, u.unitNumber),
    }));

    await axios.put(
      `/books/${selectedBookId.value}/structure`,
      { units: payload },
    );
    toast.success("✅ Units saved successfully!");
    // Refresh to get updated data
    const res = await axios.get("/books");
    books.value = res.data;
    loadUnits();
  } catch (err) {
    toast.error(
      "❌ Failed to save: " + (err.response?.data?.message || err.message),
    );
  } finally {
    saving.value = false;
  }
}

onMounted(fetchBooks);
</script>

<style scoped>
.bg-slate-750 {
  background-color: rgb(40, 45, 60);
}
</style>
