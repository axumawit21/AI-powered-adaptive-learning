<template>
  <div class="max-w-3xl mx-auto">
    <!-- EVALUATION SELECTION (Input Mode) -->
    <div v-if="!result" class="animate-fade-in">
      <div class="flex items-center gap-4 mb-6">
        <button
          @click="$emit('back')"
          class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h3 class="text-2xl font-bold text-white">Evaluation Setup</h3>
      </div>

      <div class="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
        <div class="space-y-3">
          <label
            class="text-slate-400 text-sm font-medium uppercase tracking-wider"
            >Select Unit to Evaluate</label
          >
          <select
            v-model="selectedUnit"
            class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none hover:border-cyan-500/50 transition-colors cursor-pointer"
          >
            <option :value="null" disabled>Choose a unit...</option>
            <option v-for="u in units" :key="u.id" :value="u">
              {{ u.title || u.name }}
            </option>
          </select>
          <div
            v-if="!units || units.length === 0"
            class="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl"
          >
            Please select a subject with units first.
          </div>
        </div>

        <div v-if="selectedUnit" class="space-y-4">
          <div class="flex justify-between items-center mb-3">
            <label
              class="text-slate-400 text-sm font-medium uppercase tracking-wider"
              >Your Explanation</label
            >
            <!-- Voice Controls -->
            <div class="flex items-center gap-2">
              <!-- Upload Notes Button -->
              <button
                @click="triggerFileUpload"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 shadow-md transition-all"
                :disabled="uploading"
              >
                <span v-if="uploading" class="animate-spin">⏳</span>
                <span v-else>📎 Upload Notes</span>
              </button>
              <button
                v-if="isSpeechSupported"
                @click="toggleRecording"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                :class="
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                    : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-md'
                "
              >
                <span v-if="isRecording">⏹️ Stop</span>
                <span v-else>🎤 Dictate</span>
              </button>
              <button
                v-if="evaluationInput.length > 0 || uploadedFile"
                @click="clearAll"
                class="px-3 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div class="relative">
            <textarea
              v-model="evaluationInput"
              class="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none leading-relaxed custom-scrollbar hover:border-cyan-500/30 transition-colors"
              placeholder="Explain the core concepts of this topic in your own words..."
            ></textarea>
            <div
              v-if="isRecording && interimTranscript"
              class="absolute bottom-4 left-4 right-4 bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg border border-cyan-500/30 text-cyan-400 text-sm italic animate-pulse-slow"
            >
              {{ interimTranscript }}...
            </div>
          </div>
          <div class="text-right text-xs text-slate-500 mt-2">
            {{ evaluationInput.length }} characters
          </div>

          <!-- Hidden File Input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*,.pdf"
            class="hidden"
            @change="handleFileUpload"
          />

          <!-- Uploaded File Preview -->
          <div
            v-if="uploadedFile"
            class="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center"
                >
                  <span class="text-xl">{{ isImageFile ? "🖼️" : "📄" }}</span>
                </div>
                <div>
                  <p class="text-white font-medium text-sm">
                    {{ uploadedFile.name }}
                  </p>
                  <p class="text-purple-400 text-xs">
                    {{ formatFileSize(uploadedFile.size) }}
                  </p>
                </div>
              </div>
              <button
                @click="removeFile"
                class="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
            <!-- Image Preview -->
            <div v-if="isImageFile && filePreviewUrl" class="mt-3">
              <img
                :src="filePreviewUrl"
                alt="Uploaded notes preview"
                class="max-h-48 rounded-lg border border-purple-500/20 mx-auto"
              />
            </div>
            <p class="mt-3 text-xs text-purple-300/80 italic">
              📝 Your handwritten notes will be analyzed by AI along with your
              explanation
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          @click="submit"
          :disabled="
            !selectedUnit || (!evaluationInput && !uploadedFile) || evaluating
          "
          class="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
        >
          <span v-if="evaluating" class="animate-spin">⏳</span>
          {{ evaluating ? "Evaluating..." : "Evaluate Mastery" }}
        </button>
      </div>
    </div>

    <!-- RESULT: Evaluation (Result Mode) -->
    <div v-else class="max-w-3xl mx-auto animate-fade-in">
      <div
        class="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden"
      >
        <!-- Background Glow -->
        <div
          class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10"
        ></div>

        <div class="flex flex-col md:flex-row items-center gap-8 mb-8">
          <!-- Score Gauge -->
          <div
            class="relative w-40 h-40 flex items-center justify-center shrink-0"
          >
            <svg class="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                stroke-width="12"
                fill="transparent"
                class="text-slate-800"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                stroke-width="12"
                fill="transparent"
                :class="getScoreColor(result.score, 100)"
                stroke-dasharray="439.8"
                :stroke-dashoffset="439.8 - (439.8 * result.score) / 100"
                stroke-linecap="round"
                class="transition-all duration-1000 ease-out"
              />
            </svg>
            <div
              class="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span class="text-4xl font-extrabold text-white"
                >{{ result.score }}%</span
              >
              <span
                class="text-xs uppercase tracking-wider text-slate-400 font-bold"
                >Accuracy</span
              >
            </div>
          </div>

          <div class="flex-1 text-center md:text-left">
            <h2 class="text-3xl font-bold text-white mb-2">
              Evaluation Complete
            </h2>
            <p class="text-lg text-slate-300 italic">
              "{{ evaluationFeedbackSummary }}"
            </p>
          </div>
        </div>

        <div class="bg-slate-900/60 rounded-xl p-6 border border-white/5">
          <h4
            class="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3"
          >
            <span>🤖</span> AI Analysis
          </h4>
          <p class="text-slate-200 leading-relaxed whitespace-pre-wrap">
            {{ result.feedback }}
          </p>
        </div>

        <div class="mt-8 flex justify-between items-center">
          <button
            @click="$emit('back')"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Back
          </button>
          <button
            @click="reset"
            class="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
          >
            Try Another Topic
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useExamSpeech } from "../../composables/exam/useExamSpeech";
import { useToast } from "../../composables/useToast";

