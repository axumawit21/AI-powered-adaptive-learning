<template>
  <div class="upload-quiz-player">
    <!-- Quiz Header -->
    <div class="quiz-header">
      <div class="flex justify-between items-center mb-2">
        <span class="question-counter"
          >Question {{ currentIndex + 1 }} of {{ totalQuestions }}</span
        >
        <button @click="$emit('close')" class="abandon-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Close Quiz
        </button>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
    </div>

    <!-- Results (shown after quiz complete) -->
    <div v-if="quizComplete" class="quiz-results">
      <div class="celebration">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-yellow-400 mx-auto"
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
      <h2 class="results-title">Quiz Complete!</h2>
      <div class="score-display">
        <span class="score-number">{{ score }}/{{ totalQuestions }}</span>
        <span class="score-percentage"
          >({{ Math.round((score / totalQuestions) * 100) }}%)</span
        >
      </div>
      <p class="performance-message">{{ performanceMessage }}</p>
    </div>

    <!-- Question Display -->
    <div class="question-card" v-if="!quizComplete && currentQuestion">
      <h3 class="question-text">{{ currentQuestion.question }}</h3>

      <!-- MCQ Options (when options exist) -->
      <div
        v-if="currentQuestion.options && currentQuestion.options.length"
        class="mcq-options"
      >
        <button
          v-for="(option, index) in currentQuestion.options"
          :key="index"
          @click="selectAndSubmit(option)"
          :class="getOptionClass(option)"
          :disabled="showExplanation"
          class="option-btn"
        >
          {{ option }}
        </button>
      </div>

      <!-- True/False Buttons -->
      <div v-else-if="questionType === 'true-false'" class="true-false-buttons">
        <button
          v-for="val in ['True', 'False']"
          :key="val"
          @click="submitTrueFalse(val)"
          :class="getTrueFalseClass(val)"
          :disabled="showExplanation"
          class="tf-btn flex items-center justify-center gap-2"
        >
          <svg
            v-if="val === 'True'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {{ val }}
        </button>
      </div>

      <!-- Fill-in-the-Blank / Short Answer -->
      <div v-else class="text-input-container">
        <input
          v-model="userAnswer"
          type="text"
          placeholder="Type your answer..."
          :disabled="showExplanation"
          @keyup.enter="submitTextAnswer"
          class="text-input"
        />
        <button
          v-if="!showExplanation"
          @click="submitTextAnswer"
          :disabled="!userAnswer.trim()"
          class="submit-btn"
        >
          Submit Answer
        </button>
      </div>

      <!-- Feedback Area -->
      <div v-if="showFeedback" class="feedback-area" :class="feedbackClass">
        <div class="feedback-content">
          <span class="feedback-icon" v-html="feedbackIcon"></span>
          <p class="feedback-message">{{ feedbackMessage }}</p>
        </div>

        <!-- Hint -->
        <div v-if="showHint && currentQuestion.hint" class="hint-box">
          <div class="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0 mt-0.5"
            >
              <path
                d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2 1.5 3.5.8.8 1.3 1.5 1.5 2.5"
              />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            <div><strong>Hint:</strong> {{ currentQuestion.hint }}</div>
          </div>
        </div>

        <!-- Explanation -->
        <div v-if="showExplanation" class="explanation-box">
          <div class="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0 mt-0.5"
            >
              <path
                d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
              />
              <path d="M8 7h6" />
              <path d="M8 11h8" />
            </svg>
            <div>
              <strong>Explanation:</strong> {{ currentQuestion.explanation }}
              <p class="correct-answer-text">
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
import { ref, computed } from "vue";

const emit = defineEmits(["close"]);

const props = defineProps({
  quizData: {
    type: Object,
    required: true,
  },
});

// State
const questions = ref(props.quizData.questions || []);
const currentIndex = ref(0);
const score = ref(0);
const selectedOption = ref("");
const userAnswer = ref("");
const showFeedback = ref(false);
const showHint = ref(false);
const showExplanation = ref(false);
const feedbackMessage = ref("");
const feedbackClass = ref("");
const feedbackIcon = ref("");
const quizComplete = ref(false);
const attempts = ref(0);

// Computed
const totalQuestions = computed(() => questions.value.length);
const currentQuestion = computed(() => questions.value[currentIndex.value]);
const isLastQuestion = computed(
  () => currentIndex.value >= totalQuestions.value - 1
);
const progressPercentage = computed(
  () => ((currentIndex.value + 1) / totalQuestions.value) * 100
);

const questionType = computed(() => {
  const q = currentQuestion.value;
  if (!q) return "mcq";
  if (q.type) return q.type.toLowerCase();
  if (q.options && q.options.length) return "mcq";
  const question = (q.question || "").toLowerCase();
  if (question.includes("true or false") || question.includes("true/false"))
    return "true-false";
  if (question.includes("_____") || question.includes("fill in"))
    return "fill-blank";
  return "short-answer";
});

const performanceMessage = computed(() => {
  const pct = Math.round((score.value / totalQuestions.value) * 100);
  if (pct >= 90) return "Outstanding! You've mastered this topic!";
  if (pct >= 70) return "Great job! Keep up the good work!";
  if (pct >= 50) return "Good effort! Review and try again.";
  return "Keep practicing! You'll get better!";
});

// Methods
function getCorrectOptionText() {
  const answer = currentQuestion.value?.answer || "";
  const options = currentQuestion.value?.options || [];
  // Find option that starts with the answer letter
  return (
    options.find((o) => o.charAt(0).toUpperCase() === answer.toUpperCase()) ||
    answer
  );
}

