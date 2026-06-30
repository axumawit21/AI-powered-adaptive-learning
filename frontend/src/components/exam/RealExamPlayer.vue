<template>
  <div class="real-exam-player">
    <!-- Quiz Header -->
    <div class="quiz-header">
      <div class="header-left">
        <h2>{{ examTitle }}</h2>
      </div>
      <div class="header-right">
        <span class="question-counter"
          >Question {{ currentIndex + 1 }} of {{ totalQuestions }}</span
        >
        <!-- Timer Display -->
        <div
          v-if="isRealMode && timeLeft !== null"
          class="timer-display"
          :class="{
            'timer-warning': timeLeft < 60,
          }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{{ formattedTime }}</span>
        </div>
        <button @click="$emit('quit')" class="quit-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Exit Exam
        </button>
      </div>
    </div>

    <!-- Question Navigator Panel (Real Mode Only) -->
    <div v-if="isRealMode" class="question-navigator">
      <div class="navigator-header">
        <span class="navigator-title">Questions</span>
        <span class="navigator-stats">
          {{ answeredCount }}/{{ totalQuestions }} answered
        </span>
      </div>
      <div class="navigator-grid">
        <button
          v-for="(q, idx) in questions"
          :key="idx"
          @click="goToQuestion(idx)"
          class="navigator-btn"
          :class="getNavigatorBtnClass(idx)"
          :title="`Question ${idx + 1}${
            isQuestionAnswered(idx) ? ' (Answered)' : ' (Unanswered)'
          }`"
        >
          {{ idx + 1 }}
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: progressPercentage + '%' }"
      ></div>
    </div>

    <!-- Review Unanswered Modal -->
    <div v-if="showReviewModal" class="review-modal-overlay">
      <div class="review-modal">
        <h3>⚠️ Unanswered Questions</h3>
        <p>
          You have <strong>{{ unansweredCount }}</strong> unanswered
          question(s):
        </p>
        <div class="unanswered-list">
          <button
            v-for="idx in unansweredQuestions"
            :key="idx"
            @click="
              goToQuestion(idx);
              showReviewModal = false;
            "
            class="unanswered-item"
          >
            Question {{ idx + 1 }}
          </button>
        </div>
        <div class="review-modal-actions">
          <button @click="goToFirstUnanswered" class="btn-secondary">
            Review Unanswered
          </button>
          <button @click="confirmFinish" class="btn-danger">
            Submit Anyway
          </button>
        </div>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-if="quizComplete" class="results-screen">
      <div class="results-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="text-yellow-400"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18" />
          <path d="M4 22h16" />
          <path
            d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"
          />
          <path
            d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"
          />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </div>
      <h2>Exam Complete!</h2>
      <div class="score-display">
        <span class="score-value">{{ score }}/{{ totalQuestions }}</span>
        <span class="score-percentage"
          >({{ Math.round((score / totalQuestions) * 100) }}%)</span
        >
      </div>
      <p class="performance-message">{{ performanceMessage }}</p>
      <button class="btn-primary" @click="$emit('quit')">
        Back to Exam Center
      </button>
    </div>

    <!-- Question Card -->
    <div v-else-if="currentQuestion" class="question-card">
      <h3 class="question-text">{{ currentQuestion.question }}</h3>

      <!-- Question Image (if present) -->
      <div
        v-if="currentQuestion.hasImage && currentQuestion.imageUrl"
        class="question-image"
      >
        <img
          :src="getFullImageUrl(currentQuestion.imageUrl)"
          :alt="
            currentQuestion.imageDescription ||
            `Question ${currentQuestion.questionNumber} image`
          "
          class="question-img"
        />
      </div>

      <!-- MCQ Options -->
      <div
        class="options-list"
        v-if="currentQuestion.options && currentQuestion.options.length > 0"
      >
        <button
          v-for="(option, idx) in currentQuestion.options"
          :key="idx"
          @click="selectOption(option)"
          :class="getOptionClass(option)"
          :disabled="showExplanation"
          class="option-btn"
        >
          <div class="option-content">
            <span class="option-text">{{ option }}</span>
            <div
              v-if="
                currentQuestion.optionImageUrls &&
                currentQuestion.optionImageUrls[idx]
              "
              class="option-image-container"
            >
              <img
                :src="getFullImageUrl(currentQuestion.optionImageUrls[idx])"
                :alt="
                  currentQuestion.optionImageDescriptions?.[idx] ||
                  `Option ${option} image`
                "
                class="option-img"
              />
            </div>
          </div>
        </button>
      </div>

      <!-- Navigation Buttons (Real Mode) -->
      <div v-if="isRealMode" class="navigation-buttons">
        <button
          @click="goPrevious"
          :disabled="currentIndex === 0"
          class="nav-btn nav-btn-prev"
        >
          ← Previous
        </button>
        <button
          v-if="!isCurrentQuestionAnswered"
          @click="skipQuestion"
          class="nav-btn nav-btn-skip"
        >
          Skip →
        </button>
        <button
          v-else-if="!isLastQuestion"
          @click="goNext"
          class="nav-btn nav-btn-next"
        >
          Next →
        </button>
        <button
          v-if="isLastQuestion || allQuestionsAnswered"
          @click="handleFinish"
          class="nav-btn nav-btn-finish"
        >
          🏁 Finish Exam
        </button>
      </div>

      <!-- Fallback for no options -->
      <div
        v-else-if="
          !currentQuestion.options || currentQuestion.options.length === 0
        "
        class="no-options-fallback"
      >
        <p class="text-gray-400 mb-4">
          No options available for this question.
        </p>
        <button @click="nextQuestion" class="continue-btn">
          {{ isLastQuestion ? "See Results" : "Continue →" }}
        </button>
      </div>

      <!-- Feedback Area -->
      <div v-if="showFeedback" class="feedback-area" :class="feedbackClass">
        <div class="feedback-content">
          <span class="feedback-icon" v-html="feedbackIcon"></span>
          <p class="feedback-message">{{ feedbackMessage }}</p>
        </div>

        <!-- Hint (first wrong attempt) -->
        <div v-if="showHint && currentQuestion.hint" class="hint-box">
          <div class="hint-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2 1.5 3.5.8.8 1.3 1.5 1.5 2.5"
              />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            <strong>Hint:</strong>
          </div>
          <p>{{ currentQuestion.hint }}</p>
        </div>

        <!-- Explanation (after correct or second wrong) -->
        <div v-if="showExplanation" class="explanation-box">
          <div class="explanation-content">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
              />
              <path d="M8 7h6" />
              <path d="M8 11h8" />
            </svg>
            <div>
              <strong>Explanation:</strong>
              <p>{{ currentQuestion.explanation }}</p>
              <p class="correct-answer">
                <strong>Correct Answer:</strong> {{ getCorrectOptionText() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Continue Button -->
        <button
          v-if="showExplanation"
          @click="nextQuestion"
          class="continue-btn"
        >
          {{ isLastQuestion ? "See Results" : "Continue →" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps({
  examData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["quit"]);

// State
const questions = ref(props.examData.questions || []);
const examTitle = ref(props.examData.title || "Exam");
const currentIndex = ref(0);
const score = ref(0);
const selectedOption = ref("");
const showFeedback = ref(false);
const showHint = ref(false);
const showExplanation = ref(false);
const feedbackMessage = ref("");
const feedbackClass = ref("");
const feedbackIcon = ref("");
const quizComplete = ref(false);
const attempts = ref(0);
const timeLeft = ref(null);
const timerInterval = ref(null);

// Answer tracking for skip/continue feature
const answeredQuestions = ref(new Map()); // Map<questionIndex, selectedAnswer>
const showReviewModal = ref(false);

// -- Lifecycle --
function startTimer() {
  // Clear any existing timer
  if (timerInterval.value) clearInterval(timerInterval.value);

  // Set duration (default 3 hours if not specified)
  const duration = props.examData.duration || 180;
  timeLeft.value = duration * 60;

  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      stopTimer();
      quizComplete.value = true; // Auto-submit when time is up
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
}

onMounted(() => {
  if (isRealMode.value) {
    startTimer();
  }
});

onUnmounted(() => {
  stopTimer();
});

// Computed
const isRealMode = computed(() => {
  return props.examData.examType === "real";
});

const formattedTime = computed(() => {
  if (timeLeft.value === null) return "--:--:--";
  const hours = Math.floor(timeLeft.value / 3600);
  const minutes = Math.floor((timeLeft.value % 3600) / 60);
  const seconds = timeLeft.value % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
});
const totalQuestions = computed(() => questions.value.length);
const currentQuestion = computed(() => questions.value[currentIndex.value]);
const isLastQuestion = computed(
  () => currentIndex.value >= totalQuestions.value - 1
);
const progressPercentage = computed(
  () => ((currentIndex.value + 1) / totalQuestions.value) * 100
);

const performanceMessage = computed(() => {
  const pct = Math.round((score.value / totalQuestions.value) * 100);
  if (pct >= 90) return "Outstanding! You've mastered this exam!";
  if (pct >= 70) return "Great job! Keep up the good work!";
  if (pct >= 50) return "Good effort! Review the topics and try again.";
  return "Keep practicing! You'll improve with more study.";
});

// Answer tracking computed properties
const answeredCount = computed(() => answeredQuestions.value.size);
const unansweredCount = computed(
  () => totalQuestions.value - answeredQuestions.value.size
);
const unansweredQuestions = computed(() => {
  const unanswered = [];
  for (let i = 0; i < totalQuestions.value; i++) {
    if (!answeredQuestions.value.has(i)) {
      unanswered.push(i);
    }
  }
  return unanswered;
});
const allQuestionsAnswered = computed(
  () => answeredQuestions.value.size === totalQuestions.value
);
const isCurrentQuestionAnswered = computed(() =>
  answeredQuestions.value.has(currentIndex.value)
);

// Methods
function getFullImageUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${baseUrl}${relativePath}`;
}