const props = defineProps({
  units: {
    type: Array,
    default: () => [],
  },
  result: {
    type: Object,
    default: null,
  },
  evaluating: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["back", "submit", "reset-result"]);

const selectedUnit = ref(null);
const evaluationInput = ref("");
const fileInput = ref(null);
const uploadedFile = ref(null);
const filePreviewUrl = ref(null);
const uploading = ref(false);

const {
  isSpeechSupported,
  isRecording,
  interimTranscript,
  initializeSpeechRecognition,
  toggleRecording,
} = useExamSpeech();

// Handle transcript updates from voice
onMounted(() => {
  initializeSpeechRecognition((text) => {
    evaluationInput.value += text;
  });
});

function submit() {
  if (!selectedUnit.value || (!evaluationInput.value && !uploadedFile.value))
    return;
  emit("submit", {
    unit: selectedUnit.value,
    text: evaluationInput.value,
    file: uploadedFile.value,
  });
}

function reset() {
  evaluationInput.value = "";
  selectedUnit.value = null;
  removeFile();
  emit("reset-result");
}

// File upload functions
function triggerFileUpload() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (!validTypes.includes(file.type)) {
    toast.error("Please upload an image or PDF file");
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.error("File size must be less than 10MB");
    return;
  }

  uploadedFile.value = file;

  // Create preview for images
  if (file.type.startsWith("image/")) {
    filePreviewUrl.value = URL.createObjectURL(file);
  } else {
    filePreviewUrl.value = null;
  }
}

function removeFile() {
  uploadedFile.value = null;
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value);
    filePreviewUrl.value = null;
  }
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

function clearAll() {
  evaluationInput.value = "";
  removeFile();
}

const isImageFile = computed(() => {
  return uploadedFile.value?.type?.startsWith("image/");
});

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const toast = useToast();

const evaluationFeedbackSummary = computed(() => {
  if (!props.result) return "";
  const s = props.result.score;
  if (s > 90) return "Excellent understanding of the core concepts.";
  if (s > 75) return "Good grasp of the topic, but missed some nuances.";
  if (s > 50) return "You have the basics, but need more detail.";
  return "It seems you might need to review this topic again.";
});

function getScoreColor(score, total) {
  const p = score / total;
  if (p >= 0.9) return "text-emerald-400";
  if (p >= 0.7) return "text-cyan-400";
  return "text-orange-400";
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}
</style>
