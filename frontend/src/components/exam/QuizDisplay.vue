<template>
  <div class="flex flex-col gap-4 w-full max-w-3xl">
    <div
      v-for="(q, index) in questions"
      :key="index"
      class="p-4 rounded-xl bg-slate-700/80 border border-slate-600 shadow-md transition-all duration-300"
    >
      <!-- Question Header -->
      <div
        class="font-semibold text-white mb-3 text-lg flex justify-between items-start gap-4"
      >
        <span>{{ index + 1 }}. {{ q.question }}</span>
        <span
          v-if="getQuestionState(index).status === 'correct'"
          class="text-green-400 text-2xl"
          >✅</span
        >
        <span
          v-else-if="getQuestionState(index).status === 'failed'"
          class="text-red-400 text-2xl"
          >❌</span
        >
      </div>

      <!-- Options -->
      <ul class="space-y-2">
        <li
          v-for="(opt, optIndex) in q.options"
          :key="optIndex"
          @click="selectOption(index, opt)"
          :class="getOptionClass(index, opt)"
          class="p-3 rounded-lg border transition-all cursor-pointer relative"
        >
          <span class="font-medium text-slate-200">{{ opt }}</span>
        </li>
      </ul>

      <!-- Feedback Area -->
      <div
        v-if="getQuestionState(index).feedback"
        class="mt-4 p-3 rounded-lg text-sm border"
        :class="getFeedbackClass(index)"
      >
        <div class="font-bold mb-1">
          {{ getQuestionState(index).feedbackTitle }}
        </div>
        <div>{{ getQuestionState(index).feedback }}</div>
      </div>

      <!-- Hint (Attempt 1 Fail) -->
      <div
        v-if="getQuestionState(index).showHint"
        class="mt-3 text-yellow-300 bg-yellow-900/40 p-2 rounded-lg text-sm border border-yellow-700/50"
      >
        💡 <b>Hint:</b> {{ q.hint }}
      </div>

      <!-- Explanation (Success or Fail) -->
      <div
        v-if="getQuestionState(index).showExplanation"
        class="mt-3 text-slate-300 bg-slate-800/80 p-3 rounded-lg text-sm border border-slate-700"
      >
        <div class="font-bold text-cyan-400 mb-1">Explanation:</div>
        {{ q.explanation }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";

const props = defineProps({
  questions: { type: Array, required: true },
});

// State tracking for each question
// Key: question index, Value: { attempts: number, status: 'pending'|'correct'|'failed', ... }
const questionStates = reactive({});

function getQuestionState(index) {
  if (!questionStates[index]) {
    questionStates[index] = {
      attempts: 0,
      status: "pending",
      feedback: null,
      feedbackTitle: "",
      showHint: false,
      showExplanation: false,
      selectedOption: null,
    };
  }
  return questionStates[index];
}

function getOptionLetter(opt) {
  // Assumes option starts with "A) " or "A. " or just assumes the choice text matches answer
  // Backend returns answer as "A", "B"... and options likely "A) Text"
  // We need to robustly check.
  const match = opt.match(/^([A-D])[\)\.]/i);
  return match ? match[1].toUpperCase() : null;
}

function selectOption(qIndex, optionText) {
  const state = getQuestionState(qIndex);
  if (state.status !== "pending") return; // Already finished

  state.selectedOption = optionText;

  // Extract letter from option if present, or compare full text?
  // Backend says answer is "A".
  const selectedLetter = getOptionLetter(optionText);
  const correctLetter = props.questions[qIndex].answer.toUpperCase(); // "A", "B"...

  const isCorrect = selectedLetter === correctLetter;

  state.attempts++;

  if (isCorrect) {
    // CORRECT
    state.status = "correct";
    state.feedbackTitle =
      state.attempts === 1 ? "🌟 Brilliant!" : "✨ Well done!";
    state.feedback = "You got the correct answer!";
    state.showExplanation = true;
    state.showHint = false;
  } else {
    // WRONG
    if (state.attempts === 1) {
      // First fail
      state.status = "pending"; // Allow retry
      state.feedbackTitle = "Not quite...";
      state.feedback = "Review the hint and try again.";
      state.showHint = true;
    } else {
      // Second fail -> Failed
      state.status = "failed";
      state.feedbackTitle = "Keep learning!";
      state.feedback = `The correct answer was ${correctLetter}.`;
      state.showExplanation = true;
      state.showHint = false;
    }
  }
}

function getOptionClass(qIndex, optionText) {
  const state = getQuestionState(qIndex);
  const isSelected = state.selectedOption === optionText;
  const letter = getOptionLetter(optionText);
  const isCorrect = letter === props.questions[qIndex].answer.toUpperCase();

  // Base style
  let classes = "bg-slate-800/50 border-transparent hover:bg-slate-750";

  if (state.status === "correct" && isCorrect) {
    return "bg-green-900/40 border-green-500/50 text-green-100 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
  }

  if (state.status === "failed") {
    if (isCorrect)
      return "bg-green-900/30 border-green-500/30 text-green-200/70"; // Show correct one faintly
    if (isSelected) return "bg-red-900/40 border-red-500/50 text-red-100";
  }

  if (state.attempts === 1 && state.status === "pending" && isSelected) {
    // Wrong first attempt
    return "bg-yellow-900/30 border-yellow-500/50 text-yellow-100";
  }

  return classes;
}

function getFeedbackClass(index) {
  const state = getQuestionState(index);
  if (state.status === "correct")
    return "bg-green-900/20 border-green-500/30 text-green-200";
  if (state.status === "failed")
    return "bg-slate-800 border-slate-600 text-slate-300";
  return "bg-yellow-900/20 border-yellow-500/30 text-yellow-200";
}
</script>