function getCorrectOptionText() {
  // Support both 'answer' (Entrance Exams) and 'correctAnswer' (Model Exams)
  const answer =
    currentQuestion.value?.answer || currentQuestion.value?.correctAnswer || "";
  const options = currentQuestion.value?.options || [];
  return (
    options.find((o) => o.charAt(0).toUpperCase() === answer.toUpperCase()) ||
    answer
  );
}

function getOptionClass(option) {
  const optLetter = option.charAt(0).toUpperCase();
  // Support both 'answer' (Entrance Exams) and 'correctAnswer' (Model Exams)
  const correctLetter = (
    currentQuestion.value?.answer ||
    currentQuestion.value?.correctAnswer ||
    ""
  ).toUpperCase();

  if (!showExplanation.value) {
    return selectedOption.value === option ? "selected" : "";
  }

  // In Real Mode, we don't show correct/incorrect colors during exam
  if (isRealMode.value) {
    return selectedOption.value === option ? "selected" : "";
  }

  if (optLetter === correctLetter) return "correct";
  if (selectedOption.value === option && optLetter !== correctLetter)
    return "incorrect";
  return "";
}

function selectOption(option) {
  if (showExplanation.value || quizComplete.value) return;
  // Prevent changing answer in Real Mode if we already selected (waiting for auto-next)
  if (isRealMode.value && selectedOption.value) return;

  selectedOption.value = option;
  attempts.value++;

  const optLetter = option.charAt(0).toUpperCase();
  // Support both 'answer' (Entrance Exams) and 'correctAnswer' (Model Exams)
  const correctLetter = (
    currentQuestion.value?.answer ||
    currentQuestion.value?.correctAnswer ||
    ""
  ).toUpperCase();
  const isCorrect = optLetter === correctLetter;

  // Real Mode Logic - Store answer but don't auto-advance (student controls navigation)
  if (isRealMode.value) {
    // Store the answer
    answeredQuestions.value.set(currentIndex.value, option);

    // Calculate score
    if (isCorrect) score.value++;

    // Don't auto-advance - let student use Skip/Next buttons
    return;
  }

  // Practice Mode Logic
  showFeedback.value = true;

  if (isCorrect) {
    // Correct answer
    feedbackClass.value = "feedback-correct";
    feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    feedbackMessage.value = "Correct! Well done.";
    score.value++;
    showExplanation.value = true;
  } else {
    if (attempts.value < 2) {
      // First wrong attempt - show hint
      feedbackClass.value = "feedback-hint";
      feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      feedbackMessage.value = "Incorrect. Try again!";
      showHint.value = true;
      // Allow retry
      setTimeout(() => {
        selectedOption.value = "";
      }, 500);
    } else {
      // Second wrong attempt - show answer and explanation
      feedbackClass.value = "feedback-incorrect";
      feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      feedbackMessage.value = "Incorrect.";
      showExplanation.value = true;
    }
  }
}

