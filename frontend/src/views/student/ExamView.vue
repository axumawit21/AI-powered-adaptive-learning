<template>
  <!-- Exam Center: Refactored v3.1 -->
  <div
    class="h-full w-full flex flex-col p-6 overflow-hidden relative animate-fade-in"
  >
    <!-- Header Section -->
    <div class="flex justify-between items-end mb-8 shrink-0 z-10">
      <div>
        <h1
          class="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500 mb-2 tracking-tight"
        >
          Exam Center
        </h1>
        <p class="text-slate-400 font-medium">
          Test your mastery and earn badges
        </p>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 relative z-10">
      <!-- LOADING OVERLAY -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="loadingExam || submitting"
          class="absolute inset-0 z-50 flex flex-col items-center justify-center glass-panel rounded-3xl"
        >
          <div class="text-5xl animate-bounce mb-6">🤖</div>
          <h2 class="text-3xl font-bold text-white mb-2 text-glow">
            {{
              submitting ? "Analyzing Performance..." : "Crafting Your Exam..."
            }}
          </h2>
          <p class="text-slate-400">
            Our AI is preparing the perfect set of questions.
          </p>
          <div
            class="mt-8 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-cyan-500 animate-pulse w-full origin-left transform scale-x-50"
            ></div>
          </div>
        </div>
      </transition>

      <!-- VIEW 1: SELECTION DASHBOARD -->
      <div
        v-if="!session && !realExamSession && !results && !loadingExam"
        class="h-full overflow-y-auto custom-scrollbar"
      >
        <div class="max-w-6xl mx-auto space-y-12">
          <!-- Mode Cards -->
          <ExamModeSelection
            v-if="
              !showSubjectSelection &&
              !showUnitSelection &&
              !showEvaluationSelection &&
              !showRealExamSelection &&
              !showRealExamSelection &&
              !showModelExamSelection &&
              !evaluationResult
            "
            @select-mode="handleModeSelect"
          />

          <!-- Selection Modals / Lists -->
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-4"
          >
            <!-- Subject Selection -->
            <SubjectSelection
              v-if="showSubjectSelection"
              :subjects="availableSubjects"
              :selected-subject="selectedSubjectForExam"
              @select="selectSubject"
              @back="showSubjectSelection = false"
              @start-exam="startExam"
            />

            <!-- Unit Selection -->
            <UnitSelection
              v-else-if="showUnitSelection"
              :units="subject?.units"
              :selected-unit="selectedUnitForExam"
              :subject-name="subject?.title || subject?.name"
              @select="selectUnit"
              @back="showUnitSelection = false"
              @start-exam="startExamUnit"
            />

            <!-- Evaluation Selection & Results -->
            <UnderstandingEvaluation
              v-else-if="showEvaluationSelection || evaluationResult"
              :units="subject?.units"
              :result="evaluationResult"
              :evaluating="evaluating"
              @back="
                showEvaluationSelection = false;
                evaluationResult = null;
              "
              @submit="handleEvaluationSubmit"
              @reset-result="evaluationResult = null"
            />

            <!-- Real Exam Selection -->
            <RealExamSelection
              v-else-if="showRealExamSelection"
              @back="showRealExamSelection = false"
              @select-exam="handleSelectRealExam"
            />

            <!-- Model Exam Selection -->
            <ModelExamSelection
              v-else-if="showModelExamSelection"
              @back="showModelExamSelection = false"
              @select-exam="handleSelectModelExam"
            />
          </transition>
        </div>
      </div>

      <!-- VIEW: Real Exam Session -->
      <!-- VIEW: Real Exam Session -->
      <div
        v-else-if="realExamSession && !results"
        class="h-full overflow-y-auto custom-scrollbar"
      >
        <RealExamPlayer :exam-data="realExamSession" @quit="resetRealExam" />
      </div>

      <!-- VIEW 2: EXAM SESSION -->
      <ActiveExam
        v-else-if="session && !results"
        :session="session"
        :submitting="submitting"
        @quit="reset"
        @submit="handleExamSubmit"
      />

      <!-- VIEW 3: EXAM RESULTS -->
      <ExamResults v-else-if="results" :results="results" @reset="reset" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { enhancedExamApi } from "../../services/enhancedExamService";
import { useToast } from "../../composables/useToast";
import { useGlobalState } from "../../composables/useGlobalState";