function getOptionClass(option) {
  const optLetter = option.charAt(0).toUpperCase();
  const correctLetter = (currentQuestion.value?.answer || "").toUpperCase();

  if (!showExplanation.value) {
    return selectedOption.value === option ? "selected" : "";
  }

  if (optLetter === correctLetter) return "correct";
  if (selectedOption.value === option && optLetter !== correctLetter)
    return "incorrect";
  return "";
}

function getTrueFalseClass(val) {
  if (!showExplanation.value) {
    return selectedOption.value === val ? "selected" : "";
  }
  const correctAns = (currentQuestion.value?.answer || "").toLowerCase();
  if (val.toLowerCase() === correctAns) return "correct";
  if (selectedOption.value === val && val.toLowerCase() !== correctAns)
    return "incorrect";
  return "";
}

function selectAndSubmit(option) {
  if (showExplanation.value || quizComplete.value) return;

  selectedOption.value = option;
  attempts.value++;

  const optLetter = option.charAt(0).toUpperCase();
  const correctLetter = (currentQuestion.value?.answer || "").toUpperCase();
  const isCorrect = optLetter === correctLetter;

  showFeedback.value = true;

  if (isCorrect) {
    feedbackClass.value = "feedback-correct";
    feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    feedbackMessage.value = "Correct! Well done.";
    score.value++;
    showExplanation.value = true;
  } else {
    if (attempts.value < 2) {
      // First wrong attempt - show hint
      feedbackClass.value = "feedback-hint";
      feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      feedbackMessage.value = "Incorrect. Try again!";
      showHint.value = true;
      // Clear selection for retry
      setTimeout(() => {
        selectedOption.value = "";
      }, 500);
    } else {
      // Second wrong attempt - show answer
      feedbackClass.value = "feedback-incorrect";
      feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      feedbackMessage.value = "Incorrect.";
      showExplanation.value = true;
    }
  }
}

// True/False submission
function submitTrueFalse(val) {
  if (showExplanation.value || quizComplete.value) return;

  selectedOption.value = val;
  attempts.value++;

  const correctAns = (currentQuestion.value?.answer || "").toLowerCase();
  const isCorrect = val.toLowerCase() === correctAns;

  showFeedback.value = true;

  if (isCorrect) {
    feedbackClass.value = "feedback-correct";
    feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    feedbackMessage.value = "Correct! Well done.";
    score.value++;
    showExplanation.value = true;
  } else {
    if (attempts.value < 2) {
      feedbackClass.value = "feedback-hint";
      feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      feedbackMessage.value = "Incorrect. Try again!";
      showHint.value = true;
      setTimeout(() => {
        selectedOption.value = "";
      }, 500);
    } else {
      feedbackClass.value = "feedback-incorrect";
      feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      feedbackMessage.value = "Incorrect.";
      showExplanation.value = true;
    }
  }
}

// Text answer submission
function submitTextAnswer() {
  if (!userAnswer.value.trim() || showExplanation.value || quizComplete.value)
    return;

  attempts.value++;

  const correctAns = (currentQuestion.value?.answer || "").toLowerCase().trim();
  const userAns = userAnswer.value.toLowerCase().trim();
  const isCorrect =
    correctAns.includes(userAns) || userAns.includes(correctAns);

  showFeedback.value = true;

  if (isCorrect) {
    feedbackClass.value = "feedback-correct";
    feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    feedbackMessage.value = "Correct! Well done.";
    score.value++;
    showExplanation.value = true;
  } else {
    if (attempts.value < 2) {
      feedbackClass.value = "feedback-hint";
      feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      feedbackMessage.value = "Incorrect. Try again!";
      showHint.value = true;
    } else {
      feedbackClass.value = "feedback-incorrect";
      feedbackIcon.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      feedbackMessage.value = "Incorrect.";
      showExplanation.value = true;
    }
  }
}

function nextQuestion() {
  if (isLastQuestion.value) {
    quizComplete.value = true;
  } else {
    currentIndex.value++;
    resetQuestion();
  }
}

function resetQuestion() {
  selectedOption.value = "";
  userAnswer.value = "";
  showFeedback.value = false;
  showHint.value = false;
  showExplanation.value = false;
  feedbackMessage.value = "";
  attempts.value = 0;
}
</script>

<style scoped>
.upload-quiz-player {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #334155;
}

.quiz-header {
  margin-bottom: 1.5rem;
}
.question-counter {
  font-size: 0.85rem;
  color: #94a3b8;
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
  background: #3b82f6;
  transition: width 0.3s ease;
}

.question-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #334155;
}

.question-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

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

/* True/False Buttons */
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
  border: 2px solid #334155;
  cursor: pointer;
  transition: all 0.2s;
  background: #0f172a;
  color: #e2e8f0;
}
.tf-btn:hover:not(:disabled) {
  background: #1e293b;
  border-color: #475569;
}
.tf-btn.selected {
  background: #1e3a8a;
  border-color: #3b82f6;
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

/* Text Input */
.text-input-container {
  margin-bottom: 1rem;
}
.text-input {
  width: 100%;
  padding: 0.875rem;
  font-size: 0.95rem;
  border: 2px solid #334155;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: inherit;
  margin-bottom: 0.75rem;
}
.text-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.submit-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: #3b82f6;
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
  gap: 6px;
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

.continue-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: #10b981;
  color: white;
  margin-top: 1rem;
}
.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

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
