<template>
  <div class="inline-quiz-player">
    <!-- Quiz Header -->
    <div class="quiz-header">
      <div class="progress-info">
        <div class="flex justify-between items-center mb-2">
          <span class="question-counter"
            >Question {{ currentIndex + 1 }} of {{ totalQuestions }}</span
          >
          <button @click="abandon" class="abandon-btn" title="Quit Quiz">
            ✕ Close Quiz
          </button>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Results (shown after quiz complete) -->
    <div v-if="quizComplete" class="quiz-results">
      <div class="results-content">
        <div class="celebration">🎉</div>
        <h2 class="results-title">Quiz Complete!</h2>
        <div class="score-display">
          <span class="score-number">{{ score }}/{{ totalQuestions }}</span>
          <span class="score-percentage"
            >({{ Math.round((score / totalQuestions) * 100) }}%)</span
          >
        </div>
        <p class="performance-message">{{ performanceMessage }}</p>
      </div>
    </div>

    <!-- Question Display -->
    <div class="question-card" v-if="currentQuestion">
      <div class="question-header">
        <h3 class="question-text">{{ currentQuestion.question }}</h3>
        <button
          @click="showAskAI = true"
          class="ask-ai-btn"
          title="Ask AI for help understanding this question"
        >
          🤖 Ask AI
        </button>
      </div>

      <!-- MCQ Options -->
      <div v-if="questionType === 'mcq'" class="mcq-options">
        <button
          v-for="(option, index) in currentQuestion.options"
          :key="index"
          @click="selectAndSubmit(option.charAt(0))"
          :class="getOptionClass(option.charAt(0))"
          :disabled="showExplanation || quizComplete || isSubmitting"
          class="option-btn"
        >
          <span
            v-if="isSubmitting && selectedOption === option.charAt(0)"
            class="animate-spin mr-2"
            >⏳</span
          >
          {{ option }}
        </button>
      </div>

      <!-- True/False -->
      <div v-else-if="questionType === 'true-false'" class="true-false-buttons">
        <button
          v-for="val in ['true', 'false']"
          :key="val"
          @click="selectAndSubmit(val)"
          :class="getTrueFalseClass(val)"
          :disabled="showExplanation || quizComplete || isSubmitting"
          class="tf-btn"
        >
          <template v-if="isSubmitting && selectedOption === val">
            <span class="animate-spin mr-2 text-lg">⏳</span>
          </template>
          <template v-else>
            {{ val === "true" ? "✓ True" : "✗ False" }}
          </template>
        </button>
      </div>

      <!-- Fill-in-the-Blank / Short Answer -->
      <div v-else class="text-input-container">
        <input
          v-if="questionType === 'fill-blank'"
          v-model="userAnswer"
          type="text"
          placeholder="Type your answer..."
          :disabled="showExplanation || quizComplete"
          @keyup.enter="submitAnswer()"
          class="text-input"
        />
        <textarea
          v-else
          v-model="userAnswer"
          placeholder="Type your answer..."
          :disabled="showExplanation || quizComplete"
          rows="3"
          class="textarea-input"
        ></textarea>

        <!-- Submit button only for text inputs -->
        <button
          v-if="!showExplanation"
          @click="submitAnswer()"
          :disabled="!canSubmit || isSubmitting"
          class="submit-btn"
        >
          <span v-if="!isSubmitting">Submit Answer</span>
          <span v-else class="flex items-center gap-2 justify-center">
            <span class="animate-spin text-lg">⏳</span> Submitting...
          </span>
        </button>
      </div>

      <!-- Feedback Area -->
      <div v-if="showFeedback" class="feedback-area" :class="feedbackClass">
        <div class="feedback-content">
          <span class="feedback-icon">{{ feedbackIcon }}</span>
          <p class="feedback-message">{{ feedbackMessage }}</p>
        </div>

        <!-- Hint (Persistent) -->
        <div v-if="showHint" class="hint-box">
          <strong>💡 Hint:</strong> {{ currentHint }}
        </div>

        <!-- Explanation -->
        <div v-if="showExplanation" class="explanation-box">
          <strong>📖 Explanation:</strong> {{ currentExplanation }}
          <p class="correct-answer-text">
            <strong>Correct Answer:</strong> {{ correctAnswer }}
          </p>
        </div>

        <!-- Continue Button -->
        <button
          v-if="showExplanation"
          @click="nextQuestion"
          class="continue-btn"
          :disabled="isSubmitting"
        >
          {{ isLastQuestion ? "See Results" : "Continue →" }}
        </button>
      </div>
    </div>

    <!-- Quit Confirmation Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showQuitConfirm"
          class="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          @click.self="showQuitConfirm = false"
        >
          <div
            class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all"
          >
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center"
              >
                <span class="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">Quit Quiz?</h3>
                <p class="text-sm text-slate-400">
                  Your progress will not be saved
                </p>
              </div>
            </div>
            <p class="text-slate-300 text-sm mb-6">
              Are you sure you want to quit this quiz? You'll lose all your
              current progress.
            </p>
            <div class="flex gap-3">
              <button
                @click="showQuitConfirm = false"
                class="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Continue Quiz
              </button>
              <button
                @click="confirmQuit"
                class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors"
              >
                Quit Quiz
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Ask AI Modal -->
    <AskAIModal
      :visible="showAskAI"
      :questionId="currentQuestion?.questionId || ''"
      :questionText="currentQuestion?.question || ''"
      :gradeTitle="currentQuestion?.gradeTitle || quizData.gradeTitle || ''"
      :subjectTitle="
        currentQuestion?.subjectTitle || quizData.subjectTitle || ''
      "
      :unitNumber="currentQuestion?.unitNumber || quizData.unitNumber || 1"
      :unitTitle="currentQuestion?.unitTitle || quizData.unitTitle || ''"
      :subunitNumber="currentQuestion?.subunitNumber || ''"
      :subunitTitle="currentQuestion?.subunitTitle || ''"
      @close="showAskAI = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { enhancedQuizApi } from "../../services/enhancedQuizService";