function nextQuestion() {
  if (isLastQuestion.value) {
    if (isRealMode.value) {
      stopTimer();
    }
    quizComplete.value = true;
  } else {
    currentIndex.value++;
    resetQuestion();
  }
}

function resetQuestion() {
  // In real mode, restore the previously selected answer if exists
  if (isRealMode.value && answeredQuestions.value.has(currentIndex.value)) {
    selectedOption.value = answeredQuestions.value.get(currentIndex.value);
  } else {
    selectedOption.value = "";
  }
  showFeedback.value = false;
  showHint.value = false;
  showExplanation.value = false;
  feedbackMessage.value = "";
  attempts.value = 0;
}

// Navigation methods for skip/continue feature
function isQuestionAnswered(index) {
  return answeredQuestions.value.has(index);
}

function getNavigatorBtnClass(index) {
  if (index === currentIndex.value) return "current";
  if (answeredQuestions.value.has(index)) return "answered";
  return "unanswered";
}

function goToQuestion(index) {
  if (index >= 0 && index < totalQuestions.value) {
    currentIndex.value = index;
    resetQuestion();
  }
}

function skipQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++;
    resetQuestion();
  } else {
    // On last question, show review modal if there are unanswered questions
    handleFinish();
  }
}

function goPrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    resetQuestion();
  }
}