// Components
import ExamModeSelection from "../../components/exam/ExamModeSelection.vue";
import SubjectSelection from "../../components/exam/SubjectSelection.vue";
import UnitSelection from "../../components/exam/UnitSelection.vue";
import UnderstandingEvaluation from "../../components/exam/UnderstandingEvaluation.vue";

import ActiveExam from "../../components/exam/ActiveExam.vue";
import ExamResults from "../../components/exam/ExamResults.vue";
import RealExamSelection from "../../components/exam/RealExamSelection.vue";
import ModelExamSelection from "../../components/exam/ModelExamSelection.vue";
import RealExamPlayer from "../../components/exam/RealExamPlayer.vue";
import { examPaperService } from "../../services/examPaperService";
import { startModelExam } from "../../services/modelExamService";

// -- Dependencies & State --
const { grade, selectedSubject, subjects } = useGlobalState();
const subject = computed(() => selectedSubject.value);
const { success, error: toastError, info } = useToast();

const history = ref([]);
const session = ref(null);
const results = ref(null);
const loadingExam = ref(false);
const submitting = ref(false);

// Local Selection State
const selectedSubjectForExam = ref(null);
const selectedUnitForExam = ref(null);
const showSubjectSelection = ref(false);
const showUnitSelection = ref(false);
const showEvaluationSelection = ref(false);
const showRealExamSelection = ref(false);
const showModelExamSelection = ref(false);
const realExamSession = ref(null);

// Evaluation State
const evaluationResult = ref(null);
const evaluating = ref(false);

const availableSubjects = computed(() => subjects.value || []);

// -- Handlers --

function handleModeSelect(mode) {
  if (mode === "real-exam") {
    showRealExamSelection.value = true;
  } else if (mode === "model-exam") {
    showModelExamSelection.value = true;
  } else if (mode === "evaluation") {
    if (!subject.value) {
      info("Please select a subject from the main menu first.");
      return;
    }
    showEvaluationSelection.value = true;
  }
}

async function handleSelectRealExam(exam) {
  try {
    loadingExam.value = true;
    const sessionData = await examPaperService.startExamSession(exam._id);
    realExamSession.value = sessionData;
    showRealExamSelection.value = false;
    success("Exam started!");
  } catch (e) {
    console.error("Failed to start exam:", e);
    toastError(e.response?.data?.message || "Failed to start exam");
  } finally {
    loadingExam.value = false;
  }
}

async function handleSelectModelExam(exam) {
  try {
    loadingExam.value = true;
    const sessionData = await startModelExam(exam.id);

    // Transform Model Exam Data for RealExamPlayer Compatibility
    // RealExamPlayer expects options as an array of strings ["A. Text", "B. Text"]
    // Model Exam returns options as an object { A: "Text", B: "Text" }
    if (sessionData.questions) {
      sessionData.questions = sessionData.questions.map((q) => {
        if (
          q.options &&
          typeof q.options === "object" &&
          !Array.isArray(q.options)
        ) {
          const transformedOptions = [];
          const labels = ["A", "B", "C", "D"];
          labels.forEach((label) => {
            if (q.options[label]) {
              transformedOptions.push(`${label}. ${q.options[label]}`);
            }
          });

          // Also check for option images map if needed, but for now just fix text options
          // If option images rely on index, we ensure A->0, B->1 order above.

          return {
            ...q,
            options: transformedOptions,
            // Ensure other fields match if needed
          };
        }
        return q;
      });
    }

    // Preserve examType from selection if not in sessionData
    if (!sessionData.examType && exam.examType) {
      sessionData.examType = exam.examType;
    }

    realExamSession.value = sessionData;
    showModelExamSelection.value = false;
    success("Model Exam started!");
  } catch (e) {
    console.error("Failed to start model exam:", e);
    toastError(e.response?.data?.message || "Failed to start model exam");
  } finally {
    loadingExam.value = false;
  }
}

function selectSubject(subj) {
  selectedSubjectForExam.value = subj;
}

function selectUnit(unit) {
  selectedUnitForExam.value = unit;
}

// -- API Methods --

// -- API Methods --

async function fetchHistory() {
  try {
    const res = await enhancedExamApi.getHistory(); // Optionally pass subjectId if needed
    // Map data for compatibility if needed
    history.value = res.map((h) => ({ ...h, _id: h.examId }));
  } catch (e) {
    console.error("Fetch history failed", e);
  }
}