import AskAIModal from "./AskAIModal.vue";

const emit = defineEmits(["close"]);

const props = defineProps({
  quizData: {
    type: Object,
    required: true,
  },
});

// State
const sessionId = ref(props.quizData.sessionId);
const currentQuestion = ref(props.quizData.currentQuestion);
const currentIndex = ref(props.quizData.currentIndex || 0);
const totalQuestions = ref(props.quizData.totalQuestions);
const score = ref(props.quizData.score || 0);
const userAnswer = ref("");
const selectedOption = ref("");
const showFeedback = ref(false);
const feedbackMessage = ref("");
const feedbackClass = ref("");
const feedbackIcon = ref("");
const showHint = ref(false);
const showExplanation = ref(false);
const currentHint = ref("");
const currentExplanation = ref("");
const correctAnswer = ref("");
const quizComplete = ref(false);
const isSubmitting = ref(false);
const showAskAI = ref(false);
const showQuitConfirm = ref(false);

// Computed
const questionType = computed(() => currentQuestion.value?.type || "mcq");

const progressPercentage = computed(() => {
  return ((currentIndex.value + 1) / totalQuestions.value) * 100;
});

const isLastQuestion = computed(() => {
  return currentIndex.value >= totalQuestions.value - 1;
});

const canSubmit = computed(() => {
  if (questionType.value === "mcq" || questionType.value === "true-false") {
    return selectedOption.value !== "";
  }
  return userAnswer.value.trim() !== "";
});

const performanceMessage = computed(() => {
  const pct = Math.round((score.value / totalQuestions.value) * 100);
  if (pct >= 90) return "Outstanding! You've mastered this topic!";
  if (pct >= 70) return "Great job! Keep up the good work!";
  if (pct >= 50) return "Good effort! Review and try again.";
  return "Keep practicing! You'll get better!";
});

// Methods
function selectOption(option) {
  selectedOption.value = option;
  userAnswer.value = option;
}

function getOptionClass(option) {
  if (!showExplanation.value) {
    return selectedOption.value === option ? "selected" : "";
  }

  // USE correctAnswer obtained from backend, as answer is hidden in the question object
  const correctOpt = (correctAnswer.value || "").toUpperCase();
  if (option.toUpperCase() === correctOpt) {
    return "correct";
  }
  if (
    option.toUpperCase() === selectedOption.value.toUpperCase() &&
    selectedOption.value.toUpperCase() !== correctOpt
  ) {
    return "incorrect";
  }
  return "";
}