function goNext() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++;
    resetQuestion();
  }
}

function goToFirstUnanswered() {
  showReviewModal.value = false;
  const firstUnanswered = unansweredQuestions.value[0];
  if (firstUnanswered !== undefined) {
    goToQuestion(firstUnanswered);
  }
}

function handleFinish() {
  if (unansweredCount.value > 0) {
    showReviewModal.value = true;
  } else {
    confirmFinish();
  }
}

function confirmFinish() {
  showReviewModal.value = false;
  if (isRealMode.value) {
    stopTimer();
  }
  quizComplete.value = true;
}
</script>

<style scoped>
.real-exam-player {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #334155;
  min-height: 500px;
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-left h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.question-counter {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: #1e293b;
  border: 1px solid #475569;
  font-family: ui-monospace, monospace;
  font-size: 1rem;
  color: #22d3ee;
}

.timer-display.timer-warning {
  color: #f87171;
  border-color: #7f1d1d;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.quit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quit-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #334155;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.question-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #334155;
}

.question-text {
  font-size: 1.15rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

/* Question Image Styles */
.question-image {
  margin-bottom: 1.5rem;
  text-align: center;
}

.question-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid #475569;
  background: #0f172a;
}

.options-list {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.option-btn {
  padding: 1rem;
  text-align: left;
  background: #0f172a;
  border: 2px solid #334155;
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 1rem;
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

.option-btn:disabled {
  cursor: default;
}

.feedback-area {
  margin-top: 1.25rem;
  padding: 1rem;
  border-radius: 10px;
  border: 2px solid;
}

.feedback-correct {
  background: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
}

.feedback-incorrect {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.feedback-hint {
  background: rgba(251, 191, 36, 0.1);
  border-color: #fbbf24;
}

.feedback-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.feedback-icon {
  display: flex;
}

.feedback-correct .feedback-icon {
  color: #10b981;
}
.feedback-incorrect .feedback-icon {
  color: #ef4444;
}
.feedback-hint .feedback-icon {
  color: #fbbf24;
}

.feedback-message {
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.hint-box {
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 0.875rem;
  margin-top: 0.75rem;
  color: #fef3c7;
}

.hint-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.hint-box p {
  margin: 0;
  font-size: 0.95rem;
}

.explanation-box {
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 0.875rem;
  margin-top: 0.75rem;
}

.explanation-content {
  display: flex;
  gap: 0.75rem;
  color: #e2e8f0;
}

.explanation-content > svg {
  flex-shrink: 0;
  color: #3b82f6;
}

.explanation-content p {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
}

.correct-answer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #475569;
  color: #10b981;
}

.continue-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.continue-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

/* Results Screen */
.results-screen {
  text-align: center;
  padding: 3rem 1rem;
}

.results-icon {
  margin-bottom: 1.5rem;
  color: #fbbf24;
}

.results-screen h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 1rem;
}

.score-display {
  margin-bottom: 1rem;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #3b82f6;
}

.score-percentage {
  font-size: 1.25rem;
  color: #94a3b8;
  margin-left: 0.5rem;
}

.performance-message {
  color: #94a3b8;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.btn-primary {
  padding: 1rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #2563eb;
}

/* Option Image Styles */
.option-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.option-image-container {
  margin-top: 0.5rem;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #475569;
}

.option-img {
  display: block;
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  background: #0f172a;
}

/* Question Navigator Panel */
.question-navigator {
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  border: 1px solid #334155;
}

.navigator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.navigator-title {
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.9rem;
}

.navigator-stats {
  font-size: 0.8rem;
  color: #94a3b8;
}

.navigator-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.navigator-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid #475569;
  background: #1e293b;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navigator-btn:hover {
  border-color: #64748b;
  background: #334155;
}

.navigator-btn.current {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
}

.navigator-btn.answered {
  background: #059669;
  border-color: #059669;
  color: white;
}

.navigator-btn.unanswered {
  background: #1e293b;
  border-color: #475569;
  color: #94a3b8;
}

/* Navigation Buttons */
.navigation-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}

.nav-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn-prev {
  background: transparent;
  border: 2px solid #475569;
  color: #94a3b8;
}

.nav-btn-prev:hover:not(:disabled) {
  background: #334155;
  border-color: #64748b;
}

.nav-btn-skip {
  background: #f59e0b;
  border: none;
  color: white;
}

.nav-btn-skip:hover {
  background: #d97706;
}

.nav-btn-next {
  background: #3b82f6;
  border: none;
  color: white;
}

.nav-btn-next:hover {
  background: #2563eb;
}

.nav-btn-finish {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
}

.nav-btn-finish:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

/* Review Modal */
.review-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.review-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #334155;
  max-width: 480px;
  width: 90%;
  text-align: center;
}

