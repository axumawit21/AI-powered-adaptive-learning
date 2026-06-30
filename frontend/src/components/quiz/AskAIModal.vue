<template>
  <div v-if="visible" class="ask-ai-overlay" @click.self="close">
    <div class="ask-ai-modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <span class="header-icon">🤖</span>
          <h3>Ask AI Tutor</h3>
        </div>
        <button @click="close" class="close-btn">✕</button>
      </div>

      <!-- Question Context -->
      <div class="question-context">
        <div class="context-label">📝 Current Question:</div>
        <p class="context-text">{{ questionText }}</p>
        <div v-if="unitTitle" class="context-topic">
          📚 {{ unitTitle }}{{ subunitTitle ? ` - ${subunitTitle}` : "" }}
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="welcome-message">
          <span class="welcome-icon">💡</span>
          <p>Hi! I'm here to help you understand this question.</p>
          <p class="welcome-hint">
            Ask me anything about the concept - but I won't give away the
            answer! 😉
          </p>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['message', msg.role]"
        >
          <div class="message-avatar">
            {{ msg.role === "user" ? "👤" : "🤖" }}
          </div>
          <div class="message-content">
            <p>{{ msg.content }}</p>
            <div
              v-if="msg.sources && msg.sources.length > 0"
              class="message-sources"
            >
              <small
                >📚 Sources:
                {{ msg.sources.map((s) => s.unitTitle).join(", ") }}</small
              >
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="message assistant loading">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <input
          v-model="userMessage"
          @keyup.enter="sendMessage"
          placeholder="Ask about this concept..."
          :disabled="isLoading"
          class="message-input"
        />
        <button
          @click="sendMessage"
          :disabled="!userMessage.trim() || isLoading"
          class="send-btn"
        >
          {{ isLoading ? "..." : "Send" }}
        </button>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="close" class="continue-btn">← Back to Quiz</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { questionBankApi } from "../../services/questionBank";

const props = defineProps({
  visible: { type: Boolean, default: false },
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  gradeTitle: { type: String, required: true },
  subjectTitle: { type: String, required: true },
  unitNumber: { type: Number, required: true },
  unitTitle: { type: String, required: true },
  subunitNumber: { type: String, default: "" },
  subunitTitle: { type: String, default: "" },
});

const emit = defineEmits(["close"]);

const messages = ref([]);
const userMessage = ref("");
const isLoading = ref(false);
const messagesContainer = ref(null);

// Reset messages when modal opens with new question
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      messages.value = [];
      userMessage.value = "";
    }
  }
);

// Auto-scroll to bottom when new message
watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }
);

async function sendMessage() {
  const msg = userMessage.value.trim();
  if (!msg || isLoading.value) return;

  // Add user message
  messages.value.push({ role: "user", content: msg });
  userMessage.value = "";
  isLoading.value = true;

  try {
    const response = await questionBankApi.askAI({
      questionId: props.questionId,
      userMessage: msg,
      questionText: props.questionText,
      gradeTitle: props.gradeTitle,
      subjectTitle: props.subjectTitle,
      unitNumber: props.unitNumber,
      unitTitle: props.unitTitle,
      subunitNumber: props.subunitNumber || undefined,
      subunitTitle: props.subunitTitle || undefined,
    });

    messages.value.push({
      role: "assistant",
      content: response.answer,
      sources: response.sources || [],
    });
  } catch (error) {
    console.error("Ask AI error:", error);
    messages.value.push({
      role: "assistant",
      content: "Sorry, I encountered an error. Please try again.",
    });
  } finally {
    isLoading.value = false;
  }
}

function close() {
  emit("close");
}
</script>

<style scoped>
.ask-ai-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.ask-ai-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid #334155;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #334155;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  font-size: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #f1f5f9;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #f1f5f9;
  background: #334155;
}

.question-context {
  padding: 1rem 1.25rem;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.context-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.context-text {
  color: #e2e8f0;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.context-topic {
  font-size: 0.8rem;
  color: #94a3b8;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  min-height: 200px;
  max-height: 300px;
}

.welcome-message {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
}

.welcome-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

.welcome-message p {
  margin: 0 0 0.5rem 0;
}

.welcome-hint {
  font-size: 0.85rem;
  opacity: 0.8;
}

.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: #334155;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #3b82f6;
}

.message.assistant .message-avatar {
  background: #10b981;
}

.message-content {
  background: #334155;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  max-width: 85%;
}

.message.user .message-content {
  background: #1e3a8a;
}

.message-content p {
  margin: 0;
  color: #f1f5f9;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-sources {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #475569;
  color: #94a3b8;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 0.5rem 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #64748b;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.input-area {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #334155;
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #0f172a;
  color: #f1f5f9;
  font-size: 0.9rem;
}

.message-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.message-input::placeholder {
  color: #64748b;
}

.send-btn {
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #334155;
}

.continue-btn {
  width: 100%;
  padding: 0.75rem;
  background: #334155;
  color: #e2e8f0;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.continue-btn:hover {
  background: #475569;
}
</style>