function getTrueFalseClass(value) {
  if (!showExplanation.value) {
    return selectedOption.value === value ? "selected" : "";
  }

  const correctAns = (correctAnswer.value || "").toLowerCase();
  if (value === correctAns) {
    return "correct";
  }
  if (value === selectedOption.value && selectedOption.value !== correctAns) {
    return "incorrect";
  }
  return "";
}

// Auto-submit when option is selected (for MCQ and True/False)
function selectAndSubmit(option) {
  if (showExplanation.value || quizComplete.value || isSubmitting.value) return;

  selectedOption.value = option;
  userAnswer.value = option;

  // Auto-submit immediately with the specific option to avoid reactivity lag
  submitAnswer(option);
}

const attempts = ref(0);

async function submitAnswer(overriddenAnswer = null) {
  // Ensure we don't treat Vue/click events as answers
  let actualAnswer = "";
  if (typeof overriddenAnswer === "string") {
    actualAnswer = overriddenAnswer;
  } else {
    actualAnswer = userAnswer.value;
  }

  if (!actualAnswer && !selectedOption.value) return;
  if (showExplanation.value) return;
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  attempts.value++;

  try {
    const response = await enhancedQuizApi.submitAnswer({
      sessionId: sessionId.value,
      answer: actualAnswer,
    });

    // Valid response received
    showFeedback.value = true;
    showHint.value = false;

    if (response.correct) {
      // 1. Correct Answer (1st or 2nd try) -> Show Success & Continue
      feedbackClass.value = "feedback-correct";
      feedbackIcon.value = "✅";
      feedbackMessage.value = response.message || "Correct! Well done.";

      score.value++; // Increment score for correct answer

      showExplanation.value = true;
      currentExplanation.value = response.explanation || "Great job!";
      correctAnswer.value =
        response.correctAnswer || currentQuestion.value.answer;
    } else {
      // Incorrect Answer
      if (attempts.value < 2) {
        // 2. Incorrect (First Attempt) -> Show Hint & Retry
        feedbackClass.value = "feedback-hint";
        feedbackIcon.value = "⚠️";
        feedbackMessage.value = "Incorrect. Here is a hint.";

        if (response.hint) {
          showHint.value = true;
          currentHint.value = response.hint;
        } else {
          showHint.value = true;
          currentHint.value = "Review the question and try again.";
        }

        showExplanation.value = false;

        // Clear the answer for a retry (Wait a tiny bit so they see the result)
        // ONLY clear if they haven't started typing a new answer yet
        const currentVal = userAnswer.value;
        const currentOpt = selectedOption.value;
        setTimeout(() => {
          if (userAnswer.value === currentVal) userAnswer.value = "";
          if (selectedOption.value === currentOpt) selectedOption.value = "";
        }, 800);
      } else {
        // 3. Incorrect (Second Attempt) -> Show Correct Answer & Continue
        feedbackClass.value = "feedback-incorrect";
        feedbackIcon.value = "❌";
        feedbackMessage.value = "Incorrect.";

        showExplanation.value = true;
        currentExplanation.value =
          response.explanation || "No explanation available.";
        correctAnswer.value =
          response.correctAnswer || currentQuestion.value.answer;
      }
    }
  } catch (error) {
    console.error("Error submitting answer:", error);
    showFeedback.value = true;
    feedbackClass.value = "feedback-incorrect";
    feedbackIcon.value = "⚠️";
    feedbackMessage.value = "Error submitting answer. Please try again.";
    attempts.value--;
  } finally {
    isSubmitting.value = false;
  }
}

async function nextQuestion() {
  try {
    const response = await enhancedQuizApi.nextQuestion(sessionId.value);

    if (response.finished) {
      quizComplete.value = true;
    } else {
      currentQuestion.value = response.question;
      currentIndex.value++;
      resetQuestion();
    }
  } catch (error) {
    console.error("Error getting next question:", error);
  }
}

function resetQuestion() {
  userAnswer.value = "";
  selectedOption.value = "";
  showFeedback.value = false;
  showHint.value = false;
  showExplanation.value = false;
  feedbackMessage.value = "";
  currentHint.value = "";
  currentExplanation.value = "";
  correctAnswer.value = "";
  attempts.value = 0;
}