.review-modal h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 1rem;
}

.review-modal > p {
  color: #e2e8f0;
  margin-bottom: 1.25rem;
}

.unanswered-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.unanswered-item {
  padding: 0.5rem 1rem;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.unanswered-item:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.review-modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-secondary {
  padding: 0.875rem 1.5rem;
  background: #3b82f6;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #2563eb;
}

.btn-danger {
  padding: 0.875rem 1.5rem;
  background: #ef4444;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

/* Mobile Responsive Styles */
@media (max-width: 640px) {
  .real-exam-player {
    padding: 1rem;
    border-radius: 12px;
    min-height: auto;
  }

  .quiz-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .header-info h2 {
    font-size: 1rem;
  }

  .question-counter {
    font-size: 0.75rem;
  }

  .quit-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  .question-card {
    padding: 1rem;
  }

  .question-text {
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }

  .options-list {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .option-btn {
    padding: 0.75rem;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  .continue-btn {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .results-screen {
    padding: 2rem 1rem;
  }

  .results-screen h2 {
    font-size: 1.5rem;
  }

  .score-value {
    font-size: 2rem;
  }

  .score-percentage {
    font-size: 1rem;
  }

  .performance-message {
    font-size: 0.95rem;
  }

  .btn-primary {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }

  /* Mobile Navigator */
  .question-navigator {
    padding: 0.75rem;
  }

  .navigator-btn {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .navigator-grid {
    gap: 0.375rem;
  }

  /* Mobile Navigation Buttons */
  .navigation-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-btn {
    min-width: 100%;
    padding: 0.75rem;
    font-size: 0.85rem;
  }

  /* Mobile Review Modal */
  .review-modal {
    padding: 1.5rem;
  }

  .review-modal h3 {
    font-size: 1.25rem;
  }

  .review-modal-actions {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-danger {
    width: 100%;
    padding: 0.75rem;
  }
}
</style>