// Start Subject Exam
async function startExam() {
  const examSubject = selectedSubjectForExam.value;
  if (!examSubject) return;
  await generateExam(examSubject, "subject");
}

// Start Unit Exam
async function startExamUnit() {
  if (!subject.value || !selectedUnitForExam.value) return;
  await generateExam(subject.value, "unit", selectedUnitForExam.value);
}

async function generateExam(subjObj, type, unitObj = null) {
  try {
    const subjectId = subjObj.id || subjObj._id; // Ensure we get ID
    const gradeId =
      grade.value?.id ||
      grade.value?._id ||
      (typeof grade.value === "string" ? grade.value : undefined);

    const payload = {
      subjectId: subjectId || "unknown",
      gradeId: gradeId || "grade_9", // Fallback
      type,
      questionCount: type === "subject" ? 20 : 10,
      difficulty: "progressive",
    };

    if (type === "unit" && unitObj) {
      payload.unitNumber = unitObj.unitNumber;
      payload.unitTitle = unitObj.title;
    }

    loadingExam.value = true;
    const data = await enhancedExamApi.generateExam(payload);

    // Map response to session object expected by ActiveExam
    session.value = {
      ...data,
      _id: data.examId, // Map examId to _id
      questions: data.questions,
    };

    // Reset selection UI
    showSubjectSelection.value = false;
    showUnitSelection.value = false;

    success("Exam generated successfully!");
  } catch (e) {
    console.error("Start exam failed", e);
    toastError(
      `Failed to start exam: ${e.response?.data?.message || e.message}`,
    );
  } finally {
    loadingExam.value = false;
  }
}

async function handleExamSubmit(answers) {
  submitting.value = true;
  try {
    // Format answers for API
    const formattedAnswers = Object.entries(answers).map(([idx, ans]) => ({
      questionIndex: parseInt(idx),
      answer: ans,
    }));

    const payload = {
      examId: session.value._id, // Use _id (which is examId)
      answers: formattedAnswers,
    };

    const res = await enhancedExamApi.submitExam(payload);
    results.value = res;
    session.value = null;
    fetchHistory();
    success("Exam submitted! Check your results.");
  } catch (e) {
    console.error("Submit failed", e);
    toastError("Failed to submit exam");
  } finally {
    submitting.value = false;
  }
}

async function handleEvaluationSubmit({ unit, text, file }) {
  evaluating.value = true;
  try {
    // If file is uploaded, use FormData for multipart upload
    if (file) {
      const formData = new FormData();
      formData.append(
        "grade",
        grade.value?.title || grade.value || "Unknown Grade",
      );
      formData.append(
        "subject",
        subject.value?.title || subject.value?.name || "Unknown Subject",
      );
      formData.append("unitIdentifier", unit.title || unit.name);
      formData.append("studentInput", text || "");
      formData.append("notesFile", file);

      const res = await axios.post("exam/evaluate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      evaluationResult.value = res.data;
    } else {
      // Text only - use JSON
      const payload = {
        grade: grade.value?.title || grade.value || "Unknown Grade",
        subject:
          subject.value?.title || subject.value?.name || "Unknown Subject",
        unitIdentifier: unit.title || unit.name,
        studentInput: text,
      };
      const res = await axios.post("exam/evaluate", payload);
      evaluationResult.value = res.data;
    }

    showEvaluationSelection.value = false;
    success("Evaluation complete!");
  } catch (e) {
    console.error("Evaluation failed", e);
    toastError(
      "Failed to evaluate: " + (e.response?.data?.message || e.message),
    );
  } finally {
    evaluating.value = false;
  }
}

function reset() {
  results.value = null;
  session.value = null;
  showEvaluationSelection.value = false;
  evaluationResult.value = null;
  showSubjectSelection.value = false;
  showUnitSelection.value = false;
  showRealExamSelection.value = false;
  showModelExamSelection.value = false;
  selectedSubjectForExam.value = null;
  selectedUnitForExam.value = null;
  realExamSession.value = null;
  fetchHistory(); // Refresh history
}

function resetRealExam() {
  realExamSession.value = null;
  showRealExamSelection.value = false;
  fetchHistory();
}

// -- Lifecycle --
onMounted(() => {
  fetchHistory();
});
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