async function abandon() {
  showQuitConfirm.value = true;
}

async function confirmQuit() {
  showQuitConfirm.value = false;
  try {
    await enhancedQuizApi.abandonQuiz(sessionId.value);
  } catch (e) {
    console.error("Error abandoning quiz", e);
  }
  emit("close");
}

import { onMounted } from "vue";
onMounted(() => {
  console.log("InlineQuizPlayer loaded - Version: 2025-12-18 14:55");
});
</script>

<style scoped>
.inline-quiz-player {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #334155;
}

.quiz-header {
  margin-bottom: 1.5rem;
}

.question-counter {
  display: block;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #334155;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.question-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #334155;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.question-header .question-text {
  margin-bottom: 0;
  flex: 1;
}

.ask-ai-btn {
  padding: 0.5rem 0.875rem;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.ask-ai-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.question-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

/* MCQ Options */
.mcq-options {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.option-btn {
  padding: 0.875rem 1rem;
  text-align: left;
  background: #0f172a;
  border: 2px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn:hover:not(:disabled) {
  background: #1e293b;
  border-color: #475569;
}

.option-btn.selected {
  background: #1e3a8a;
  border-color: #3b82f6;
}

.option-btn.correct {
  background: #064e3b;
  border-color: #10b981;
  color: #d1fae5;
}

.option-btn.incorrect {
  background: #7f1d1d;
  border-color: #ef4444;
  color: #fecaca;
}

/* True/False */
.true-false-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tf-btn {
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;
  background: #0f172a;
  color: #e2e8f0;
  border-color: #334155;
}

.tf-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.tf-btn.selected {
  border-color: #3b82f6;
  background: #1e3a8a;
}

.tf-btn.correct {
  background: #064e3b;
  border-color: #10b981;
  color: #d1fae5;
}

.tf-btn.incorrect {
  background: #7f1d1d;
  border-color: #ef4444;
  color: #fecaca;
}

/* Text Inputs */
.text-input,
.textarea-input {
  width: 100%;
  padding: 0.875rem;
  font-size: 0.95rem;
  border: 2px solid #334155;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: inherit;
  margin-bottom: 1rem;
}

.text-input:focus,
.textarea-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.textarea-input {
  resize: vertical;
}

/* Buttons */
.submit-btn,
.continue-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.continue-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.continue-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

.continue-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

.abandon-btn {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.abandon-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.items-center {
  align-items: center;
}
.mb-2 {
  margin-bottom: 0.5rem;
}

/* Feedback */
.feedback-area {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid;
}

.feedback-correct {
  background: #064e3b;
  border-color: #10b981;
}

.feedback-incorrect {
  background: #7f1d1d;
  border-color: #ef4444;
}

.feedback-hint {
  background: #78350f;
  border-color: #fbbf24;
  color: #fef3c7;
}

.feedback-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.feedback-icon {
  font-size: 1.5rem;
}

.feedback-message {
  font-weight: 600;
  color: #f1f5f9;
}

.hint-box {
  background: #78350f;
  border: 2px solid #fbbf24;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  color: #fef3c7;
  font-size: 0.9rem;
}

.explanation-box {
  background: #1e293b;
  border: 2px solid #64748b;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.correct-answer-text {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #475569;
  color: #10b981;
}

/* Results */
.quiz-results {
  text-align: center;
  padding: 2rem 1rem;
}

.celebration {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.results-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 1rem;
}

.score-display {
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .inline-quiz-player {
    padding: 1rem;
    border-radius: 12px;
  }

  .question-card {
    padding: 1rem;
  }

  .question-text {
    font-size: 0.95rem;
    margin-bottom: 0.75rem;
  }

  .ask-ai-btn {
    padding: 0.35rem 0.6rem;
    font-size: 0.7rem;
  }

  .option-btn,
  .tf-btn {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .quiz-header {
    margin-bottom: 1rem;
  }
}

.score-number {
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
  margin-right: 0.5rem;
}

.score-percentage {
  font-size: 1.25rem;
  color: #94a3b8;
}

.performance-message {
  color: #cbd5e1;
  font-size: 1rem;
  line-height: 1.5;
}
</style>
